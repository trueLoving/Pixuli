import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// AI 模型配置接口 - 支持 Qwen LLM, Ollama, Shimmy
export interface AIModelConfig {
  id: string;
  name: string;
  type: 'qwen-llm' | 'ollama' | 'shimmy';
  enabled: boolean;
  description?: string;
  version?: string;
  size?: number;
  // Qwen LLM 特定配置
  modelPath?: string;
  device?: 'cpu' | 'cuda' | 'auto';
  maxTokens?: number;
  temperature?: number;
  // Ollama 特定配置
  ollamaBaseUrl?: string; // Ollama API 基础 URL，默认 http://localhost:11434
  ollamaModel?: string; // Ollama 模型名称，如 qwen-vl, llava:1.5 等
  // Shimmy 特定配置
  shimmyPath?: string; // Shimmy 工具路径
  shimmyModel?: string; // Shimmy 模型名称
}

// 图片分析请求接口
export interface ImageAnalysisRequest {
  imageData: Buffer | Uint8Array | number[];
  modelId?: string;
  modelConfig?: AIModelConfig; // 直接传递模型配置
  config?: {
    useGpu?: boolean;
    confidenceThreshold?: number;
  };
}

// 图片分析结果接口
export interface ImageAnalysisResponse {
  success: boolean;
  result?: {
    imageType: string;
    tags: string[];
    description: string;
    confidence: number;
    objects: Array<{
      name: string;
      confidence: number;
      bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      category: string;
    }>;
    colors: Array<{
      name: string;
      rgb: [number, number, number];
      percentage: number;
      hex: string;
    }>;
    sceneType: string;
    analysisTime: number;
    modelUsed: string;
  };
  error?: string;
}

class AIService {
  public models: Map<string, AIModelConfig> = new Map();
  public modelsDir: string;
  public configFile: string;

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models');
    this.configFile = path.join(app.getPath('userData'), 'ai-models.json');
    this.initializeService();
  }

  private async initializeService() {
    // 确保模型目录存在
    try {
      await mkdir(this.modelsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create models directory:', error);
    }

    // 加载模型配置
    await this.loadModelConfigs();

    // 添加默认内置模型
    await this.addDefaultModels();
  }

  private async loadModelConfigs() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = await readFile(this.configFile, 'utf-8');
        const configs: AIModelConfig[] = JSON.parse(data);
        configs.forEach(config => {
          this.models.set(config.id, config);
        });
      }
    } catch (error) {
      console.error('Failed to load model configs:', error);
    }
  }

  public async saveModelConfigs() {
    try {
      const configs = Array.from(this.models.values());
      await writeFile(this.configFile, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save model configs:', error);
    }
  }

  // 获取模型目录路径
  public getModelsDir(): string {
    return this.modelsDir;
  }

  // 添加默认模型配置 - 不添加任何默认模型，用户需要手动配置Qwen模型
  public async addDefaultModels() {
    // Qwen LLM需要用户手动下载和配置，不提供默认模型
    console.log(
      'No default models added. Users need to configure Qwen LLM manually.',
    );
  }

  // 获取所有模型
  public getModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  // 添加模型
  public async addModel(
    config: AIModelConfig,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.models.set(config.id, config);
      await this.saveModelConfigs();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 删除模型
  public async removeModel(
    modelId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.models.delete(modelId);
      await this.saveModelConfigs();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 更新模型
  public async updateModel(
    modelId: string,
    updates: Partial<AIModelConfig>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existingModel = this.models.get(modelId);
      if (!existingModel) {
        return { success: false, error: 'Model not found' };
      }

      const updatedModel = { ...existingModel, ...updates };
      this.models.set(modelId, updatedModel);
      await this.saveModelConfigs();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 检查模型
  public async checkModel(
    modelId: string,
  ): Promise<{ available: boolean; error?: string }> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        return { available: false, error: 'Model not found' };
      }

      if (model.modelPath) {
        const fs = await import('fs');
        const path = await import('path');
        const exists = fs.existsSync(path.resolve(model.modelPath));
        return { available: exists };
      }

      return { available: true };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 选择模型文件
  public async selectModelFile(): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      const { dialog } = await import('electron');
      const result = await dialog.showOpenDialog({
        title: '选择 GGUF 模型文件',
        filters: [
          { name: 'GGUF 模型', extensions: ['gguf'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        properties: ['openFile'],
        defaultPath: process.env.HOME || process.env.USERPROFILE || '/',
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'No file selected' };
      }

      return { success: true, filePath: result.filePaths[0] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 使用 Qwen LLM 分析图片
  async analyzeImageWithQwen(
    request: ImageAnalysisRequest,
  ): Promise<ImageAnalysisResponse> {
    try {
      // 从 request 中获取模型配置（不再依赖 models Map）
      if (!request.modelConfig) {
        return {
          success: false,
          error: 'Qwen model configuration is required',
        };
      }

      const modelConfig = request.modelConfig;

      if (!modelConfig.modelPath) {
        return {
          success: false,
          error: 'Qwen model path not configured',
        };
      }

      // 检查Qwen分析器二进制文件是否存在
      const analyzerPath = this.getQwenAnalyzerPath();
      if (!fs.existsSync(analyzerPath)) {
        return {
          success: false,
          error:
            'Qwen analyzer binary not found. Please ensure the application is properly installed.',
        };
      }

      // 将图片保存为临时文件
      const tempImagePath = path.join(
        app.getPath('temp'),
        `temp_image_${Date.now()}.jpg`,
      );

      // 处理不同的数据格式（Uint8Array 或 Buffer）
      let imageBuffer: Buffer;
      if (request.imageData instanceof Uint8Array) {
        imageBuffer = Buffer.from(request.imageData);
      } else if (request.imageData instanceof Buffer) {
        imageBuffer = request.imageData;
      } else if (Array.isArray(request.imageData)) {
        imageBuffer = Buffer.from(request.imageData);
      } else {
        return {
          success: false,
          error: 'Invalid image data format',
        };
      }

      await writeFile(tempImagePath, imageBuffer);

      try {
        // 调用二进制文件进行图片分析
        const result = await this.callQwenAnalyzerBinary(
          analyzerPath,
          modelConfig,
          tempImagePath,
          request.config,
        );

        return {
          success: true,
          result: {
            imageType: result.imageType || 'unknown',
            tags: result.tags || [],
            description: result.description || '无法生成描述',
            confidence: result.confidence || 0.8,
            objects: result.objects || [],
            colors: result.colors || [],
            sceneType: result.sceneType || 'unknown',
            analysisTime: result.analysisTime || 0,
            modelUsed: result.modelUsed || modelConfig.name,
          },
        };
      } finally {
        // 清理临时文件
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp image:', cleanupError);
        }
      }
    } catch (error) {
      console.error('Qwen analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  // 调用Qwen分析器二进制文件
  private async callQwenAnalyzerBinary(
    analyzerPath: string,
    modelConfig: AIModelConfig,
    imagePath: string,
    config?: { useGpu?: boolean; confidenceThreshold?: number },
  ): Promise<any> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      // 确定计算设备
      let device: string;
      if (modelConfig.device && modelConfig.device !== 'auto') {
        device = modelConfig.device;
      } else if (config?.useGpu) {
        device = 'cuda';
      } else {
        device = 'cpu';
      }

      const args = [
        '--model-path',
        modelConfig.modelPath!,
        '--image-path',
        imagePath,
        '--device',
        device,
        '--max-tokens',
        String(modelConfig.maxTokens || 512),
        '--temperature',
        String(modelConfig.temperature || 0.7),
      ];

      console.log('Calling Qwen analyzer binary:', analyzerPath);
      console.log('Args:', args);

      const analyzerProcess = spawn(analyzerPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      analyzerProcess.stdout.on('data', data => {
        stdout += data.toString();
      });

      analyzerProcess.stderr.on('data', data => {
        stderr += data.toString();
      });

      analyzerProcess.on('close', code => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              resolve(result);
            } else {
              reject(new Error(result.error || 'Analysis failed'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse analyzer output: ${parseError}`));
          }
        } else {
          reject(
            new Error(`Qwen analyzer failed with code ${code}: ${stderr}`),
          );
        }
      });

      analyzerProcess.on('error', error => {
        reject(new Error(`Failed to start Qwen analyzer: ${error.message}`));
      });
    });
  }

  // 获取Qwen分析器二进制文件路径（公开方法）
  public getQwenAnalyzerPath(): string {
    const platform = process.platform;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // 开发环境：从packages/ai目录查找
      return path.join(
        __dirname,
        '../../../packages/ai/resources/bin/qwen_analyzer',
      );
    } else {
      // 生产环境：从应用资源目录查找
      const resourcesPath = process.resourcesPath || app.getAppPath();
      const analyzerName =
        platform === 'win32' ? 'qwen_analyzer.exe' : 'qwen_analyzer';
      return path.join(resourcesPath, 'bin', analyzerName);
    }
  }

  // 使用 Ollama 分析图片
  async analyzeImageWithOllama(
    request: ImageAnalysisRequest,
  ): Promise<ImageAnalysisResponse> {
    try {
      if (!request.modelConfig) {
        return {
          success: false,
          error: 'Ollama model configuration is required',
        };
      }

      const modelConfig = request.modelConfig;
      let baseUrl = modelConfig.ollamaBaseUrl || 'http://localhost:11434';
      // 确保 URL 包含协议
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `http://${baseUrl}`;
      }
      const modelName = modelConfig.ollamaModel || 'llava:latest';

      if (!modelName) {
        return {
          success: false,
          error: 'Ollama model name not configured',
        };
      }

      // 处理图片数据
      let imageBuffer: Buffer;
      if (request.imageData instanceof Uint8Array) {
        imageBuffer = Buffer.from(request.imageData);
      } else if (request.imageData instanceof Buffer) {
        imageBuffer = request.imageData;
      } else if (Array.isArray(request.imageData)) {
        imageBuffer = Buffer.from(request.imageData);
      } else {
        return {
          success: false,
          error: 'Invalid image data format',
        };
      }

      // 将图片转换为 base64
      const base64Image = imageBuffer.toString('base64');

      // 调用 Ollama API
      const startTime = Date.now();
      const result = await this.callOllamaAPI(baseUrl, modelName, base64Image, {
        temperature: modelConfig.temperature || 0.7,
        maxTokens: modelConfig.maxTokens || 512,
      });

      const analysisTime = Date.now() - startTime;

      // 解析 Ollama 返回的描述
      // Ollama chat API 返回格式: { message: { content: "..." } }
      const description =
        result.message?.content || result.response || '无法生成描述';

      // 提取标签（从描述中提取关键词，简单的实现）
      const tags = this.extractTagsFromDescription(description);

      return {
        success: true,
        result: {
          imageType: 'unknown',
          tags,
          description,
          confidence: 0.8,
          objects: [],
          colors: [],
          sceneType: 'unknown',
          analysisTime,
          modelUsed: `${modelName} (Ollama)`,
        },
      };
    } catch (error) {
      console.error('Ollama analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  // 调用 Ollama API
  private async callOllamaAPI(
    baseUrl: string,
    model: string,
    base64Image: string,
    options: { temperature?: number; maxTokens?: number },
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Ollama 视觉模型使用 /api/chat 端点
      const url = new URL(`${baseUrl}/api/chat`);

      const payload = {
        model,
        messages: [
          {
            role: 'user',
            content:
              '请详细描述这张图片，包括内容、场景、颜色、对象等。用中文回答。',
            images: [base64Image],
          },
        ],
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 512,
        },
      };

      const urlObj = new URL(baseUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(payload);

      const options_req = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 120000, // 120秒超时（图片分析可能需要更长时间）
      };

      const req = client.request(options_req, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const result = JSON.parse(data);
              resolve(result);
            } else {
              reject(
                new Error(
                  `Ollama API error: ${res.statusCode} - ${data || res.statusMessage}`,
                ),
              );
            }
          } catch (error) {
            reject(new Error(`Failed to parse Ollama response: ${error}`));
          }
        });
      });

      req.on('error', error => {
        reject(new Error(`Ollama API request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Ollama API request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  // 检查 Ollama 连接
  async checkOllamaConnection(baseUrl?: string): Promise<{
    success: boolean;
    error?: string;
    models?: string[];
  }> {
    try {
      let url = baseUrl || 'http://localhost:11434';
      // 确保 URL 包含协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      const modelsResult = await this.getOllamaModels(url);

      if (modelsResult.success && modelsResult.models) {
        return {
          success: true,
          models: modelsResult.models.map(m => m.name),
        };
      } else {
        return {
          success: false,
          error: modelsResult.error || 'Failed to connect to Ollama',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 获取 Ollama 可用模型列表
  async getOllamaModels(baseUrl?: string): Promise<{
    success: boolean;
    models?: Array<{ name: string; size: number; modified_at: string }>;
    error?: string;
  }> {
    try {
      let url = baseUrl || 'http://localhost:11434';
      // 确保 URL 包含协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      return new Promise((resolve, reject) => {
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: '/api/tags',
          method: 'GET',
          timeout: 10000, // 10秒超时
        };

        const req = client.request(options, res => {
          let data = '';

          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const result = JSON.parse(data);
                resolve({
                  success: true,
                  models: result.models || [],
                });
              } else {
                resolve({
                  success: false,
                  error: `HTTP ${res.statusCode}: ${data || res.statusMessage}`,
                });
              }
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Parse error',
              });
            }
          });
        });

        req.on('error', error => {
          resolve({
            success: false,
            error: error.message || 'Connection failed',
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            error: 'Connection timeout',
          });
        });

        req.end();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 使用 Shimmy 分析图片
  async analyzeImageWithShimmy(
    request: ImageAnalysisRequest,
  ): Promise<ImageAnalysisResponse> {
    try {
      if (!request.modelConfig) {
        return {
          success: false,
          error: 'Shimmy model configuration is required',
        };
      }

      const modelConfig = request.modelConfig;
      const shimmyPath = modelConfig.shimmyPath || this.getDefaultShimmyPath();

      if (!shimmyPath || !fs.existsSync(shimmyPath)) {
        return {
          success: false,
          error: 'Shimmy path not configured or not found',
        };
      }

      // 处理图片数据
      let imageBuffer: Buffer;
      if (request.imageData instanceof Uint8Array) {
        imageBuffer = Buffer.from(request.imageData);
      } else if (request.imageData instanceof Buffer) {
        imageBuffer = request.imageData;
      } else if (Array.isArray(request.imageData)) {
        imageBuffer = Buffer.from(request.imageData);
      } else {
        return {
          success: false,
          error: 'Invalid image data format',
        };
      }

      // 将图片保存为临时文件
      const tempImagePath = path.join(
        app.getPath('temp'),
        `temp_image_${Date.now()}.jpg`,
      );
      await writeFile(tempImagePath, imageBuffer);

      try {
        // 调用 Shimmy 工具
        const startTime = Date.now();
        const result = await this.callShimmyTool(
          shimmyPath,
          modelConfig.shimmyModel || 'qwen-vl',
          tempImagePath,
        );
        const analysisTime = Date.now() - startTime;

        // 解析结果
        const description = result.description || '无法生成描述';
        const tags = this.extractTagsFromDescription(description);

        return {
          success: true,
          result: {
            imageType: result.imageType || 'unknown',
            tags,
            description,
            confidence: result.confidence || 0.8,
            objects: result.objects || [],
            colors: result.colors || [],
            sceneType: result.sceneType || 'unknown',
            analysisTime,
            modelUsed: modelConfig.shimmyModel || 'qwen-vl (Shimmy)',
          },
        };
      } finally {
        // 清理临时文件
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp image:', cleanupError);
        }
      }
    } catch (error) {
      console.error('Shimmy analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  }

  // 调用 Shimmy 工具
  private async callShimmyTool(
    shimmyPath: string,
    modelName: string,
    imagePath: string,
  ): Promise<any> {
    const { spawn } = await import('child_process');
    const os = require('os');
    const homeDir = os.homedir();

    return new Promise((resolve, reject) => {
      // 尝试查找本地模型路径
      const modelsDir = path.join(homeDir, 'models');
      const modelPath = this.findLocalModelPath(modelName, modelsDir);

      // 构建命令参数
      // 如果 shimmy 支持 analyze 命令（自定义工具），使用 analyze
      // 否则可能需要使用其他命令或通过 HTTP API
      const args: string[] = [];

      // 如果找到本地模型目录，添加 --model-dirs 参数
      if (modelPath) {
        args.push('--model-dirs', modelsDir);
        console.log('Using local model directory:', modelsDir);
      }

      // 根据实际的 shimmy 命令格式调整
      // 如果 shimmy 是自定义工具，可能使用: analyze --model <name> --image <path>
      // 如果是标准的 shimmy，可能需要使用 HTTP API 或其他方式
      if (fs.existsSync(shimmyPath)) {
        // 检查是否是自定义的 analyze 命令
        const shimmyHelp = this.checkShimmyCommand(shimmyPath);
        if (shimmyHelp && shimmyHelp.includes('analyze')) {
          args.push('analyze', '--model', modelName, '--image', imagePath);
        } else {
          // 使用标准 shimmy 命令（可能需要通过 HTTP API）
          // 这里先尝试 analyze 命令，如果失败再调整
          args.push(
            'generate',
            '--prompt',
            `描述这张图片: ${imagePath}`,
            modelName,
          );
        }
      } else {
        args.push('analyze', '--model', modelName, '--image', imagePath);
      }

      console.log('Calling Shimmy tool:', shimmyPath);
      console.log('Args:', args);
      console.log('Model path:', modelPath || 'using model name');

      // 设置环境变量，确保能找到本地模型
      const env = {
        ...process.env,
        HF_HOME: modelsDir,
        TRANSFORMERS_CACHE: modelsDir,
      };

      const shimmyProcess = spawn(shimmyPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env,
      });

      let stdout = '';
      let stderr = '';

      shimmyProcess.stdout.on('data', data => {
        stdout += data.toString();
      });

      shimmyProcess.stderr.on('data', data => {
        stderr += data.toString();
      });

      shimmyProcess.on('close', code => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            // 如果不是 JSON，尝试解析为文本描述
            resolve({
              description: stdout.trim() || '分析完成',
            });
          }
        } else {
          reject(
            new Error(
              `Shimmy tool failed with code ${code}: ${stderr || stdout}`,
            ),
          );
        }
      });

      shimmyProcess.on('error', error => {
        reject(new Error(`Failed to start Shimmy tool: ${error.message}`));
      });

      // 设置超时
      setTimeout(() => {
        shimmyProcess.kill();
        reject(new Error('Shimmy tool timeout'));
      }, 120000); // 2分钟超时
    });
  }

  // 查找本地模型路径
  private findLocalModelPath(
    modelName: string,
    modelsDir: string,
  ): string | null {
    if (!fs.existsSync(modelsDir)) {
      return null;
    }

    // 模型名称到目录名的映射
    const modelMap: Record<string, string> = {
      'qwen-vl': 'Qwen2-VL-2B',
      'qwen2-vl': 'Qwen2-VL-2B',
      'qwen2-vl-2b': 'Qwen2-VL-2B',
      'qwen2-vl-7b': 'Qwen2-VL-7B',
      'minicpm-v': 'MiniCPM-V-2',
      moondream2: 'Moondream2',
      llava: 'LLaVA-1.5-7B',
      'llava-7b': 'LLaVA-1.5-7B',
      cogvlm2: 'CogVLM2-2B',
    };

    const modelDirName = modelMap[modelName.toLowerCase()] || modelName;
    const fullPath = path.join(modelsDir, modelDirName);

    if (fs.existsSync(fullPath)) {
      // 检查是否包含模型文件
      const files = fs.readdirSync(fullPath);
      const hasModelFile = files.some(
        f =>
          f.endsWith('.safetensors') ||
          f.endsWith('.bin') ||
          f.endsWith('.gguf') ||
          f === 'config.json',
      );

      if (hasModelFile) {
        return fullPath;
      }
    }

    return null;
  }

  // 检查 Shimmy 支持的命令
  private checkShimmyCommand(shimmyPath: string): string | null {
    try {
      const { execSync } = require('child_process');
      const help = execSync(`"${shimmyPath}" --help`, {
        encoding: 'utf-8',
        timeout: 5000,
      });
      return help;
    } catch (error) {
      return null;
    }
  }

  // 获取默认 Shimmy 路径
  private getDefaultShimmyPath(): string {
    const platform = process.platform;
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // 开发环境：尝试从常见路径查找
      const possiblePaths = [
        path.join(process.env.HOME || '', '.local', 'bin', 'shimmy'),
        path.join('/usr', 'local', 'bin', 'shimmy'),
        'shimmy', // 如果在 PATH 中
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          return p;
        }
      }
    }

    // 生产环境：从应用资源目录查找
    const resourcesPath = process.resourcesPath || app.getAppPath();
    const shimmyName = platform === 'win32' ? 'shimmy.exe' : 'shimmy';
    return path.join(resourcesPath, 'bin', shimmyName);
  }

  // 检查 Shimmy
  async checkShimmy(shimmyPath?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const pathToCheck = shimmyPath || this.getDefaultShimmyPath();

      if (!pathToCheck) {
        return {
          success: false,
          error: 'Shimmy path not configured',
        };
      }

      // 检查文件是否存在
      if (!fs.existsSync(pathToCheck)) {
        return {
          success: false,
          error: `Shimmy not found at: ${pathToCheck}`,
        };
      }

      // 尝试运行 shimmy --version
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      try {
        await execFileAsync(pathToCheck, ['--version'], { timeout: 5000 });
        return { success: true };
      } catch (error) {
        // 即使版本检查失败，如果文件存在也认为可用
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 从描述中提取标签（简单实现）
  private extractTagsFromDescription(description: string): string[] {
    // 简单关键词提取，可以根据需要改进
    const commonKeywords = [
      '图片',
      '照片',
      '图像',
      '场景',
      '人物',
      '动物',
      '物体',
      '建筑',
      '自然',
      '风景',
      '室内',
      '室外',
      '白天',
      '晚上',
      '日出',
      '日落',
      '城市',
      '乡村',
      '大海',
      '山',
      '森林',
      '河流',
      '天空',
      '云',
    ];

    const tags: string[] = [];
    const lowerDesc = description.toLowerCase();

    for (const keyword of commonKeywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }

    // 如果标签太少，添加一些基于描述的通用标签
    if (tags.length < 3) {
      if (lowerDesc.includes('人') || lowerDesc.includes('人物')) {
        tags.push('人物');
      }
      if (lowerDesc.includes('动物')) {
        tags.push('动物');
      }
      if (lowerDesc.includes('风景') || lowerDesc.includes('自然')) {
        tags.push('风景');
      }
      if (lowerDesc.includes('建筑')) {
        tags.push('建筑');
      }
    }

    return tags.slice(0, 10); // 最多返回10个标签
  }
}

const aiService = new AIService();

export function registerAiHandlers() {
  // Qwen LLM 图片分析
  ipcMain.handle(
    'ai:analyze-image-qwen',
    async (
      event,
      request: ImageAnalysisRequest,
    ): Promise<ImageAnalysisResponse> => {
      try {
        return await aiService.analyzeImageWithQwen(request);
      } catch (error) {
        console.error('Qwen analysis failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );

  // 检查Qwen分析器二进制文件
  ipcMain.handle('ai:check-qwen-analyzer', async () => {
    try {
      const analyzerPath = aiService.getQwenAnalyzerPath();
      const exists = fs.existsSync(analyzerPath);
      return {
        success: exists,
        error: exists ? undefined : 'Qwen analyzer binary not found',
        analyzerPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('ai:select-model-file', async () => {
    return await aiService.selectModelFile();
  });

  // Ollama 图片分析
  ipcMain.handle(
    'ai:analyze-image-ollama',
    async (
      event,
      request: ImageAnalysisRequest,
    ): Promise<ImageAnalysisResponse> => {
      try {
        return await aiService.analyzeImageWithOllama(request);
      } catch (error) {
        console.error('Ollama analysis failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );

  // 检查 Ollama 连接
  ipcMain.handle(
    'ai:check-ollama-connection',
    async (event, baseUrl?: string) => {
      try {
        return await aiService.checkOllamaConnection(baseUrl);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );

  // 获取 Ollama 模型列表
  ipcMain.handle('ai:get-ollama-models', async (event, baseUrl?: string) => {
    try {
      return await aiService.getOllamaModels(baseUrl);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Shimmy 图片分析
  ipcMain.handle(
    'ai:analyze-image-shimmy',
    async (
      event,
      request: ImageAnalysisRequest,
    ): Promise<ImageAnalysisResponse> => {
      try {
        return await aiService.analyzeImageWithShimmy(request);
      } catch (error) {
        console.error('Shimmy analysis failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );

  // 检查 Shimmy
  ipcMain.handle('ai:check-shimmy', async (event, shimmyPath?: string) => {
    try {
      return await aiService.checkShimmy(shimmyPath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

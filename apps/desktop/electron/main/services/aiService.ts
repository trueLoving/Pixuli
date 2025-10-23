import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// AI 模型配置接口 - 只支持 Qwen LLM
export interface AIModelConfig {
  id: string;
  name: string;
  type: 'qwen-llm';
  enabled: boolean;
  description?: string;
  version?: string;
  size?: number;
  // Qwen LLM 特定配置
  modelPath?: string;
  device?: 'cpu' | 'cuda' | 'auto';
  maxTokens?: number;
  temperature?: number;
}

// 图片分析请求接口
export interface ImageAnalysisRequest {
  imageData: Buffer;
  modelId?: string;
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
      'No default models added. Users need to configure Qwen LLM manually.'
    );
  }

  // 获取所有模型
  public getModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  // 添加模型
  public async addModel(
    config: AIModelConfig
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
    modelId: string
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
    updates: Partial<AIModelConfig>
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
    modelId: string
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
        title: '选择 AI 模型文件',
        filters: [
          { name: 'TensorFlow Lite 模型', extensions: ['tflite'] },
          { name: 'TensorFlow 模型', extensions: ['pb', 'json', 'bin'] },
          { name: 'ONNX 模型', extensions: ['onnx'] },
          { name: 'Qwen 模型目录', extensions: ['*'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        properties: ['openFile', 'openDirectory'],
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
    request: ImageAnalysisRequest
  ): Promise<ImageAnalysisResponse> {
    try {
      const modelConfig = this.models.get(request.modelId || '');
      if (!modelConfig || modelConfig.type !== 'qwen-llm') {
        return {
          success: false,
          error: 'Qwen model not found or invalid type',
        };
      }

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
        `temp_image_${Date.now()}.jpg`
      );
      await writeFile(tempImagePath, request.imageData);

      try {
        // 调用二进制文件进行图片分析
        const result = await this.callQwenAnalyzerBinary(
          analyzerPath,
          modelConfig,
          tempImagePath,
          request.config
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
    config?: { useGpu?: boolean; confidenceThreshold?: number }
  ): Promise<any> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const device = config?.useGpu ? 'cuda' : 'cpu';

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
            new Error(`Qwen analyzer failed with code ${code}: ${stderr}`)
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
        '../../../packages/ai/resources/bin/qwen_analyzer'
      );
    } else {
      // 生产环境：从应用资源目录查找
      const resourcesPath = process.resourcesPath || app.getAppPath();
      const analyzerName =
        platform === 'win32' ? 'qwen_analyzer.exe' : 'qwen_analyzer';
      return path.join(resourcesPath, 'bin', analyzerName);
    }
  }
}

const aiService = new AIService();

export function registerAiHandlers() {
  // Qwen LLM 图片分析
  ipcMain.handle(
    'ai:analyze-image-qwen',
    async (
      event,
      request: ImageAnalysisRequest
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
    }
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

  ipcMain.handle('select-model-file', async () => {
    return await aiService.selectModelFile();
  });
}

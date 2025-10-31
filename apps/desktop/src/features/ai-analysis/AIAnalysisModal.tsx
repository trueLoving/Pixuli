import { defaultTranslate, useEscapeKey } from '@packages/ui/src';
import { FolderOpen, Loader2, Play, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import './AIAnalysisModal.css';
import zhCN from './locales/zh-CN.json';
import { AIModelConfig, ImageAnalysisResponse } from './types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (result: ImageAnalysisResponse) => void;
  t?: (key: string) => string;
}

const dT = (key: string) => {
  return defaultTranslate(key, zhCN);
};

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  t = dT,
}) => {
  // 使用传入的翻译函数或默认中文翻译函数
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
    name: string;
    size: number;
    dimensions?: { width: number; height: number };
  } | null>(null);

  // AI 分析方式：'wasm' | 'qwen' | 'ollama' | 'shimmy'
  const [analysisType, setAnalysisType] = useState<
    'wasm' | 'qwen' | 'ollama' | 'shimmy'
  >('wasm');

  // AI 分析配置（WASM 用）
  const [aiConfig, setAiConfig] = useState({
    confidenceThreshold: 0.5,
    maxTags: 10,
    analyzeColors: true,
    detectObjects: false,
  });

  // Qwen 模型配置
  const [qwenConfig, setQwenConfig] = useState({
    modelPath: '',
    device: 'cpu' as 'cpu' | 'cuda',
    maxTokens: 512,
    temperature: 0.7,
  });

  // Ollama 配置
  const [ollamaConfig, setOllamaConfig] = useState({
    baseUrl: 'http://localhost:11434',
    model: 'llava:latest',
    temperature: 0.7,
    maxTokens: 512,
  });
  const [ollamaModels, setOllamaModels] = useState<
    Array<{ name: string; size: number; modified_at: string }>
  >([]);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);

  // Shimmy 配置
  const [shimmyConfig, setShimmyConfig] = useState({
    shimmyPath: '',
    model: 'qwen-vl',
  });
  const [checkingShimmy, setCheckingShimmy] = useState(false);
  const [shimmyAvailable, setShimmyAvailable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择 Qwen GGUF 模型路径
  const handleSelectQwenModelPath = async () => {
    try {
      const result = await window.aiAPI.selectModelFile();
      if (result.success && result.filePath) {
        setQwenConfig(prev => ({ ...prev, modelPath: result.filePath! }));
        setError('');
      } else {
        setError(result.error || t('common.error'));
      }
    } catch (error) {
      setError(t('common.error'));
    }
  };

  // 检查 Ollama 连接并获取模型列表
  const handleCheckOllamaConnection = async () => {
    setCheckingOllama(true);
    setError('');
    try {
      const result = await window.aiAPI.checkOllamaConnection(
        ollamaConfig.baseUrl
      );
      if (result.success) {
        setOllamaConnected(true);
        // 获取模型列表
        const modelsResult = await window.aiAPI.getOllamaModels(
          ollamaConfig.baseUrl
        );
        if (modelsResult.success && modelsResult.models) {
          setOllamaModels(modelsResult.models);
          // 如果当前模型不在列表中，使用第一个可用模型
          if (
            !modelsResult.models.find(m => m.name === ollamaConfig.model) &&
            modelsResult.models.length > 0
          ) {
            setOllamaConfig(prev => ({
              ...prev,
              model: modelsResult.models![0].name,
            }));
          }
        }
      } else {
        setOllamaConnected(false);
        setError(result.error || '无法连接到 Ollama');
      }
    } catch (error) {
      setOllamaConnected(false);
      setError(error instanceof Error ? error.message : '检查连接失败');
    } finally {
      setCheckingOllama(false);
    }
  };

  // 检查 Shimmy
  const handleCheckShimmy = async () => {
    setCheckingShimmy(true);
    setError('');
    try {
      const result = await window.aiAPI.checkShimmy(shimmyConfig.shimmyPath);
      if (result.success) {
        setShimmyAvailable(true);
      } else {
        setShimmyAvailable(false);
        setError(result.error || 'Shimmy 工具不可用');
      }
    } catch (error) {
      setShimmyAvailable(false);
      setError(error instanceof Error ? error.message : '检查失败');
    } finally {
      setCheckingShimmy(false);
    }
  };

  // 选择 Shimmy 工具路径
  const handleSelectShimmyPath = async () => {
    try {
      // 使用文件选择对话框选择可执行文件
      const result = await window.aiAPI.selectModelFile(); // 复用这个 API，稍后可以创建专门的 API
      if (result.success && result.filePath) {
        setShimmyConfig(prev => ({ ...prev, shimmyPath: result.filePath! }));
        setError('');
        // 自动检查
        await handleCheckShimmy();
      } else {
        setError(result.error || t('common.error'));
      }
    } catch (error) {
      setError(t('common.error'));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('common.error'));
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage({
          file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
          dimensions: { width: img.width, height: img.height },
        });
        setError('');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) {
      setError('请先上传图片');
      return;
    }

    // 根据分析方式检查配置
    if (analysisType === 'qwen' && !qwenConfig.modelPath) {
      setError('请先选择 Qwen GGUF 模型文件');
      return;
    }
    if (analysisType === 'ollama' && !ollamaConnected) {
      setError('请先检查并连接 Ollama');
      return;
    }
    if (analysisType === 'shimmy' && !shimmyConfig.shimmyPath) {
      setError('请先配置 Shimmy 工具路径');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      const arrayBuffer = await uploadedImage.file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      let result: ImageAnalysisResponse;

      if (analysisType === 'qwen' && qwenConfig.modelPath) {
        // 使用 Qwen GGUF 模型分析
        const tempModelConfig: AIModelConfig = {
          id: 'qwen-gguf-model-' + Date.now(),
          name: 'Qwen GGUF',
          type: 'qwen-llm',
          enabled: true,
          modelPath: qwenConfig.modelPath,
          device: qwenConfig.device,
          maxTokens: qwenConfig.maxTokens,
          temperature: qwenConfig.temperature,
        };

        result = await window.aiAPI.analyzeImageWithQwen({
          imageData: buffer,
          modelConfig: tempModelConfig,
          config: {
            useGpu: qwenConfig.device === 'cuda',
            confidenceThreshold: aiConfig.confidenceThreshold,
          },
        });
      } else if (analysisType === 'ollama') {
        // 使用 Ollama 分析
        const tempModelConfig: AIModelConfig = {
          id: 'ollama-model-' + Date.now(),
          name: ollamaConfig.model,
          type: 'ollama',
          enabled: true,
          ollamaBaseUrl: ollamaConfig.baseUrl,
          ollamaModel: ollamaConfig.model,
          temperature: ollamaConfig.temperature,
          maxTokens: ollamaConfig.maxTokens,
        };

        result = await window.aiAPI.analyzeImageWithOllama({
          imageData: buffer,
          modelConfig: tempModelConfig,
        });
      } else if (analysisType === 'shimmy' && shimmyConfig.shimmyPath) {
        // 使用 Shimmy 分析
        const tempModelConfig: AIModelConfig = {
          id: 'shimmy-model-' + Date.now(),
          name: shimmyConfig.model,
          type: 'shimmy',
          enabled: true,
          shimmyPath: shimmyConfig.shimmyPath,
          shimmyModel: shimmyConfig.model,
        };

        result = await window.aiAPI.analyzeImageWithShimmy({
          imageData: buffer,
          modelConfig: tempModelConfig,
        });
      } else {
        // 使用 WASM 基础分析
        const imageData = Array.from(new Uint8Array(arrayBuffer));

        const wasmResult = await window.wasmAPI.analyzeImage(imageData, {
          confidence_threshold: aiConfig.confidenceThreshold,
          max_tags: aiConfig.maxTags,
          analyze_colors: aiConfig.analyzeColors,
          detect_objects: aiConfig.detectObjects,
        });

        console.log('WASM Result:', wasmResult);

        // 注意：NAPI-RS 会将 snake_case 转换为 camelCase
        // 使用 tagsJson 而不是 tags_json

        // 安全的 JSON 解析
        let tags: string[] = [];
        let colors: Array<{
          name: string;
          rgb: number[];
          hex: string;
          percentage: number;
        }> = [];
        let objects: Array<{
          name: string;
          confidence: number;
          bbox: { x: number; y: number; width: number; height: number };
          category: string;
        }> = [];

        try {
          tags = JSON.parse(wasmResult.tagsJson || '[]') as string[];
        } catch (e) {
          console.error('Failed to parse tags:', e);
          tags = [];
        }

        try {
          colors = JSON.parse(wasmResult.colorsJson || '[]') as Array<{
            name: string;
            rgb: number[];
            hex: string;
            percentage: number;
          }>;
        } catch (e) {
          console.error('Failed to parse colors:', e);
          colors = [];
        }

        try {
          objects = JSON.parse(wasmResult.objectsJson || '[]') as Array<{
            name: string;
            confidence: number;
            bbox: { x: number; y: number; width: number; height: number };
            category: string;
          }>;
        } catch (e) {
          console.error('Failed to parse objects:', e);
          objects = [];
        }

        console.log('WASM Result:', wasmResult);
        console.log('tagsJson raw:', wasmResult.tagsJson);
        console.log('colorsJson raw:', wasmResult.colorsJson);
        console.log('Parsed tags:', tags);
        console.log('Parsed colors:', colors);
        if (colors.length > 0) {
          console.log('First color full:', colors[0]);
          console.log(
            'First color.rgb:',
            colors[0]?.rgb,
            'Is Array:',
            Array.isArray(colors[0]?.rgb)
          );
        }
        console.log('Parsed objects:', objects);

        result = {
          success: wasmResult.success,
          result: {
            imageType: wasmResult.imageType, // camelCase
            tags: tags,
            description: wasmResult.description,
            confidence: wasmResult.confidence,
            objects: objects,
            colors: colors
              .filter(
                color =>
                  color &&
                  color.rgb &&
                  Array.isArray(color.rgb) &&
                  color.rgb.length >= 3
              )
              .map(color => ({
                name: color.name || 'Unknown Color',
                rgb: [color.rgb[0], color.rgb[1], color.rgb[2]] as [
                  number,
                  number,
                  number,
                ],
                percentage: color.percentage || 0,
                hex: color.hex || '#000000',
              })),
            sceneType: wasmResult.sceneType, // camelCase
            analysisTime: wasmResult.analysisTime || 0, // camelCase
            modelUsed: wasmResult.modelUsed || 'WASM', // camelCase
          },
          error: wasmResult.error,
        };
      }

      setAnalysisResult(result);

      if (result.success && onAnalysisComplete) {
        onAnalysisComplete(result);
      } else {
        setError(result.error || t('common.error'));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 键盘支持
  useEscapeKey(onClose);

  if (!isOpen) return null;

  return (
    <div className="ai-analysis-modal-overlay">
      <div className="ai-analysis-modal">
        <div className="ai-analysis-modal-header">
          <h2>{t('aiAnalysis.title')}</h2>
          <div className="header-actions">
            <button className="close-button" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="ai-analysis-modal-content">
          {/* 图片上传区域 */}
          <div className="image-upload-section">
            <h3>{t('aiAnalysis.uploadImage.title')}</h3>
            {!uploadedImage ? (
              <div
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <p>{t('aiAnalysis.uploadImage.placeholder')}</p>
                <p className="text-sm text-gray-500">
                  {t('aiAnalysis.uploadImage.supportedFormats')}
                </p>
              </div>
            ) : (
              <div className="uploaded-image-preview">
                <img src={uploadedImage.preview} alt={uploadedImage.name} />
                <div className="image-info">
                  <h4>{uploadedImage.name}</h4>
                  <p>
                    {t('aiAnalysis.imageInfo.dimensions')}{' '}
                    {uploadedImage.dimensions?.width} ×{' '}
                    {uploadedImage.dimensions?.height}
                  </p>
                  <p>
                    {t('aiAnalysis.imageInfo.size')}{' '}
                    {formatFileSize(uploadedImage.size)}
                  </p>
                  <button
                    className="change-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('aiAnalysis.uploadImage.changeImage')}
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* AI 分析配置区域 */}
          <div className="model-config-section">
            <h3>{t('aiAnalysis.modelConfig.title')}</h3>

            {/* 选择分析方式 */}
            <div className="config-section">
              <label>分析方式</label>
              <select
                value={analysisType}
                onChange={e =>
                  setAnalysisType(
                    e.target.value as 'wasm' | 'qwen' | 'ollama' | 'shimmy'
                  )
                }
                disabled={isAnalyzing}
              >
                <option value="wasm">WASM 基础分析</option>
                <option value="qwen">Qwen GGUF 模型</option>
                <option value="ollama">Ollama</option>
                <option value="shimmy">Shimmy</option>
              </select>
            </div>

            {/* Qwen 配置 */}
            {analysisType === 'qwen' && (
              <div className="config-section">
                <label>GGUF 模型文件</label>
                <div className="file-input-group">
                  <input
                    type="text"
                    value={qwenConfig.modelPath}
                    placeholder="请选择 .gguf 模型文件"
                    readOnly
                  />
                  <button
                    onClick={handleSelectQwenModelPath}
                    disabled={isAnalyzing}
                  >
                    <FolderOpen className="w-4 h-4" />
                    选择文件
                  </button>
                </div>
                {qwenConfig.modelPath && (
                  <>
                    <label>计算设备</label>
                    <select
                      value={qwenConfig.device}
                      onChange={e =>
                        setQwenConfig(prev => ({
                          ...prev,
                          device: e.target.value as 'cpu' | 'cuda',
                        }))
                      }
                      disabled={isAnalyzing}
                    >
                      <option value="cpu">CPU</option>
                      <option value="cuda">GPU (CUDA)</option>
                    </select>
                    <label>
                      最大 Token 数 {qwenConfig.maxTokens}
                      <input
                        type="range"
                        min="100"
                        max="2048"
                        step="100"
                        value={qwenConfig.maxTokens}
                        onChange={e =>
                          setQwenConfig(prev => ({
                            ...prev,
                            maxTokens: parseInt(e.target.value),
                          }))
                        }
                        disabled={isAnalyzing}
                      />
                    </label>
                    <label>
                      温度 {qwenConfig.temperature.toFixed(1)}
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={qwenConfig.temperature}
                        onChange={e =>
                          setQwenConfig(prev => ({
                            ...prev,
                            temperature: parseFloat(e.target.value),
                          }))
                        }
                        disabled={isAnalyzing}
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Ollama 配置 */}
            {analysisType === 'ollama' && (
              <div className="config-section">
                <label>Ollama 请求路径</label>
                <div className="input-group">
                  <input
                    type="text"
                    value={ollamaConfig.baseUrl}
                    onChange={e =>
                      setOllamaConfig(prev => ({
                        ...prev,
                        baseUrl: e.target.value,
                      }))
                    }
                    placeholder="http://localhost:11434"
                    disabled={isAnalyzing}
                  />
                  <button
                    onClick={handleCheckOllamaConnection}
                    disabled={isAnalyzing || checkingOllama}
                  >
                    {checkingOllama ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '检查连接'
                    )}
                  </button>
                </div>
                {ollamaConnected && (
                  <div className="success-message">✅ Ollama 连接成功</div>
                )}
                {ollamaConnected && ollamaModels.length > 0 && (
                  <>
                    <label>选择模型</label>
                    <select
                      value={ollamaConfig.model}
                      onChange={e =>
                        setOllamaConfig(prev => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      disabled={isAnalyzing}
                    >
                      {ollamaModels.map(model => (
                        <option key={model.name} value={model.name}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label>
                  温度 {ollamaConfig.temperature.toFixed(1)}
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={ollamaConfig.temperature}
                    onChange={e =>
                      setOllamaConfig(prev => ({
                        ...prev,
                        temperature: parseFloat(e.target.value),
                      }))
                    }
                    disabled={isAnalyzing}
                  />
                </label>
                <label>
                  最大 Token 数 {ollamaConfig.maxTokens}
                  <input
                    type="range"
                    min="100"
                    max="2048"
                    step="100"
                    value={ollamaConfig.maxTokens}
                    onChange={e =>
                      setOllamaConfig(prev => ({
                        ...prev,
                        maxTokens: parseInt(e.target.value),
                      }))
                    }
                    disabled={isAnalyzing}
                  />
                </label>
              </div>
            )}

            {/* Shimmy 配置 */}
            {analysisType === 'shimmy' && (
              <div className="config-section">
                <label>Shimmy 工具路径</label>
                <div className="file-input-group">
                  <input
                    type="text"
                    value={shimmyConfig.shimmyPath}
                    placeholder="请选择 Shimmy 可执行文件路径"
                    readOnly
                  />
                  <button
                    onClick={handleSelectShimmyPath}
                    disabled={isAnalyzing}
                  >
                    <FolderOpen className="w-4 h-4" />
                    选择文件
                  </button>
                  <button
                    onClick={handleCheckShimmy}
                    disabled={
                      isAnalyzing || checkingShimmy || !shimmyConfig.shimmyPath
                    }
                  >
                    {checkingShimmy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '检查'
                    )}
                  </button>
                </div>
                {shimmyAvailable && (
                  <div className="success-message">✅ Shimmy 工具可用</div>
                )}
                {shimmyConfig.shimmyPath && (
                  <>
                    <label>模型名称</label>
                    <input
                      type="text"
                      value={shimmyConfig.model}
                      onChange={e =>
                        setShimmyConfig(prev => ({
                          ...prev,
                          model: e.target.value,
                        }))
                      }
                      placeholder="qwen-vl"
                      disabled={isAnalyzing}
                    />
                  </>
                )}
              </div>
            )}

            {/* WASM 配置 */}
            {analysisType === 'wasm' && (
              <>
                {/* 置信度阈值 */}
                <div className="config-section">
                  <label>
                    置信度阈值 {aiConfig.confidenceThreshold.toFixed(1)}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiConfig.confidenceThreshold}
                      onChange={e =>
                        setAiConfig(prev => ({
                          ...prev,
                          confidenceThreshold: parseFloat(e.target.value),
                        }))
                      }
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>

                {/* 最大标签数 */}
                <div className="config-section">
                  <label>
                    最大标签数 {aiConfig.maxTags}
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={aiConfig.maxTags}
                      onChange={e =>
                        setAiConfig(prev => ({
                          ...prev,
                          maxTags: parseInt(e.target.value),
                        }))
                      }
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>

                {/* 颜色分析开关 */}
                <div className="config-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aiConfig.analyzeColors}
                      onChange={e =>
                        setAiConfig(prev => ({
                          ...prev,
                          analyzeColors: e.target.checked,
                        }))
                      }
                      disabled={isAnalyzing}
                    />
                    启用颜色分析
                  </label>
                </div>

                {/* 对象检测开关 */}
                <div className="config-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aiConfig.detectObjects}
                      onChange={e =>
                        setAiConfig(prev => ({
                          ...prev,
                          detectObjects: e.target.checked,
                        }))
                      }
                      disabled={isAnalyzing}
                    />
                    启用对象检测
                  </label>
                </div>
              </>
            )}

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={
                !uploadedImage ||
                isAnalyzing ||
                (analysisType === 'qwen' && !qwenConfig.modelPath) ||
                (analysisType === 'ollama' && !ollamaConnected) ||
                (analysisType === 'shimmy' && !shimmyConfig.shimmyPath)
              }
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('aiAnalysis.analyze.analyzing')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t('aiAnalysis.analyze.start')}
                </>
              )}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {analysisResult &&
            analysisResult.success &&
            analysisResult.result && (
              <div className="analysis-result">
                <div className="result-header">
                  <h3>{t('aiAnalysis.result.title')}</h3>
                  <div className="analysis-stats">
                    <span className="confidence-badge">
                      {t('aiAnalysis.result.confidence')}{' '}
                      {((analysisResult.result.confidence || 0) * 100).toFixed(
                        1
                      )}
                      %
                    </span>
                    <span className="time-badge">
                      {analysisResult.result.analysisTime
                        ? analysisResult.result.analysisTime.toFixed(0)
                        : '0'}
                      {t('aiAnalysis.result.time')}
                    </span>
                  </div>
                </div>

                {/* 图片描述 - 突出显示 */}
                <div className="result-section featured-description">
                  <h4>{t('aiAnalysis.result.description.title')}</h4>
                  <div className="description-content">
                    <p>{analysisResult.result.description}</p>
                  </div>
                </div>

                {/* 标签云 - 改进样式 */}
                <div className="result-section">
                  <h4>{t('aiAnalysis.result.tags.title')}</h4>
                  <div className="enhanced-tags">
                    {analysisResult.result.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`enhanced-tag ${index < 3 ? 'primary-tag' : 'secondary-tag'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 基本信息 - 简化布局 */}
                <div className="result-section basic-info">
                  <h4>{t('aiAnalysis.result.imageInfo.title')}</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">
                        {t('aiAnalysis.result.imageInfo.format')}
                      </span>
                      <span className="info-value">
                        {analysisResult.result.imageType}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        {t('aiAnalysis.result.imageInfo.scene')}
                      </span>
                      <span className="info-value">
                        {analysisResult.result.sceneType}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        {t('aiAnalysis.result.imageInfo.model')}
                      </span>
                      <span className="info-value">
                        {analysisResult.result.modelUsed}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 检测对象 - 卡片式布局 */}
                {analysisResult.result.objects.length > 0 && (
                  <div className="result-section">
                    <h4>{t('aiAnalysis.result.objects.title')}</h4>
                    <div className="objects-grid">
                      {analysisResult.result.objects.map((obj, index) => (
                        <div key={index} className="object-card">
                          <div className="object-header">
                            <span className="object-name">{obj.name}</span>
                            <span className="object-confidence">
                              {(obj.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="object-category">{obj.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 颜色分析 - 视觉化改进 */}
                {analysisResult.result.colors.length > 0 && (
                  <div className="result-section">
                    <h4>{t('aiAnalysis.result.colors.title')}</h4>
                    <div className="colors-palette">
                      {analysisResult.result.colors.map((color, index) => (
                        <div key={index} className="color-card">
                          <div
                            className="color-swatch-large"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div className="color-info">
                            <div className="color-name">{color.name}</div>
                            <div className="color-details">
                              <span className="color-percentage">
                                {(color.percentage * 100).toFixed(1)}%
                              </span>
                              <span className="color-hex">{color.hex}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="result-actions">
                  <button
                    className="action-button primary"
                    onClick={() => {
                      // 复制分析结果到剪贴板
                      if (analysisResult.result) {
                        const summary = `图片描述: ${analysisResult.result.description}\n标签: ${analysisResult.result.tags.join(', ')}`;
                        navigator.clipboard.writeText(summary);
                      }
                    }}
                  >
                    {t('aiAnalysis.result.actions.copyResult')}
                  </button>
                  <button
                    className="action-button secondary"
                    onClick={() => {
                      // 应用到图片元数据（如果有回调）
                      if (onAnalysisComplete) {
                        onAnalysisComplete(analysisResult);
                      }
                    }}
                  >
                    {t('aiAnalysis.result.actions.applyToImage')}
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;

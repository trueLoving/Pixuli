import { defaultTranslate, useEscapeKey } from '@packages/ui/src';
import { FolderOpen, Loader2, Play, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { AIModelConfig, ImageAnalysisResponse } from '../../types/ai';
import './AIAnalysisModal.css';
import zhCN from './locales/zh-CN.json';

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

  // Qwen模型配置
  const [qwenConfig, setQwenConfig] = useState({
    modelPath: '',
    device: 'auto' as 'cpu' | 'cuda' | 'auto',
    maxTokens: 512,
    temperature: 0.7,
    useGpu: false,
    confidenceThreshold: 0.5,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择Qwen模型路径
  const handleSelectModelPath = async () => {
    try {
      const result = await window.aiAPI.selectModelFile();
      if (result.success && result.filePath) {
        setQwenConfig(prev => ({ ...prev, modelPath: result.filePath! }));
        setError('');
      } else {
        setError(t('common.error'));
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
    if (!uploadedImage || !qwenConfig.modelPath) {
      setError(t('common.error'));
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      // 将上传的图片文件转换为 Buffer
      const arrayBuffer = await uploadedImage.file.arrayBuffer();
      const buffer = window.Buffer.from(arrayBuffer);

      // 创建临时模型配置
      const tempModelConfig: AIModelConfig = {
        id: 'temp-qwen-model',
        name: 'Qwen LLM',
        type: 'qwen-llm',
        enabled: true,
        modelPath: qwenConfig.modelPath,
        device: qwenConfig.device,
        maxTokens: qwenConfig.maxTokens,
        temperature: qwenConfig.temperature,
      };

      // 使用 Qwen LLM 模型分析
      const result = await window.aiAPI.analyzeImageWithQwen({
        imageData: buffer,
        modelId: tempModelConfig.id,
        config: {
          useGpu: qwenConfig.useGpu,
          confidenceThreshold: qwenConfig.confidenceThreshold,
        },
      });

      setAnalysisResult(result);

      if (result.success && onAnalysisComplete) {
        onAnalysisComplete(result);
      } else {
        setError(result.error || t('common.error'));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(t('common.error'));
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

          {/* 模型配置区域 */}
          <div className="model-config-section">
            <h3>{t('aiAnalysis.modelConfig.title')}</h3>

            {/* Qwen模型路径配置 */}
            <div className="config-section">
              <label>{t('aiAnalysis.modelConfig.qwenModelPath')}</label>
              <div className="file-input-group">
                <input
                  type="text"
                  value={qwenConfig.modelPath}
                  onChange={e =>
                    setQwenConfig(prev => ({
                      ...prev,
                      modelPath: e.target.value,
                    }))
                  }
                  placeholder={t('common.error')}
                  readOnly
                />
                <button onClick={handleSelectModelPath} disabled={isAnalyzing}>
                  <FolderOpen className="w-4 h-4" />
                  {t('aiAnalysis.modelConfig.selectDirectory')}
                </button>
              </div>
            </div>

            {/* 计算设备选择 */}
            <div className="config-section">
              <label>{t('aiAnalysis.modelConfig.computeDevice')}</label>
              <select
                value={qwenConfig.device}
                onChange={e =>
                  setQwenConfig(prev => ({
                    ...prev,
                    device: e.target.value as 'cpu' | 'cuda' | 'auto',
                    useGpu: e.target.value === 'cuda',
                  }))
                }
                disabled={isAnalyzing}
              >
                <option value="auto">
                  {t('aiAnalysis.modelConfig.autoSelect')}
                </option>
                <option value="cpu">{t('aiAnalysis.modelConfig.cpu')}</option>
                <option value="cuda">{t('aiAnalysis.modelConfig.gpu')}</option>
              </select>
            </div>

            {/* 最大Token数 */}
            <div className="config-section">
              <label>
                {t('aiAnalysis.modelConfig.maxTokens')} {qwenConfig.maxTokens}
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
            </div>

            {/* 生成温度 */}
            <div className="config-section">
              <label>
                {t('aiAnalysis.modelConfig.temperature')}{' '}
                {qwenConfig.temperature}
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
            </div>

            {/* 置信度阈值 */}
            <div className="config-section">
              <label>
                {t('aiAnalysis.modelConfig.confidenceThreshold')}{' '}
                {qwenConfig.confidenceThreshold}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={qwenConfig.confidenceThreshold}
                  onChange={e =>
                    setQwenConfig(prev => ({
                      ...prev,
                      confidenceThreshold: parseFloat(e.target.value),
                    }))
                  }
                  disabled={isAnalyzing}
                />
              </label>
            </div>

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={!uploadedImage || !qwenConfig.modelPath || isAnalyzing}
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
                      {(analysisResult.result.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="time-badge">
                      {analysisResult.result.analysisTime.toFixed(0)}
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

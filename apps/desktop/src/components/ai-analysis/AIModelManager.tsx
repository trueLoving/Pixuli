import { useEscapeKey } from '@packages/ui/src';
import React, { useEffect, useState } from 'react';
import { AIModelConfig } from '../../types/electron';
import './AIModelManager.css';

interface AIModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUpdate?: () => void;
}

const AIModelManager: React.FC<AIModelManagerProps> = ({
  isOpen,
  onClose,
  onModelUpdate,
}) => {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);

  const [newModel, setNewModel] = useState<Partial<AIModelConfig>>({
    name: '',
    type: 'tensorflow',
    enabled: false,
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const modelList = await window.aiAPI.getModels();
      setModels(modelList);
      setError('');
    } catch (error) {
      console.error('Failed to load models:', error);
      setError('加载模型列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 注释掉下载相关功能
  /*
  const loadAvailableModels = async () => {
    try {
      const availableList = await window.modelAPI.getAvailableModels()
      setAvailableModels(availableList)
    } catch (error) {
      console.error('Failed to load available models:', error)
    }
  }

  const handleDownloadModel = async (modelId: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelId))
    setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }))

    try {
      const result = await window.modelAPI.downloadModel(modelId)
      if (result.success) {
        // 下载成功后，添加到模型列表
        const availableModel = availableModels.find(m => m.id === modelId)
        if (availableModel) {
          const newModel: AIModelConfig = {
            id: modelId,
            name: availableModel.name,
            type: availableModel.type as any,
            path: result.path,
            enabled: true,
            description: availableModel.description,
            version: availableModel.version,
            size: availableModel.size
          }

          await window.aiAPI.addModel(newModel)
          await loadModels()
          onModelUpdate?.()
        }
      } else {
        setError(result.error || '下载失败')
      }
    } catch (error) {
      console.error('Download failed:', error)
      setError('下载模型时发生错误')
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(modelId)
        return newSet
      })
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[modelId]
        return newProgress
      })
    }
  }
  */

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.type) {
      setError('请填写模型名称和类型');
      return;
    }

    setLoading(true);
    try {
      const modelId = `model_${Date.now()}`;
      const model: AIModelConfig = {
        id: modelId,
        name: newModel.name,
        type: newModel.type as any,
        path: newModel.path,
        apiEndpoint: newModel.apiEndpoint,
        apiKey: newModel.apiKey,
        enabled: newModel.enabled || false,
        description: newModel.description,
        version: newModel.version,
        size: newModel.size,
      };

      const result = await window.aiAPI.addModel(model);
      if (result.success) {
        await loadModels();
        setShowAddForm(false);
        setNewModel({
          name: '',
          type: 'tensorflow',
          enabled: false,
          description: '',
        });
        setError('');
        onModelUpdate?.();
      } else {
        setError(result.error || '添加模型失败');
      }
    } catch (error) {
      console.error('Add model failed:', error);
      setError('添加模型时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModel = async (modelId: string) => {
    if (!confirm('确定要删除这个模型吗？')) return;

    setLoading(true);
    try {
      const result = await window.aiAPI.removeModel(modelId);
      if (result.success) {
        await loadModels();
        onModelUpdate?.();
      } else {
        setError(result.error || '删除模型失败');
      }
    } catch (error) {
      console.error('Remove model failed:', error);
      setError('删除模型时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModel = async (modelId: string, enabled: boolean) => {
    setLoading(true);
    try {
      const result = await window.aiAPI.updateModel(modelId, { enabled });
      if (result.success) {
        await loadModels();
        onModelUpdate?.();
      } else {
        setError(result.error || '更新模型失败');
      }
    } catch (error) {
      console.error('Update model failed:', error);
      setError('更新模型时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      console.log('Selecting file for model type:', newModel.type);
      const result = await window.aiAPI.selectModelFile();
      console.log('File selection result:', result);
      if (result.success && result.filePath) {
        setNewModel({ ...newModel, path: result.filePath });
        console.log('File selected:', result.filePath);
      } else {
        console.error('File selection failed:', result.error);
        setError(result.error || '选择文件失败');
      }
    } catch (error) {
      console.error('Select file failed:', error);
      setError('选择文件失败');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tensorflow: 'TensorFlow',
      'tensorflow-lite': 'TensorFlow Lite',
      onnx: 'ONNX',
      'local-llm': '本地 LLM',
      'remote-api': '远程 API',
    };
    return labels[type] || type;
  };

  const isBuiltinModel = (modelId: string) => {
    return modelId.startsWith('builtin-');
  };

  // 键盘支持
  useEscapeKey(onClose);

  if (!isOpen) return null;

  return (
    <div className="ai-model-manager-overlay">
      <div className="ai-model-manager">
        <div className="ai-model-manager-header">
          <h2>AI 模型管理</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ai-model-manager-content">
          {error && <div className="error-message">{error}</div>}

          <div className="model-actions">
            <button
              className="add-model-button"
              onClick={() => setShowAddForm(true)}
              disabled={loading}
            >
              添加模型
            </button>
            <button
              className="refresh-button"
              onClick={loadModels}
              disabled={loading}
            >
              刷新
            </button>
          </div>

          {showAddForm && (
            <div className="add-model-form">
              <h3>添加新模型</h3>

              <div className="form-group">
                <label>模型名称:</label>
                <input
                  type="text"
                  value={newModel.name || ''}
                  onChange={e =>
                    setNewModel({ ...newModel, name: e.target.value })
                  }
                  placeholder="输入模型名称"
                />
              </div>

              <div className="form-group">
                <label>模型类型:</label>
                <select
                  value={newModel.type || 'tensorflow'}
                  onChange={e =>
                    setNewModel({ ...newModel, type: e.target.value as any })
                  }
                >
                  <option value="tensorflow">TensorFlow</option>
                  <option value="tensorflow-lite">TensorFlow Lite</option>
                  <option value="onnx">ONNX</option>
                  <option value="local-llm">本地 LLM</option>
                  <option value="remote-api">远程 API</option>
                </select>
              </div>

              <div className="form-group">
                <label>描述:</label>
                <input
                  type="text"
                  value={newModel.description || ''}
                  onChange={e =>
                    setNewModel({ ...newModel, description: e.target.value })
                  }
                  placeholder="输入模型描述"
                />
              </div>

              {(newModel.type === 'tensorflow' ||
                newModel.type === 'tensorflow-lite' ||
                newModel.type === 'onnx' ||
                newModel.type === 'local-llm') && (
                <div className="form-group">
                  <label>模型文件路径:</label>
                  <div className="file-input-group">
                    <input
                      type="text"
                      value={newModel.path || ''}
                      onChange={e =>
                        setNewModel({ ...newModel, path: e.target.value })
                      }
                      placeholder="选择模型文件"
                      readOnly
                    />
                    <button onClick={handleSelectFile}>选择文件</button>
                  </div>
                </div>
              )}

              {newModel.type === 'remote-api' && (
                <>
                  <div className="form-group">
                    <label>API 端点:</label>
                    <input
                      type="text"
                      value={newModel.apiEndpoint || ''}
                      onChange={e =>
                        setNewModel({
                          ...newModel,
                          apiEndpoint: e.target.value,
                        })
                      }
                      placeholder="https://api.example.com/analyze"
                    />
                  </div>
                  <div className="form-group">
                    <label>API 密钥:</label>
                    <input
                      type="password"
                      value={newModel.apiKey || ''}
                      onChange={e =>
                        setNewModel({ ...newModel, apiKey: e.target.value })
                      }
                      placeholder="输入 API 密钥"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newModel.enabled || false}
                    onChange={e =>
                      setNewModel({ ...newModel, enabled: e.target.checked })
                    }
                  />
                  启用此模型
                </label>
              </div>

              <div className="form-actions">
                <button onClick={handleAddModel} disabled={loading}>
                  {loading ? '添加中...' : '添加模型'}
                </button>
                <button onClick={() => setShowAddForm(false)}>取消</button>
              </div>
            </div>
          )}

          <div className="models-list">
            <h3>已安装的模型</h3>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : models.length === 0 ? (
              <div className="no-models">暂无模型</div>
            ) : (
              <div className="models-grid">
                {models.map(model => (
                  <div key={model.id} className="model-card">
                    <div className="model-header">
                      <h4>
                        {model.name}
                        {isBuiltinModel(model.id) && (
                          <span className="builtin-badge">内置</span>
                        )}
                      </h4>
                      <div className="model-status">
                        <span
                          className={`status-badge ${model.enabled ? 'enabled' : 'disabled'}`}
                        >
                          {model.enabled ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    </div>

                    <div className="model-info">
                      <p>
                        <strong>类型:</strong> {getModelTypeLabel(model.type)}
                      </p>
                      {model.description && (
                        <p>
                          <strong>描述:</strong> {model.description}
                        </p>
                      )}
                      {model.version && (
                        <p>
                          <strong>版本:</strong> {model.version}
                        </p>
                      )}
                      {model.size && (
                        <p>
                          <strong>大小:</strong> {formatFileSize(model.size)}
                        </p>
                      )}
                      {model.path && (
                        <p>
                          <strong>路径:</strong> {model.path}
                        </p>
                      )}
                      {model.apiEndpoint && (
                        <p>
                          <strong>API:</strong> {model.apiEndpoint}
                        </p>
                      )}
                    </div>

                    <div className="model-actions">
                      <button
                        className={`toggle-button ${model.enabled ? 'disable' : 'enable'}`}
                        onClick={() =>
                          handleToggleModel(model.id, !model.enabled)
                        }
                        disabled={loading}
                      >
                        {model.enabled ? '禁用' : '启用'}
                      </button>
                      {!isBuiltinModel(model.id) && (
                        <button
                          className="remove-button"
                          onClick={() => handleRemoveModel(model.id)}
                          disabled={loading}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 注释掉下载表单，改为手动导入模型 */}
          {/*
          {showDownloadForm && (
            <div className="download-model-form">
              <h3>下载预训练模型</h3>
              
              <div className="available-models">
                {availableModels.map(model => {
                  const isDownloading = downloadingModels.has(model.id)
                  const progress = downloadProgress[model.id] || 0
                  const isDownloaded = models.some(m => m.id === model.id)
                  
                  return (
                    <div key={model.id} className="available-model-item">
                      <div className="model-info">
                        <h4>{model.name}</h4>
                        <p className="model-description">{model.description}</p>
                        <div className="model-meta">
                          <span>类型: {getModelTypeLabel(model.type)}</span>
                          <span>版本: {model.version}</span>
                          <span>大小: {formatFileSize(model.size)}</span>
                        </div>
                      </div>
                      
                      <div className="model-actions">
                        {isDownloaded ? (
                          <span className="downloaded-badge">已安装</span>
                        ) : (
                          <button
                            className={`download-button ${isDownloading ? 'downloading' : ''}`}
                            onClick={() => handleDownloadModel(model.id)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span>{progress.toFixed(0)}%</span>
                              </>
                            ) : (
                              '下载'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="form-actions">
                <button onClick={() => setShowDownloadForm(false)}>
                  关闭
                </button>
              </div>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
};

export default AIModelManager;

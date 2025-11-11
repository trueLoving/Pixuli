import { GitHubConfigModal } from '@packages/ui/src';
import {
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { FullScreenLoading } from '../../features';
import { useI18n } from '../../i18n/useI18n';
import Main from '../../layouts/Main/Main';
import { useImageStore } from '../../stores/imageStore';
import { GitHubSourceConfig, useSourceStore } from '../../stores/sourceStore';

type GHForm = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
};
const emptyGH: GHForm = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  path: '',
};

export const SourceManager: React.FC = () => {
  const { t } = useI18n();
  const { sources, addSource, updateSource, removeSource, openProjectWindow } =
    useSourceStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGhModal, setShowGhModal] = useState(false);
  const [ghConfig, setGhConfig] = useState<GHForm>(emptyGH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // 从 localStorage 读取折叠状态
    const saved = localStorage.getItem('sourceManager_collapsed');
    return saved === 'true';
  });

  // 保存折叠状态到 localStorage
  useEffect(() => {
    localStorage.setItem('sourceManager_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const {
    images,
    loading,
    error,
    uploadImage,
    uploadMultipleImages,
    batchUploadProgress,
    deleteImage,
    updateImage,
    clearError,
    setGitHubConfig,
    initializeStorage,
    loadImages,
  } = useImageStore();

  const isEditing = useMemo(() => !!editingId, [editingId]);

  // 获取当前选中的仓库源
  const selectedSource = useMemo(() => {
    return sources.find(s => s.id === selectedId) || null;
  }, [sources, selectedId]);

  const startCreate = () => {
    setEditingId(null);
    setGhConfig(emptyGH);
    setShowGhModal(true);
  };

  const startEdit = (source: GitHubSourceConfig) => {
    setEditingId(source.id);
    setGhConfig({
      owner: source.owner,
      repo: source.repo,
      branch: source.branch,
      token: source.token,
      path: source.path,
    });
    setShowGhModal(true);
  };

  const handleSaveGh = (config: GHForm) => {
    if (isEditing && editingId) {
      updateSource(editingId, {
        ...config,
        name: `${config.owner}/${config.repo}`,
      });
    } else {
      addSource({ ...config, name: `${config.owner}/${config.repo}` });
    }
    setShowGhModal(false);
    setEditingId(null);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 顶部：源列表 */}
      <div
        className={`${
          isCollapsed ? 'h-12' : 'h-auto'
        } border-b bg-white flex flex-col transition-all duration-300 ease-in-out`}
      >
        {isCollapsed ? (
          <div className="flex items-center justify-between h-full px-4 gap-3">
            {selectedSource ? (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-semibold text-gray-900 truncate"
                      title={
                        selectedSource.name ||
                        `${selectedSource.owner}/${selectedSource.repo}`
                      }
                    >
                      {selectedSource.name ||
                        `${selectedSource.owner}/${selectedSource.repo}`}
                    </div>
                    <div
                      className="text-xs text-gray-500 truncate mt-0.5"
                      title={t('sourceManager.repoLine', {
                        owner: selectedSource.owner,
                        repo: selectedSource.repo,
                        branch: selectedSource.branch,
                      })}
                    >
                      {t('sourceManager.repoLine', {
                        owner: selectedSource.owner,
                        repo: selectedSource.repo,
                        branch: selectedSource.branch,
                      })}
                    </div>
                  </div>
                  {images.length > 0 && (
                    <div className="text-xs text-gray-400 whitespace-nowrap px-2 py-1 bg-gray-100 rounded">
                      {images.length} {t('sourceManager.imageCount') || '张'}
                    </div>
                  )}
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 flex-shrink-0"
                  onClick={() => setIsCollapsed(false)}
                  title={t('sourceManager.expand')}
                  disabled={isInitialLoading || loading}
                >
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 text-sm text-gray-400">
                  {t('sourceManager.empty')}
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 flex-shrink-0"
                  onClick={() => setIsCollapsed(false)}
                  title={t('sourceManager.expand')}
                  disabled={isInitialLoading || loading}
                >
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
                  onClick={() => setIsCollapsed(true)}
                  title={t('sourceManager.collapse')}
                  disabled={isInitialLoading || loading}
                >
                  <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                </button>
                <span>{t('sourceManager.title')}</span>
              </div>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
                onClick={startCreate}
                disabled={isInitialLoading || loading}
              >
                {t('sourceManager.add')}
              </button>
            </div>

            <div className="overflow-x-auto p-3">
              {sources.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-4">
                  {t('sourceManager.empty')}
                </div>
              ) : (
                <div className="flex gap-3">
                  {sources.map(s => (
                    <div
                      key={s.id}
                      onClick={async event => {
                        // 如果点击的是内部的按钮，则不执行选择操作
                        if ((event.target as HTMLElement).closest('button')) {
                          return;
                        }
                        // 开始初始加载
                        setIsInitialLoading(true);
                        setSelectedId(s.id);
                        try {
                          setGitHubConfig({
                            owner: s.owner,
                            repo: s.repo,
                            branch: s.branch,
                            token: s.token,
                            path: s.path,
                          } as any);
                          initializeStorage();
                          await loadImages();
                        } finally {
                          // 加载完成后隐藏 loading
                          setIsInitialLoading(false);
                        }
                      }}
                      className={`min-w-[280px] text-left rounded-lg border transition-all duration-300 ease-in-out cursor-pointer flex-shrink-0 ${
                        selectedId === s.id
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:scale-[1.01]'
                      } ${
                        isInitialLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{
                        pointerEvents: isInitialLoading ? 'none' : 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <div className="p-3">
                        {/* 仓库名称 */}
                        <div
                          className="text-sm font-semibold text-gray-900 line-clamp-1 truncate mb-1"
                          title={s.name || `${s.owner}/${s.repo}`}
                        >
                          {s.name || `${s.owner}/${s.repo}`}
                        </div>

                        {/* 仓库信息 */}
                        <div className="space-y-0.5 mb-2">
                          <div
                            className="text-xs text-gray-600 font-mono truncate"
                            title={t('sourceManager.repoLine', {
                              owner: s.owner,
                              repo: s.repo,
                              branch: s.branch,
                            })}
                          >
                            {t('sourceManager.repoLine', {
                              owner: s.owner,
                              repo: s.repo,
                              branch: s.branch,
                            })}
                          </div>
                          {s.path && (
                            <div
                              className="text-xs text-gray-500 truncate"
                              title={s.path}
                            >
                              {s.path}
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-2 justify-end">
                          <button
                            className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
                            onClick={e => {
                              e.stopPropagation();
                              openProjectWindow(s.id);
                            }}
                            disabled={isInitialLoading || loading}
                            title={t('sourceManager.openInNewWindow')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
                            onClick={e => {
                              e.stopPropagation();
                              startEdit(s);
                            }}
                            disabled={isInitialLoading || loading}
                            title={t('sourceManager.edit')}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
                            onClick={e => {
                              e.stopPropagation();
                              removeSource(s.id);
                              if (selectedId === s.id) setSelectedId(null);
                            }}
                            disabled={isInitialLoading || loading}
                            title={t('sourceManager.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 下方：内容区（复用 Home） */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full relative">
          {selectedId ? (
            <div key={selectedId} className="h-full fade-in">
              <Main
                t={t}
                error={error}
                onClearError={clearError}
                onUploadImage={uploadImage}
                onUploadMultipleImages={uploadMultipleImages}
                loading={loading}
                batchUploadProgress={batchUploadProgress}
                images={images}
                onDeleteImage={(imageId: string, fileName: string) =>
                  deleteImage(imageId, fileName)
                }
                onUpdateImage={(data: any) => updateImage(data)}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm fade-in-soft">
              {t('sourceManager.empty')}
            </div>
          )}
        </div>
      </div>

      {/* 全屏 Loading */}
      <FullScreenLoading
        visible={isInitialLoading || (loading && selectedId !== null)}
        text={t('sourceManager.loading')}
      />

      {/* GitHub 配置弹窗（新增/编辑） */}
      <GitHubConfigModal
        t={t}
        isOpen={showGhModal}
        onClose={() => {
          setShowGhModal(false);
          setEditingId(null);
        }}
        githubConfig={ghConfig as any}
        onSaveConfig={(cfg: any) => handleSaveGh(cfg)}
        onClearConfig={() => {
          setGhConfig(emptyGH);
          setEditingId(null);
          setShowGhModal(false);
        }}
        platform="desktop"
      />
    </div>
  );
};

// 移除原内联表单，统一改为弹窗配置

export default SourceManager;

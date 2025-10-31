import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GitHubConfigModal } from '@packages/ui/src';
import { useI18n } from '../i18n/useI18n';
import { useSourceStore, GitHubSourceConfig } from '../stores/sourceStore';
import { Home } from '../layout';
import { useImageStore } from '../stores/imageStore';

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
    <div className="h-full bg-gray-50 flex">
      {/* 左侧：源列表 */}
      <div
        className={`${
          isCollapsed ? 'w-12' : 'w-72'
        } border-r bg-white flex flex-col transition-all duration-200`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center py-2">
            <button
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => setIsCollapsed(false)}
              title={t('sourceManager.expand')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => setIsCollapsed(true)}
                  title={t('sourceManager.collapse')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>{t('sourceManager.title')}</span>
              </div>
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
                onClick={startCreate}
              >
                {t('sourceManager.add')}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-2">
              {sources.length === 0 ? (
                <div className="text-center text-gray-500 text-xs mt-4">
                  {t('sourceManager.empty')}
                </div>
              ) : (
                sources.map(s => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      setSelectedId(s.id);
                      setGitHubConfig({
                        owner: s.owner,
                        repo: s.repo,
                        branch: s.branch,
                        token: s.token,
                        path: s.path,
                      } as any);
                      initializeStorage();
                      await loadImages();
                    }}
                    className={`w-full text-left rounded border px-3 py-2 hover:bg-gray-50 ${
                      selectedId === s.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium line-clamp-1">
                      {s.name || `${s.owner}/${s.repo}`}
                    </div>
                    <div className="text-[11px] text-gray-500 break-all">
                      {t('sourceManager.repoLine', {
                        owner: s.owner,
                        repo: s.repo,
                        branch: s.branch,
                      })}
                    </div>
                    {s.path ? (
                      <div className="text-[11px] text-gray-400 break-all">
                        {s.path}
                      </div>
                    ) : null}
                    <div className="mt-2 flex gap-2">
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        onClick={e => {
                          e.stopPropagation();
                          openProjectWindow(s.id);
                        }}
                      >
                        {t('sourceManager.openInNewWindow')}
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-amber-500 text-white text-xs hover:bg-amber-600"
                        onClick={e => {
                          e.stopPropagation();
                          startEdit(s);
                        }}
                      >
                        {t('sourceManager.edit')}
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                        onClick={e => {
                          e.stopPropagation();
                          removeSource(s.id);
                          if (selectedId === s.id) setSelectedId(null);
                        }}
                      >
                        {t('sourceManager.delete')}
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* 右侧：内容区（复用 Home） */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full">
          {selectedId ? (
            <Home
              t={t}
              error={error}
              onClearError={clearError}
              onUploadImage={(file: File) => uploadImage({ file })}
              onUploadMultipleImages={(files: File[]) =>
                uploadMultipleImages({ files })
              }
              loading={loading}
              batchUploadProgress={batchUploadProgress}
              images={images}
              onDeleteImage={(imageId: string, fileName: string) =>
                deleteImage(imageId, fileName)
              }
              onUpdateImage={(data: any) => updateImage(data)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              {t('sourceManager.empty')}
            </div>
          )}
        </div>
      </div>

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

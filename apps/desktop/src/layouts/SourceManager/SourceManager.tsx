import { GiteeConfigModal, GitHubConfigModal } from '@packages/ui/src';
import {
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
  Github,
  Plus,
  FolderPlus,
  MousePointerClick,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { FullScreenLoading } from '../../features';
import { useI18n } from '../../i18n/useI18n';
import Main from '../../layouts/Main/Main';
import { useImageStore } from '../../stores/imageStore';
import { SourceConfig, useSourceStore } from '../../stores/sourceStore';

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

type GiteeForm = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
};
const emptyGitee: GiteeForm = {
  owner: '',
  repo: '',
  branch: 'master',
  token: '',
  path: '',
};

export const SourceManager: React.FC = () => {
  const { t } = useI18n();
  const { sources, addSource, updateSource, removeSource, openProjectWindow } =
    useSourceStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGhModal, setShowGhModal] = useState(false);
  const [showGiteeModal, setShowGiteeModal] = useState(false);
  const [ghConfig, setGhConfig] = useState<GHForm>(emptyGH);
  const [giteeConfig, setGiteeConfig] = useState<GiteeForm>(emptyGitee);
  const [showAddMenu, setShowAddMenu] = useState(false);
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
    deleteMultipleImages,
    updateImage,
    clearError,
    setGitHubConfig,
    setGiteeConfig: setImageStoreGiteeConfig,
    initializeStorage,
    loadImages,
  } = useImageStore();

  const isEditing = useMemo(() => !!editingId, [editingId]);

  // 获取当前选中的仓库源
  const selectedSource = useMemo(() => {
    return sources.find(s => s.id === selectedId) || null;
  }, [sources, selectedId]);

  const startCreateGitHub = () => {
    setEditingId(null);
    setGhConfig(emptyGH);
    setShowGhModal(true);
    setShowAddMenu(false);
  };

  const startCreateGitee = () => {
    setEditingId(null);
    setGiteeConfig(emptyGitee);
    setShowGiteeModal(true);
    setShowAddMenu(false);
  };

  const startEdit = (source: SourceConfig) => {
    setEditingId(source.id);
    if (source.type === 'github') {
      setGhConfig({
        owner: source.owner,
        repo: source.repo,
        branch: source.branch,
        token: source.token,
        path: source.path,
      });
      setShowGhModal(true);
    } else if (source.type === 'gitee') {
      setGiteeConfig({
        owner: source.owner,
        repo: source.repo,
        branch: source.branch,
        token: source.token,
        path: source.path,
      });
      setShowGiteeModal(true);
    }
  };

  const handleSaveGh = (config: GHForm) => {
    if (isEditing && editingId) {
      updateSource(editingId, {
        ...config,
        name: `${config.owner}/${config.repo}`,
      });
    } else {
      addSource({
        type: 'github',
        ...config,
        name: `${config.owner}/${config.repo}`,
      });
    }
    setShowGhModal(false);
    setEditingId(null);
  };

  const handleSaveGitee = (config: GiteeForm) => {
    if (isEditing && editingId) {
      updateSource(editingId, {
        ...config,
        name: `${config.owner}/${config.repo}`,
      });
    } else {
      addSource({
        type: 'gitee',
        ...config,
        name: `${config.owner}/${config.repo}`,
      });
    }
    setShowGiteeModal(false);
    setEditingId(null);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 顶部：源列表 */}
      <div className="border-b bg-white flex flex-col overflow-hidden">
        {/* 折叠状态：简化的头部 */}
        <div
          className={`flex items-center justify-between px-4 gap-3 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'h-12 opacity-100' : 'h-0 opacity-0 overflow-hidden'
          }`}
        >
          {selectedSource ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold text-gray-900 truncate"
                    title={selectedSource.name}
                  >
                    {selectedSource.name}
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
                <ChevronDown className="w-4 h-4 transition-transform duration-300 ease-in-out" />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-sm text-gray-500">
                {sources.length === 0
                  ? t('sourceManager.emptyTitle')
                  : t('sourceManager.selectSourceTitle')}
              </div>
              <button
                className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 flex-shrink-0"
                onClick={() => setIsCollapsed(false)}
                title={t('sourceManager.expand')}
                disabled={isInitialLoading || loading}
              >
                <ChevronDown className="w-4 h-4 transition-transform duration-300 ease-in-out" />
              </button>
            </>
          )}
        </div>

        {/* 展开状态：完整内容 */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'max-h-0 opacity-0 overflow-hidden'
              : 'max-h-[500px] opacity-100'
          }`}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-medium">
              <span>{t('sourceManager.title')}</span>
            </div>
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <button
                  className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 flex items-center gap-1"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  disabled={isInitialLoading || loading}
                >
                  <Plus className="w-3 h-3" />
                  {t('sourceManager.add')}
                </button>
                {showAddMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAddMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        onClick={startCreateGitHub}
                      >
                        <Github className="w-4 h-4" />
                        {t('sourceManager.githubRepo')}
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        onClick={startCreateGitee}
                      >
                        <span className="w-4 h-4 text-center text-xs font-bold text-[#c73e1d]">
                          码
                        </span>
                        {t('sourceManager.giteeRepo')}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
                onClick={() => setIsCollapsed(true)}
                title={t('sourceManager.collapse')}
                disabled={isInitialLoading || loading}
              >
                <ChevronUp className="w-4 h-4 transition-transform duration-300 ease-in-out" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[400px] px-3 pb-3">
            {sources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FolderPlus className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {t('sourceManager.emptyTitle')}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {t('sourceManager.empty')}
                  </p>
                  <button
                    onClick={() => setShowAddMenu(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isInitialLoading || loading}
                  >
                    {t('sourceManager.add')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
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
                        if (s.type === 'github') {
                          setGitHubConfig({
                            owner: s.owner,
                            repo: s.repo,
                            branch: s.branch,
                            token: s.token,
                            path: s.path,
                          } as any);
                        } else if (s.type === 'gitee') {
                          setImageStoreGiteeConfig({
                            owner: s.owner,
                            repo: s.repo,
                            branch: s.branch,
                            token: s.token,
                            path: s.path,
                          } as any);
                        }
                        initializeStorage();
                        await loadImages();
                      } finally {
                        // 加载完成后隐藏 loading
                        setIsInitialLoading(false);
                      }
                    }}
                    className={`group relative flex items-center justify-between px-4 py-3 rounded-lg border-l-4 transition-all duration-200 ease-in-out cursor-pointer ${
                      selectedId === s.id
                        ? 'border-l-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-l-transparent bg-white hover:bg-gray-50 hover:border-l-gray-300'
                    } ${
                      isInitialLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                      pointerEvents: isInitialLoading ? 'none' : 'auto',
                    }}
                  >
                    {/* 左侧：仓库信息 */}
                    <div className="flex-1 min-w-0 pr-4">
                      {/* 仓库名称 */}
                      <div className="flex items-center gap-2 mb-1">
                        {s.type === 'github' ? (
                          <Github className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <span className="w-4 h-4 text-center text-xs font-bold text-[#c73e1d] flex-shrink-0">
                            码
                          </span>
                        )}
                        <div
                          className="text-sm font-semibold text-gray-900 truncate"
                          title={s.name}
                        >
                          {s.name}
                        </div>
                        {selectedId === s.id && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                        )}
                      </div>

                      {/* 仓库详细信息 */}
                      <div className="flex flex-col gap-1">
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
                            className="text-xs text-gray-500 truncate flex items-center gap-1"
                            title={s.path}
                          >
                            <span className="text-gray-400">
                              {t('sourceManager.path')}:
                            </span>
                            <span>{s.path}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div
                      className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity duration-200 ${
                        selectedId === s.id
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {(s.type === 'github' || s.type === 'gitee') && (
                        <button
                          className="p-1.5 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center"
                          onClick={e => {
                            e.stopPropagation();
                            openProjectWindow(s.id);
                          }}
                          disabled={isInitialLoading || loading}
                          title={t('sourceManager.openInNewWindow')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-md text-gray-600 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center"
                        onClick={e => {
                          e.stopPropagation();
                          startEdit(s);
                        }}
                        disabled={isInitialLoading || loading}
                        title={t('sourceManager.edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex items-center justify-center"
                        onClick={e => {
                          e.stopPropagation();
                          removeSource(s.id);
                          if (selectedId === s.id) setSelectedId(null);
                        }}
                        disabled={isInitialLoading || loading}
                        title={t('sourceManager.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
                onDeleteMultipleImages={(
                  imageIds: string[],
                  fileNames: string[]
                ) => deleteMultipleImages(imageIds, fileNames)}
                onUpdateImage={(data: any) => updateImage(data)}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center fade-in-soft">
              <div className="flex flex-col items-center justify-center px-8 text-center max-w-md">
                {sources.length === 0 ? (
                  <>
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <FolderPlus className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-2">
                      {t('sourceManager.emptyTitle')}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      {t('sourceManager.empty')}
                    </p>
                    <button
                      onClick={() => {
                        setIsCollapsed(false);
                        setShowAddMenu(true);
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={isInitialLoading || loading}
                    >
                      <Plus className="w-4 h-4" />
                      {t('sourceManager.add')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 rounded-full mb-4">
                      <MousePointerClick className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-2">
                      {t('sourceManager.selectSourceTitle')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t('sourceManager.selectSource')}
                    </p>
                  </>
                )}
              </div>
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

      {/* Gitee 配置弹窗（新增/编辑） */}
      <GiteeConfigModal
        t={t}
        isOpen={showGiteeModal}
        onClose={() => {
          setShowGiteeModal(false);
          setEditingId(null);
        }}
        giteeConfig={giteeConfig as any}
        onSaveConfig={(cfg: any) => handleSaveGitee(cfg)}
        onClearConfig={() => {
          setGiteeConfig(emptyGitee);
          setEditingId(null);
          setShowGiteeModal(false);
        }}
        platform="desktop"
      />
    </div>
  );
};

// 移除原内联表单，统一改为弹窗配置

export default SourceManager;

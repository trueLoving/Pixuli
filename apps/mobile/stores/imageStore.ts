import {
  BatchUploadProgress,
  GitHubConfig,
  GitHubStorageService,
  GiteeConfig,
  GiteeStorageService,
  ImageEditData,
  ImageItem,
  MultiImageUploadData,
  UploadProgress,
} from '@packages/common/src/index.native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  clearGiteeConfig as clearGiteeConfigFromStorage,
  loadGiteeConfig,
} from '../config/gitee';
import {
  clearGitHubConfig as clearGitHubConfigFromStorage,
  loadGitHubConfig,
} from '../config/github';
import { LogActionType, LogStatus } from '@/types/log';
import { MetadataCache } from '../utils/metadataCache';
import { useLogStore } from './logStore';
import { useSourceStore } from './sourceStore';

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'size-desc'
  | 'size-asc';
export type FilterOption = {
  tags?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  dateFrom?: string;
  dateTo?: string;
};

interface ImageState {
  images: ImageItem[];
  filteredImages: ImageItem[];
  loading: boolean;
  error: string | null;
  githubConfig: GitHubConfig | null;
  giteeConfig: GiteeConfig | null;
  storageService: GitHubStorageService | GiteeStorageService | null;
  storageType: 'github' | 'gitee' | null;
  batchUploadProgress: BatchUploadProgress | null;

  // Search and Filter
  searchQuery: string;
  filterOptions: FilterOption;
  sortOption: SortOption;

  // Actions
  initialize: () => Promise<void>;
  setGitHubConfig: (config: GitHubConfig) => Promise<void>;
  clearGitHubConfig: () => Promise<void>;
  setGiteeConfig: (config: GiteeConfig) => Promise<void>;
  clearGiteeConfig: () => Promise<void>;
  initializeStorage: () => void;
  loadImages: () => Promise<void>;
  uploadImage: (uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }) => Promise<void>;
  uploadMultipleImages: (
    uploadData: MultiImageUploadData & { uris: string[] },
  ) => Promise<void>;
  deleteImage: (imageId: string, fileName: string) => Promise<void>;
  updateImage: (editData: ImageEditData) => Promise<void>;
  addImage: (image: ImageItem) => void;
  removeImage: (imageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setBatchUploadProgress: (progress: BatchUploadProgress | null) => void;

  // Search and Filter Actions
  setSearchQuery: (query: string) => void;
  setFilterOptions: (options: FilterOption) => void;
  clearFilters: () => void;
  setSortOption: (option: SortOption) => void;
  applyFiltersAndSort: () => void;
  getAllTags: () => string[];

  // Refresh single image metadata
  refreshImageMetadata: (image: ImageItem) => Promise<ImageItem | null>;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  filteredImages: [],
  loading: false,
  error: null,
  githubConfig: null,
  giteeConfig: null,
  storageService: null,
  storageType: null,
  batchUploadProgress: null,
  searchQuery: '',
  filterOptions: {},
  sortOption: 'date-desc',

  // 初始化（异步加载配置）
  initialize: async () => {
    // 初始化 sourceStore
    await useSourceStore.getState().initialize();

    const sourceStore = useSourceStore.getState();
    const sources = sourceStore.sources;

    // 迁移旧数据（如果存在）- 只在首次迁移时执行
    // 检查是否已经迁移过（通过检查是否有迁移标记或 sourceStore 已有数据）
    const MIGRATION_FLAG_KEY = 'pixuli.migration.completed';
    const migrationCompleted = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);

    if (!migrationCompleted && sources.length === 0) {
      // 迁移旧数据（如果存在）
      const oldGitHubConfig = await loadGitHubConfig();
      const oldGiteeConfig = await loadGiteeConfig();

      if (oldGitHubConfig) {
        const migratedSource = sourceStore.addSource({
          type: 'github',
          name: `${oldGitHubConfig.owner}/${oldGitHubConfig.repo}`,
          owner: oldGitHubConfig.owner,
          repo: oldGitHubConfig.repo,
          branch: oldGitHubConfig.branch,
          token: oldGitHubConfig.token,
          path: oldGitHubConfig.path,
        });
        sourceStore.setSelectedSourceId(migratedSource.id);
        // 迁移后清除旧配置并标记已完成迁移
        await clearGitHubConfigFromStorage();
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      } else if (oldGiteeConfig) {
        const migratedSource = sourceStore.addSource({
          type: 'gitee',
          name: `${oldGiteeConfig.owner}/${oldGiteeConfig.repo}`,
          owner: oldGiteeConfig.owner,
          repo: oldGiteeConfig.repo,
          branch: oldGiteeConfig.branch,
          token: oldGiteeConfig.token,
          path: oldGiteeConfig.path,
        });
        sourceStore.setSelectedSourceId(migratedSource.id);
        // 迁移后清除旧配置并标记已完成迁移
        await clearGiteeConfigFromStorage();
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      } else {
        // 没有旧配置，也标记已完成迁移
        await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      }
    }

    // 从 sourceStore 获取当前选中的源
    const selectedSourceId = useSourceStore.getState().selectedSourceId;
    const selectedSource = selectedSourceId
      ? sourceStore.getSourceById(selectedSourceId)
      : sources[0] || null;

    if (selectedSource) {
      const config = {
        owner: selectedSource.owner,
        repo: selectedSource.repo,
        branch: selectedSource.branch,
        token: selectedSource.token,
        path: selectedSource.path,
      };

      if (selectedSource.type === 'github') {
        set({
          githubConfig: config,
          giteeConfig: null,
          storageType: 'github',
        });
        try {
          const storageService = new GitHubStorageService(config, {
            platform: 'mobile',
          });
          MetadataCache.setCurrentCacheKey('github', config.owner, config.repo);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize github storage service:', error);
        }
      } else {
        set({
          githubConfig: null,
          giteeConfig: config,
          storageType: 'gitee',
        });
        try {
          const storageService = new GiteeStorageService(config, {
            platform: 'mobile',
            useProxy: false,
          });
          MetadataCache.setCurrentCacheKey('gitee', config.owner, config.repo);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize gitee storage service:', error);
        }
      }
    } else {
      set({
        githubConfig: null,
        giteeConfig: null,
        storageType: null,
        storageService: null,
      });
    }
  },

  setGitHubConfig: async (config: GitHubConfig) => {
    // 这个方法保留用于向后兼容，但现在应该通过 sourceStore 来管理
    // 如果 sourceStore 中有选中的源，则更新它；否则创建新源
    const sourceStore = useSourceStore.getState();
    const selectedSourceId = sourceStore.selectedSourceId;
    const selectedSource = selectedSourceId
      ? sourceStore.getSourceById(selectedSourceId)
      : null;

    if (selectedSource && selectedSource.type === 'github') {
      // 更新现有源
      sourceStore.updateSource(selectedSourceId!, {
        name: `${config.owner}/${config.repo}`,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      });
    } else {
      // 创建新源
      const newSource = sourceStore.addSource({
        type: 'github',
        name: `${config.owner}/${config.repo}`,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      });
      sourceStore.setSelectedSourceId(newSource.id);
    }

    set({
      githubConfig: config,
      giteeConfig: null,
      storageType: 'github',
      // 切换仓库源时清空图片列表，避免数据混淆
      images: [],
      filteredImages: [],
      error: null,
    });
    get().initializeStorage();
    useLogStore
      .getState()
      .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
        details: { type: 'github', action: 'set' },
      });
  },

  clearGitHubConfig: async () => {
    // 这个方法保留用于向后兼容
    // 从 sourceStore 中删除所有 GitHub 源
    const sourceStore = useSourceStore.getState();
    const githubSources = sourceStore.sources.filter(s => s.type === 'github');

    // 等待所有删除操作完成
    for (const source of githubSources) {
      await sourceStore.removeSource(source.id);
    }

    // 如果当前选中的是 GitHub 源，切换到其他源或清空
    const currentSource = sourceStore.selectedSourceId
      ? sourceStore.getSourceById(sourceStore.selectedSourceId)
      : null;
    if (currentSource && currentSource.type === 'github') {
      const remainingSources = sourceStore.sources;
      if (remainingSources.length > 0) {
        sourceStore.setSelectedSourceId(remainingSources[0].id);
        get().initialize();
      } else {
        sourceStore.setSelectedSourceId(null);
        set({
          storageService: null,
          storageType: null,
          githubConfig: null,
          giteeConfig: null,
          images: [],
          filteredImages: [],
          error: null,
        });
      }
    } else {
      set({ githubConfig: null });
    }
    useLogStore
      .getState()
      .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
        details: { type: 'github', action: 'clear' },
      });
  },

  setGiteeConfig: async (config: GiteeConfig) => {
    // 这个方法保留用于向后兼容，但现在应该通过 sourceStore 来管理
    // 如果 sourceStore 中有选中的源，则更新它；否则创建新源
    const sourceStore = useSourceStore.getState();
    const selectedSourceId = sourceStore.selectedSourceId;
    const selectedSource = selectedSourceId
      ? sourceStore.getSourceById(selectedSourceId)
      : null;

    if (selectedSource && selectedSource.type === 'gitee') {
      // 更新现有源
      sourceStore.updateSource(selectedSourceId!, {
        name: `${config.owner}/${config.repo}`,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      });
    } else {
      // 创建新源
      const newSource = sourceStore.addSource({
        type: 'gitee',
        name: `${config.owner}/${config.repo}`,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        token: config.token,
        path: config.path,
      });
      sourceStore.setSelectedSourceId(newSource.id);
    }

    set({
      githubConfig: null,
      giteeConfig: config,
      storageType: 'gitee',
      // 切换仓库源时清空图片列表，避免数据混淆
      images: [],
      filteredImages: [],
      error: null,
    });
    get().initializeStorage();
    useLogStore
      .getState()
      .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
        details: { type: 'gitee', action: 'set' },
      });
  },

  clearGiteeConfig: async () => {
    // 这个方法保留用于向后兼容
    // 从 sourceStore 中删除所有 Gitee 源
    const sourceStore = useSourceStore.getState();
    const giteeSources = sourceStore.sources.filter(s => s.type === 'gitee');

    // 等待所有删除操作完成
    for (const source of giteeSources) {
      await sourceStore.removeSource(source.id);
    }

    // 如果当前选中的是 Gitee 源，切换到其他源或清空
    const currentSource = sourceStore.selectedSourceId
      ? sourceStore.getSourceById(sourceStore.selectedSourceId)
      : null;
    if (currentSource && currentSource.type === 'gitee') {
      const remainingSources = sourceStore.sources;
      if (remainingSources.length > 0) {
        sourceStore.setSelectedSourceId(remainingSources[0].id);
        get().initialize();
      } else {
        sourceStore.setSelectedSourceId(null);
        set({
          storageService: null,
          storageType: null,
          githubConfig: null,
          giteeConfig: null,
          images: [],
          filteredImages: [],
          error: null,
        });
      }
    } else {
      set({ giteeConfig: null });
    }
    useLogStore
      .getState()
      .addLog(LogActionType.CONFIG_CHANGE, LogStatus.SUCCESS, {
        details: { type: 'gitee', action: 'clear' },
      });
  },

  initializeStorage: () => {
    // 从 sourceStore 获取当前选中的源
    const sourceStore = useSourceStore.getState();
    const selectedSourceId = sourceStore.selectedSourceId;
    const selectedSource = selectedSourceId
      ? sourceStore.getSourceById(selectedSourceId)
      : sourceStore.sources[0] || null;

    if (selectedSource) {
      const config = {
        owner: selectedSource.owner,
        repo: selectedSource.repo,
        branch: selectedSource.branch,
        token: selectedSource.token,
        path: selectedSource.path,
      };

      if (selectedSource.type === 'github') {
        set({
          githubConfig: config,
          giteeConfig: null,
          storageType: 'github',
        });
        try {
          const storageService = new GitHubStorageService(config, {
            platform: 'mobile',
          });
          MetadataCache.setCurrentCacheKey('github', config.owner, config.repo);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize github storage service:', error);
          set({ error: '初始化GitHub存储服务失败' });
        }
      } else {
        set({
          githubConfig: null,
          giteeConfig: config,
          storageType: 'gitee',
        });
        try {
          const storageService = new GiteeStorageService(config, {
            platform: 'mobile',
            useProxy: false,
          });
          MetadataCache.setCurrentCacheKey('gitee', config.owner, config.repo);
          set({ storageService });
        } catch (error) {
          console.error('Failed to initialize gitee storage service:', error);
          set({ error: '初始化Gitee存储服务失败' });
        }
      }
    } else {
      set({
        githubConfig: null,
        giteeConfig: null,
        storageType: null,
        storageService: null,
      });
    }
  },

  loadImages: async () => {
    const { storageService, storageType } = get();

    if (!storageService) {
      set({
        error:
          storageType === 'gitee'
            ? 'Gitee 配置未初始化'
            : 'GitHub 配置未初始化',
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      // 快速获取基础图片列表（不等待元数据）
      const images = await storageService.getImageList();

      // 去重：确保每个图片ID只出现一次
      const uniqueImages = images.reduce(
        (acc: ImageItem[], current: ImageItem) => {
          const existingIndex = acc.findIndex(img => img.id === current.id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            const existing = acc[existingIndex];
            if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        },
        [],
      );

      // 先设置基础图片列表，让页面快速显示
      set({ images: uniqueImages, loading: false });
      // 应用搜索和筛选
      get().applyFiltersAndSort();

      // 异步加载元数据并更新（不阻塞页面显示）
      if (storageService && 'loadImageMetadata' in storageService) {
        (storageService as any)
          .loadImageMetadata(uniqueImages)
          .then((imagesWithMetadata: ImageItem[]) => {
            // 再次去重并更新
            const updatedUniqueImages = imagesWithMetadata.reduce(
              (acc: ImageItem[], current) => {
                const existingIndex = acc.findIndex(
                  img => img.id === current.id,
                );
                if (existingIndex === -1) {
                  acc.push(current);
                } else {
                  const existing = acc[existingIndex];
                  if (
                    new Date(current.updatedAt) > new Date(existing.updatedAt)
                  ) {
                    acc[existingIndex] = current;
                  }
                }
                return acc;
              },
              [],
            );
            // 更新图片列表（包含元数据）
            set({ images: updatedUniqueImages });
            // 应用搜索和筛选
            get().applyFiltersAndSort();
          })
          .catch((error: Error) => {
            console.warn('Failed to load image metadata:', error);
            // 元数据加载失败不影响基础功能
          });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '加载图片失败';
      set({
        error: errorMsg,
        loading: false,
      });
    }
  },

  uploadImage: async (uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }) => {
    const { storageService } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化', loading: false });
      return;
    }

    set({ loading: true, error: null });
    const start = Date.now();
    try {
      const newImage = await storageService.uploadImage(uploadData);
      set(state => ({
        images: state.images.some(img => img.id === newImage.id)
          ? state.images.map(img => (img.id === newImage.id ? newImage : img))
          : [...state.images, newImage],
        loading: false,
      }));
      get().applyFiltersAndSort();
      useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.SUCCESS, {
        imageId: newImage.id,
        imageName: newImage.name,
        duration: Date.now() - start,
        details: {
          size: newImage.size,
          type: newImage.type,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '上传图片失败';
      set({ error: msg, loading: false });
      useLogStore.getState().addLog(LogActionType.UPLOAD, LogStatus.FAILED, {
        imageName: uploadData.name,
        error: msg,
        duration: Date.now() - start,
      });
    }
  },

  uploadMultipleImages: async (
    uploadData: MultiImageUploadData & { uris: string[] },
  ) => {
    const { storageService } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化', loading: false });
      return;
    }

    const { uris, name, description, tags } = uploadData;
    const total = uris.length;
    let completed = 0;
    let failed = 0;
    try {
      const items: UploadProgress[] = uris.map((_uri, index) => ({
        id: `${Date.now()}-${index}`,
        progress: 0,
        status: 'uploading' as const,
        message: '等待上传...',
      }));

      set({
        loading: true,
        error: null,
        batchUploadProgress: {
          total,
          completed: 0,
          failed: 0,
          current: uris[0]?.split('/').pop(),
          items,
        },
      });

      const uploadedImages: ImageItem[] = [];

      for (let i = 0; i < uris.length; i++) {
        const uri = uris[i];
        const itemId = items[i].id;
        const fileName = uri.split('/').pop() || `image-${i + 1}.jpg`;

        try {
          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  current: fileName,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? {
                          ...item,
                          status: 'uploading',
                          message: '正在上传...',
                        }
                      : item,
                  ),
                }
              : null,
          }));

          const uploadData = {
            uri,
            name: name ? `${name}-${i + 1}-${fileName}` : fileName,
            description,
            tags,
          };

          const newImage = await storageService.uploadImage(uploadData);
          uploadedImages.push(newImage);
          completed++;

          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  completed,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? {
                          ...item,
                          status: 'success',
                          progress: 100,
                          message: '上传成功',
                        }
                      : item,
                  ),
                }
              : null,
          }));
        } catch (error) {
          failed++;
          const errorMessage =
            error instanceof Error ? error.message : '上传失败';

          set(state => ({
            batchUploadProgress: state.batchUploadProgress
              ? {
                  ...state.batchUploadProgress,
                  failed,
                  items: state.batchUploadProgress.items.map(item =>
                    item.id === itemId
                      ? { ...item, status: 'error', message: errorMessage }
                      : item,
                  ),
                }
              : null,
          }));
        }
      }

      const batchStartTime = Date.now();
      set(state => ({
        images: [...state.images, ...uploadedImages],
        loading: false,
        batchUploadProgress: null,
      }));
      get().applyFiltersAndSort();
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_UPLOAD, LogStatus.SUCCESS, {
          details: {
            total,
            completed,
            failed,
            images: uploadedImages.map(img => ({ id: img.id, name: img.name })),
          },
          duration: Date.now() - batchStartTime,
        });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '批量上传失败';
      set({
        error: errorMsg,
        loading: false,
        batchUploadProgress: null,
      });
      useLogStore
        .getState()
        .addLog(LogActionType.BATCH_UPLOAD, LogStatus.FAILED, {
          error: errorMsg,
          details: { total, completed, failed },
        });
    }
  },

  deleteImage: async (imageId: string, fileName: string) => {
    const { storageService } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化', loading: false });
      return;
    }

    set({ loading: true, error: null });
    const startTime = Date.now();
    try {
      await storageService.deleteImage(imageId, fileName);
      const duration = Date.now() - startTime;
      set(state => ({
        images: state.images.filter(img => img.id !== imageId),
        loading: false,
      }));
      get().applyFiltersAndSort();
      useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.SUCCESS, {
        imageId,
        imageName: fileName,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : '删除图片失败';
      set({ error: msg, loading: false });
      useLogStore.getState().addLog(LogActionType.DELETE, LogStatus.FAILED, {
        imageId,
        imageName: fileName,
        error: msg,
        duration,
      });
    }
  },

  updateImage: async (editData: ImageEditData) => {
    const { storageService, images } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化', loading: false });
      return;
    }

    const image = images.find(img => img.id === editData.id);
    if (!image) {
      set({ error: '图片不存在', loading: false });
      return;
    }

    set({ loading: true, error: null });
    const startTime = Date.now();
    try {
      const metadata = {
        name: editData.name || image.name,
        description: editData.description || image.description,
        tags: editData.tags || image.tags,
        updatedAt: new Date().toISOString(),
      };

      await storageService.updateImageInfo(editData.id, image.name, metadata);

      const duration = Date.now() - startTime;
      set(state => ({
        images: state.images.map(img =>
          img.id === editData.id ? { ...img, ...metadata } : img,
        ),
        loading: false,
      }));
      get().applyFiltersAndSort();
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.SUCCESS, {
        imageId: editData.id,
        imageName: metadata.name,
        duration,
        details: {
          changes: {
            name:
              editData.name !== image.name
                ? { old: image.name, new: editData.name }
                : undefined,
            description:
              editData.description !== image.description
                ? { old: image.description, new: editData.description }
                : undefined,
            tags:
              editData.tags !== image.tags
                ? { old: image.tags, new: editData.tags }
                : undefined,
          },
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : '更新图片失败';
      set({ error: msg, loading: false });
      useLogStore.getState().addLog(LogActionType.EDIT, LogStatus.FAILED, {
        imageId: editData.id,
        imageName: image.name,
        error: msg,
        duration,
      });
    }
  },

  addImage: (image: ImageItem) => {
    set(state => ({
      images: state.images.some(img => img.id === image.id)
        ? state.images.map(img => (img.id === image.id ? image : img))
        : [...state.images, image],
    }));
    get().applyFiltersAndSort();
  },

  removeImage: (imageId: string) => {
    set(state => ({
      images: state.images.filter(img => img.id !== imageId),
    }));
    get().applyFiltersAndSort();
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setBatchUploadProgress: (progress: BatchUploadProgress | null) => {
    set({ batchUploadProgress: progress });
  },

  // Search and Filter Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFiltersAndSort();
  },

  setFilterOptions: (options: FilterOption) => {
    set({ filterOptions: options });
    get().applyFiltersAndSort();
  },

  clearFilters: () => {
    set({ searchQuery: '', filterOptions: {}, sortOption: 'date-desc' });
    get().applyFiltersAndSort();
  },

  setSortOption: (option: SortOption) => {
    set({ sortOption: option });
    get().applyFiltersAndSort();
  },

  applyFiltersAndSort: () => {
    const { images, searchQuery, filterOptions, sortOption } = get();

    let filtered = [...images];

    // 应用搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(image => {
        const nameMatch = image.name.toLowerCase().includes(query);
        const descMatch = image.description?.toLowerCase().includes(query);
        const tagMatch = image.tags.some(tag =>
          tag.toLowerCase().includes(query),
        );
        return nameMatch || descMatch || tagMatch;
      });
    }

    // 应用筛选
    if (filterOptions.tags && filterOptions.tags.length > 0) {
      filtered = filtered.filter(image =>
        filterOptions.tags!.some(tag => image.tags.includes(tag)),
      );
    }

    if (filterOptions.minWidth !== undefined) {
      filtered = filtered.filter(
        image => image.width >= filterOptions.minWidth!,
      );
    }

    if (filterOptions.minHeight !== undefined) {
      filtered = filtered.filter(
        image => image.height >= filterOptions.minHeight!,
      );
    }

    if (filterOptions.maxWidth !== undefined) {
      filtered = filtered.filter(
        image => image.width <= filterOptions.maxWidth!,
      );
    }

    if (filterOptions.maxHeight !== undefined) {
      filtered = filtered.filter(
        image => image.height <= filterOptions.maxHeight!,
      );
    }

    if (filterOptions.dateFrom) {
      filtered = filtered.filter(
        image => image.createdAt >= filterOptions.dateFrom!,
      );
    }

    if (filterOptions.dateTo) {
      filtered = filtered.filter(
        image => image.createdAt <= filterOptions.dateTo!,
      );
    }

    // 应用排序
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return (b.size || 0) - (a.size || 0);
        case 'size-asc':
          return (a.size || 0) - (b.size || 0);
        default:
          return 0;
      }
    });

    set({ filteredImages: filtered });
  },

  getAllTags: () => {
    const { images } = get();
    const tagSet = new Set<string>();
    images.forEach(image => {
      image.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  },

  // 刷新单个图片的元数据
  refreshImageMetadata: async (image: ImageItem) => {
    const { storageService } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化' });
      return null;
    }

    try {
      // 强制刷新该图片的元数据
      const updatedImages = await storageService.loadImageMetadata([image], {
        forceRefresh: true,
      });

      if (updatedImages.length > 0) {
        const updatedImage = updatedImages[0];

        // 更新 store 中的图片
        set(state => ({
          images: state.images.map(img =>
            img.id === image.id ? updatedImage : img,
          ),
        }));

        // 应用搜索和筛选
        get().applyFiltersAndSort();

        return updatedImage;
      }

      return null;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新元数据失败',
      });
      return null;
    }
  },
}));

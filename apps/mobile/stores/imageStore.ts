import {
  BatchUploadProgress,
  GitHubConfig,
  ImageEditData,
  ImageItem,
  ImageUploadData,
  MultiImageUploadData,
  UploadProgress,
  UpyunConfig,
} from 'pixuli-ui/src';
import { create } from 'zustand';
import { GitHubStorageService } from '../services/githubStorageService';
import {
  loadGitHubConfig,
  saveGitHubConfig,
  clearGitHubConfig,
} from '../config/github';
import {
  loadUpyunConfig,
  saveUpyunConfig,
  clearUpyunConfig,
} from '../config/upyun';

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
  upyunConfig: UpyunConfig | null;
  storageService: GitHubStorageService | null;
  storageType: 'github' | 'upyun' | null;
  batchUploadProgress: BatchUploadProgress | null;

  // Search and Filter
  searchQuery: string;
  filterOptions: FilterOption;
  sortOption: SortOption;

  // Actions
  initialize: () => Promise<void>;
  setGitHubConfig: (config: GitHubConfig) => Promise<void>;
  clearGitHubConfig: () => Promise<void>;
  setUpyunConfig: (config: UpyunConfig) => Promise<void>;
  clearUpyunConfig: () => Promise<void>;
  initializeStorage: () => void;
  loadImages: () => Promise<void>;
  uploadImage: (uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }) => Promise<void>;
  uploadMultipleImages: (
    uploadData: MultiImageUploadData & { uris: string[] }
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
  upyunConfig: null,
  storageService: null,
  storageType: null,
  batchUploadProgress: null,
  searchQuery: '',
  filterOptions: {},
  sortOption: 'date-desc',

  // 初始化（异步加载配置）
  initialize: async () => {
    const initialGitHubConfig = await loadGitHubConfig();
    const initialUpyunConfig = await loadUpyunConfig();

    const storageType = initialUpyunConfig
      ? 'upyun'
      : initialGitHubConfig
        ? 'github'
        : null;

    set({
      githubConfig: initialGitHubConfig,
      upyunConfig: initialUpyunConfig,
      storageType,
    });

    if (storageType === 'github' && initialGitHubConfig) {
      try {
        const storageService = new GitHubStorageService(initialGitHubConfig);
        set({ storageService });
      } catch (error) {
        console.error('Failed to initialize github storage service:', error);
      }
    }
    // TODO: 实现 UpyunStorageService
  },

  setGitHubConfig: async (config: GitHubConfig) => {
    await saveGitHubConfig(config);
    set({ githubConfig: config, storageType: 'github' });
    get().initializeStorage();
  },

  clearGitHubConfig: async () => {
    await clearGitHubConfig();
    const { storageType } = get();
    if (storageType === 'github') {
      set({ storageService: null, storageType: null, githubConfig: null });
    }
  },

  setUpyunConfig: async (config: UpyunConfig) => {
    await saveUpyunConfig(config);
    set({ upyunConfig: config, storageType: 'upyun' });
    get().initializeStorage();
  },

  clearUpyunConfig: async () => {
    await clearUpyunConfig();
    const { storageType } = get();
    if (storageType === 'upyun') {
      set({ storageService: null, storageType: null, upyunConfig: null });
    }
  },

  initializeStorage: () => {
    const { githubConfig, upyunConfig, storageType } = get();

    if (storageType === 'upyun' && upyunConfig) {
      // TODO: 实现 UpyunStorageService
      console.warn('Upyun storage service not implemented yet');
    } else if (storageType === 'github' && githubConfig) {
      try {
        const storageService = new GitHubStorageService(githubConfig);
        set({ storageService });
      } catch (error) {
        console.error('Failed to initialize github storage service:', error);
        set({ error: '初始化GitHub存储服务失败' });
      }
    }
  },

  loadImages: async () => {
    const { storageService, storageType } = get();

    if (!storageService) {
      set({
        error: `${storageType === 'upyun' ? '又拍云' : 'GitHub'} 配置未初始化`,
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      // 快速获取基础图片列表（不等待元数据）
      const images = await storageService.getImageList();

      // 去重：确保每个图片ID只出现一次
      const uniqueImages = images.reduce((acc: ImageItem[], current) => {
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
      }, []);

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
                  img => img.id === current.id
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
              []
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
    try {
      const newImage = await storageService.uploadImage(uploadData);
      set(state => ({
        images: state.images.some(img => img.id === newImage.id)
          ? state.images.map(img => (img.id === newImage.id ? newImage : img))
          : [...state.images, newImage],
        loading: false,
      }));
      // 应用搜索和筛选
      get().applyFiltersAndSort();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '上传图片失败',
        loading: false,
      });
    }
  },

  uploadMultipleImages: async (
    uploadData: MultiImageUploadData & { uris: string[] }
  ) => {
    const { storageService } = get();
    if (!storageService) {
      set({ error: '存储服务未初始化', loading: false });
      return;
    }

    try {
      const { uris, name, description, tags } = uploadData;
      const total = uris.length;
      let completed = 0;
      let failed = 0;
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
                      : item
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
                      : item
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
                      : item
                  ),
                }
              : null,
          }));
        }
      }

      set(state => ({
        images: [...state.images, ...uploadedImages],
        loading: false,
        batchUploadProgress: null,
      }));
      // 应用搜索和筛选
      get().applyFiltersAndSort();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '批量上传失败',
        loading: false,
        batchUploadProgress: null,
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
    try {
      await storageService.deleteImage(imageId, fileName);
      set(state => ({
        images: state.images.filter(img => img.id !== imageId),
        loading: false,
      }));
      // 应用搜索和筛选
      get().applyFiltersAndSort();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除图片失败',
        loading: false,
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
    try {
      const metadata = {
        name: editData.name || image.name,
        description: editData.description || image.description,
        tags: editData.tags || image.tags,
        updatedAt: new Date().toISOString(),
      };

      await storageService.updateImageInfo(
        editData.id,
        image.name,
        metadata,
        image.name
      );

      set(state => ({
        images: state.images.map(img =>
          img.id === editData.id ? { ...img, ...metadata } : img
        ),
        loading: false,
      }));
      // 应用搜索和筛选
      get().applyFiltersAndSort();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新图片失败',
        loading: false,
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
          tag.toLowerCase().includes(query)
        );
        return nameMatch || descMatch || tagMatch;
      });
    }

    // 应用筛选
    if (filterOptions.tags && filterOptions.tags.length > 0) {
      filtered = filtered.filter(image =>
        filterOptions.tags!.some(tag => image.tags.includes(tag))
      );
    }

    if (filterOptions.minWidth !== undefined) {
      filtered = filtered.filter(
        image => image.width >= filterOptions.minWidth!
      );
    }

    if (filterOptions.minHeight !== undefined) {
      filtered = filtered.filter(
        image => image.height >= filterOptions.minHeight!
      );
    }

    if (filterOptions.maxWidth !== undefined) {
      filtered = filtered.filter(
        image => image.width <= filterOptions.maxWidth!
      );
    }

    if (filterOptions.maxHeight !== undefined) {
      filtered = filtered.filter(
        image => image.height <= filterOptions.maxHeight!
      );
    }

    if (filterOptions.dateFrom) {
      filtered = filtered.filter(
        image => image.createdAt >= filterOptions.dateFrom!
      );
    }

    if (filterOptions.dateTo) {
      filtered = filtered.filter(
        image => image.createdAt <= filterOptions.dateTo!
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
            img.id === image.id ? updatedImage : img
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

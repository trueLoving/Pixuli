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

interface ImageState {
  images: ImageItem[];
  loading: boolean;
  error: string | null;
  githubConfig: GitHubConfig | null;
  upyunConfig: UpyunConfig | null;
  storageService: GitHubStorageService | null;
  storageType: 'github' | 'upyun' | null;
  batchUploadProgress: BatchUploadProgress | null;

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
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  loading: false,
  error: null,
  githubConfig: null,
  upyunConfig: null,
  storageService: null,
  storageType: null,
  batchUploadProgress: null,

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

      set({ images: uniqueImages, loading: false });
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
  },

  removeImage: (imageId: string) => {
    set(state => ({
      images: state.images.filter(img => img.id !== imageId),
    }));
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
}));

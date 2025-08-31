import { create } from 'zustand'
import { ImageItem, ImageUploadData, ImageEditData, GitHubConfig } from '@/type/image'
import { GitHubStorageService } from '@/services/githubStorage'
import { loadGitHubConfig, saveGitHubConfig } from '@/config/github'

interface ImageState {
  images: ImageItem[]
  loading: boolean
  error: string | null
  githubConfig: GitHubConfig | null
  storageService: GitHubStorageService | null
  
  // Actions
  setGitHubConfig: (config: GitHubConfig) => void
  clearGitHubConfig: () => void
  initializeStorage: () => void
  loadImages: () => Promise<void>
  uploadImage: (uploadData: ImageUploadData) => Promise<void>
  deleteImage: (imageId: string, fileName: string) => Promise<void>
  updateImage: (editData: ImageEditData) => Promise<void>
  addImage: (image: ImageItem) => void
  removeImage: (imageId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useImageStore = create<ImageState>((set, get) => {
  // 在store创建时加载配置并初始化存储服务
  const initialConfig = loadGitHubConfig()
  
  return {
    images: [],
    loading: false,
    error: null,
    githubConfig: initialConfig,
    storageService: initialConfig ? new GitHubStorageService(initialConfig) : null,

    setGitHubConfig: (config: GitHubConfig) => {
      set({ githubConfig: config })
      saveGitHubConfig(config)
      get().initializeStorage()
    },

    initializeStorage: () => {
      const { githubConfig } = get()
      if (githubConfig) {
        try {
          const storageService = new GitHubStorageService(githubConfig)
          set({ storageService })
        } catch (error) {
          console.error('Failed to initialize storage service:', error)
          set({ error: '初始化存储服务失败' })
        }
      }
    },

    loadImages: async () => {
      const { storageService } = get()
      
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' })
        return
      }

      set({ loading: true, error: null })
      try {
        const images = await storageService.getImageList()
        
        // 去重：确保每个图片ID只出现一次，如果有重复，保留最新的
        const uniqueImages = images.reduce((acc: ImageItem[], current) => {
          const existingIndex = acc.findIndex(img => img.id === current.id)
          if (existingIndex === -1) {
            // 新图片，直接添加
            acc.push(current)
          } else {
            // 已存在，比较更新时间，保留最新的
            const existing = acc[existingIndex]
            if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
              acc[existingIndex] = current
            }
          }
          return acc
        }, [])
        
        set({ images: uniqueImages, loading: false })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '加载图片失败'
        set({ 
          error: errorMsg, 
          loading: false 
        })
      }
    },

    uploadImage: async (uploadData: ImageUploadData) => {
      const { storageService } = get()
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' })
        return
      }

      set({ loading: true, error: null })
      try {
        const newImage = await storageService.uploadImage(uploadData)
        set(state => ({
          // 去重：确保不会添加重复ID的图片
          images: state.images.some(img => img.id === newImage.id) 
            ? state.images.map(img => img.id === newImage.id ? newImage : img)
            : [...state.images, newImage],
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '上传图片失败', 
          loading: false 
        })
      }
    },

    deleteImage: async (imageId: string, fileName: string) => {
      const { storageService } = get()
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' })
        return
      }

      set({ loading: true, error: null })
      try {
        await storageService.deleteImage(imageId, fileName)
        set(state => ({
          images: state.images.filter(img => img.id !== imageId),
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '删除图片失败', 
          loading: false 
        })
      }
    },

    updateImage: async (editData: ImageEditData) => {
      const { storageService, images } = get()
      if (!storageService) {
        set({ error: 'GitHub 配置未初始化' })
        return
      }

      const image = images.find(img => img.id === editData.id)
      if (!image) {
        set({ error: '图片不存在' })
        return
      }

      set({ loading: true, error: null })
      try {
        const metadata = {
          name: editData.name || image.name,
          description: editData.description || image.description,
          tags: editData.tags || image.tags,
          updatedAt: new Date().toISOString()
        }

        // 传递旧文件名用于重命名检测
        await storageService.updateImageInfo(editData.id, image.name, metadata, image.name)
        
        set(state => ({
          images: state.images.map(img => 
            img.id === editData.id 
              ? { ...img, ...metadata }
              : img
          ),
          loading: false
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : '更新图片失败', 
          loading: false 
        })
      }
    },

    addImage: (image: ImageItem) => {
      set(state => ({
        // 去重：确保不会添加重复ID的图片
        images: state.images.some(img => img.id === image.id) 
          ? state.images.map(img => img.id === image.id ? image : img)
          : [...state.images, image]
      }))
    },

    removeImage: (imageId: string) => {
      set(state => ({
        images: state.images.filter(img => img.id !== imageId)
      }))
    },

    setLoading: (loading: boolean) => {
      set({ loading })
    },

    setError: (error: string | null) => {
      set({ error })
    },

      clearError: () => {
    set({ error: null })
  },

  clearGitHubConfig: () => {
    import('@/config/github').then(({ clearGitHubConfig }) => {
      clearGitHubConfig()
      set({ 
        githubConfig: null, 
        storageService: null, 
        images: [],
        error: null 
      })
    })
  },
  }
}) 
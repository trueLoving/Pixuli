import { ImageItem, GitHubConfig, ImageUploadData } from '@/types/image'

export class GitHubStorageService {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
    // 设置 GitHub 认证
    this.setAuth()
  }

  private async setAuth() {
    try {
      await window.electronAPI.githubSetAuth(this.config.token)
    } catch (error) {
      console.error('Failed to set GitHub auth:', error)
    }
  }

  // 上传图片到 GitHub
  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    try {
      const { file, name, description, tags } = uploadData
      const fileName = name || file.name
      
      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file)
      
      // 通过 IPC 调用主进程的 GitHub 上传功能
      const response = await window.electronAPI.githubUpload({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName,
        content: base64Content,
        description,
        tags
      })

      // 获取图片信息
      const imageInfo = await this.getImageInfo(file)
      
      const imageItem: ImageItem = {
        id: response.sha || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.downloadUrl || '',
        githubUrl: response.htmlUrl || '',
        size: file.size,
        width: imageInfo.width,
        height: imageInfo.height,
        type: file.type,
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return imageItem
    } catch (error) {
      console.error('Upload image failed:', error)
      throw new Error(`上传图片失败: ${error}`)
    }
  }

  // 删除图片
  async deleteImage(imageId: string, fileName: string): Promise<void> {
    try {
      await window.electronAPI.githubDelete({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName
      })
    } catch (error) {
      console.error('Delete image failed:', error)
      throw new Error(`删除图片失败: ${error}`)
    }
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await window.electronAPI.githubGetList({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch
      })

      const images = response.map((item: any) => ({
        id: item.sha,
        name: item.name,
        url: item.downloadUrl || '',
        githubUrl: item.htmlUrl || '',
        size: item.size || 0, // 现在从后端获取文件大小
        width: item.width || 0,
        height: item.height || 0,
        type: this.getMimeType(item.name),
        tags: item.tags || [],
        description: item.description || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }))
      
      // 检查重复ID
      const idCounts = images.reduce((acc: Record<string, number>, img) => {
        acc[img.id] = (acc[img.id] || 0) + 1
        return acc
      }, {})
      
      const duplicateIds = Object.entries(idCounts).filter(([_, count]) => count > 1)
      if (duplicateIds.length > 0) {
        console.warn('发现重复的图片ID:', duplicateIds)
        // 为重复的ID添加后缀以确保唯一性
        const processedImages = images.map((img, index) => {
          if (idCounts[img.id] > 1) {
            return {
              ...img,
              id: `${img.id}-${index}`
            }
          }
          return img
        })
        return processedImages
      }
      
      return images
    } catch (error) {
      console.error('Get image list failed:', error)
      throw new Error(`获取图片列表失败: ${error}`)
    }
  }

  // 更新图片信息（如标签、描述等）
  async updateImageInfo(imageId: string, fileName: string, metadata: any, oldFileName?: string): Promise<void> {
    try {
      await window.electronAPI.githubUpdateMetadata({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
        fileName,
        metadata,
        oldFileName
      })
    } catch (error) {
      console.error('Update image info failed:', error)
      throw new Error(`更新图片信息失败: ${error}`)
    }
  }

  // 辅助方法：文件转 base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        // 移除 data:image/...;base64, 前缀
        const base64Content = base64.split(',')[1]
        resolve(base64Content)
      }
      reader.onerror = error => reject(error)
    })
  }

  // 辅助方法：获取图片信息
  private async getImageInfo(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // 辅助方法：判断是否为图片文件
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  }

  // 辅助方法：获取 MIME 类型
  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }
    return mimeTypes[extension] || 'image/jpeg'
  }
} 
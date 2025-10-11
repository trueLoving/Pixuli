import type { ImageItem, GitHubConfig, ImageUploadData } from '@packages/ui/src'

export class GitHubStorageService {
  private config: GitHubConfig
  private baseUrl = 'https://api.github.com'

  constructor(config: GitHubConfig) {
    this.config = config
  }

  private async makeGitHubRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Pixuli-Web',
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `GitHub API error: ${response.status}`)
    }

    return response.json()
  }

  // 上传图片到 GitHub
  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    try {
      const { file, name, description, tags } = uploadData
      const fileName = name || file.name
      
      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file)
      
      // 构建文件路径
      const filePath = `${this.config.path}/${fileName}`
      
      // 调用 GitHub API 上传文件
      const response = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: `Upload image: ${fileName}${description ? ` - ${description}` : ''}`,
            content: base64Content,
            branch: this.config.branch
          })
        }
      )

      // 获取图片信息
      const imageInfo = await this.getImageInfo(file)
      
      const imageItem: ImageItem = {
        id: response.content.sha || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.content.download_url || '',
        githubUrl: response.content.html_url || '',
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
  async deleteImage(_imageId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`
      
      // 首先获取文件的SHA
      const fileInfo = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}?ref=${this.config.branch}`
      )
      
      // 删除文件
      await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${filePath}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete image: ${fileName}`,
            sha: fileInfo.sha,
            branch: this.config.branch
          })
        }
      )
    } catch (error) {
      console.error('Delete image failed:', error)
      throw new Error(`删除图片失败: ${error}`)
    }
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.makeGitHubRequest(
        `/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}?ref=${this.config.branch}`
      )

      // 过滤出图片文件
      const imageFiles = response.filter((item: any) => 
        this.isImageFile(item.name) && item.type === 'file'
      )

      const images = imageFiles.map((item: any) => {
        return {
          id: item.sha,
          name: item.name,
          url: item.download_url || '',
          githubUrl: item.html_url || '',
          size: item.size || 0,
          width: 0, // 初始设为0，后续通过懒加载获取
          height: 0, // 初始设为0，后续通过懒加载获取
          type: this.getMimeType(item.name),
          tags: [], // GitHub API 不直接支持标签，需要从文件名或描述中解析
          description: '', // GitHub API 不直接支持描述，需要从commit消息中解析
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      
      // 检查重复ID
      const idCounts = images.reduce((acc: Record<string, number>, img: ImageItem) => {
        acc[img.id] = (acc[img.id] || 0) + 1
        return acc
      }, {})
      
      const duplicateIds = Object.entries(idCounts).filter(([_, count]) => (count as number) > 1)
      if (duplicateIds.length > 0) {
        console.warn('发现重复的图片ID:', duplicateIds)
        // 为重复的ID添加后缀以确保唯一性
        const processedImages = images.map((img: ImageItem, index: number) => {
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
  async updateImageInfo(_imageId: string, fileName: string, _metadata: any, oldFileName?: string): Promise<void> {
    try {
      // GitHub API 不支持直接更新元数据，需要通过重命名文件来实现
      if (oldFileName && oldFileName !== fileName) {
        const oldFilePath = `${this.config.path}/${oldFileName}`
        const newFilePath = `${this.config.path}/${fileName}`
        
        // 获取原文件信息
        const fileInfo = await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${oldFilePath}?ref=${this.config.branch}`
        )
        
        // 创建新文件
        await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${newFilePath}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: `Rename image: ${oldFileName} -> ${fileName}`,
              content: fileInfo.content,
              sha: fileInfo.sha,
              branch: this.config.branch
            })
          }
        )
        
        // 删除原文件
        await this.makeGitHubRequest(
          `/repos/${this.config.owner}/${this.config.repo}/contents/${oldFilePath}`,
          {
            method: 'DELETE',
            body: JSON.stringify({
              message: `Delete old image: ${oldFileName}`,
              sha: fileInfo.sha,
              branch: this.config.branch
            })
          }
        )
      }
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
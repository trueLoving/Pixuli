import { Octokit } from 'octokit'
import type { ImageItem, GitHubConfig, ImageUploadData } from '@/types/image'

export class GitHubStorageService {
  private config: GitHubConfig
  private octokit: Octokit

  constructor(config: GitHubConfig) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.token,
    })
  }

  // 上传图片到 GitHub
  async uploadImage(uploadData: ImageUploadData): Promise<ImageItem> {
    try {
      const { file, name, description, tags } = uploadData
      const fileName = name || file.name
      
      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file)
      
      // 使用 Octokit 上传文件
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: `${this.config.path}/${fileName}`,
        message: `Upload image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
      })

      // 获取图片信息
      const imageInfo = await this.getImageInfo(file)
      
      const imageItem: ImageItem = {
        id: response.data.content?.sha || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.data.content?.download_url || '',
        githubUrl: response.data.content?.html_url || '',
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
      // 首先获取文件的 SHA
      const fileInfo = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: `${this.config.path}/${fileName}`,
        branch: this.config.branch,
      })

      if ('sha' in fileInfo.data) {
        await this.octokit.rest.repos.deleteFile({
          owner: this.config.owner,
          repo: this.config.repo,
          path: `${this.config.path}/${fileName}`,
          message: `Delete image: ${fileName}`,
          sha: fileInfo.data.sha,
          branch: this.config.branch,
        })
      }
    } catch (error) {
      console.error('Delete image failed:', error)
      throw new Error(`删除图片失败: ${error}`)
    }
  }

  // 获取图片列表
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        branch: this.config.branch,
      })

      if (!Array.isArray(response.data)) {
        return []
      }

      const images = response.data
        .filter((item: any) => this.isImageFile(item.name))
        .map((item: any) => ({
          id: item.sha,
          name: item.name,
          url: item.download_url || '',
          githubUrl: item.html_url || '',
          size: item.size || 0,
          width: 0, // GitHub API 不提供图片尺寸，需要额外获取
          height: 0,
          type: this.getMimeType(item.name),
          tags: [],
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      
      return images
    } catch (error) {
      console.error('Get image list failed:', error)
      throw new Error(`获取图片列表失败: ${error}`)
    }
  }

  // 更新图片信息（如标签、描述等）
  async updateImageInfo(_imageId: string, fileName: string, metadata: any, _oldFileName?: string): Promise<void> {
    try {
      // GitHub API 不支持直接更新文件元数据
      // 这里可以实现一个简单的方案：创建一个包含元数据的隐藏文件
      const metadataFileName = `.${fileName}.meta`
      const metadataContent = JSON.stringify(metadata)
      const base64Content = btoa(metadataContent)
      
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: `${this.config.path}/${metadataFileName}`,
        message: `Update metadata for: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
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

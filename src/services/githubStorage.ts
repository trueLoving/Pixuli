import { Octokit } from 'octokit'
import { ImageItem, GitHubConfig, ImageUploadData } from '@/type/image'

export class GitHubStorageService {
  private octokit: Octokit
  private config: GitHubConfig

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
      const filePath = `${this.config.path}/${fileName}`
      
      // 将文件转换为 base64
      const base64Content = await this.fileToBase64(file)
      
      // 上传到 GitHub
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Add image: ${fileName}`,
        content: base64Content,
        branch: this.config.branch,
      })

      // 获取图片信息
      const imageInfo = await this.getImageInfo(file)
      
      const imageItem: ImageItem = {
        id: response.data.content?.sha || Date.now().toString(),
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
  async deleteImage(imageId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`
      
      // 获取文件的当前 SHA
      const fileInfo = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      })

      if (Array.isArray(fileInfo.data)) {
        throw new Error('路径指向目录，不是文件')
      }

      await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Delete image: ${fileName}`,
        sha: fileInfo.data.sha,
        branch: this.config.branch,
      })
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
        ref: this.config.branch,
      })

      if (!Array.isArray(response.data)) {
        return []
      }

      const imageItems: ImageItem[] = []
      
      for (const item of response.data) {
        if (this.isImageFile(item.name)) {
          try {
            const imageInfo = await this.getImageInfoFromUrl(item.download_url || '')
            imageItems.push({
              id: item.sha,
              name: item.name,
              url: item.download_url || '',
              githubUrl: item.html_url || '',
              size: 0, // GitHub API 不提供文件大小
              width: imageInfo.width,
              height: imageInfo.height,
              type: this.getMimeType(item.name),
              tags: [],
              description: '',
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.updated_at || new Date().toISOString(),
            })
          } catch (error) {
            console.warn(`Failed to get info for image: ${item.name}`, error)
          }
        }
      }

      return imageItems
    } catch (error) {
      console.error('Get image list failed:', error)
      throw new Error(`获取图片列表失败: ${error}`)
    }
  }

  // 更新图片信息（如标签、描述等）
  async updateImageInfo(imageId: string, fileName: string, metadata: any): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`
      
      // 获取文件的当前内容
      const fileInfo = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      })

      if (Array.isArray(fileInfo.data)) {
        throw new Error('路径指向目录，不是文件')
      }

      // 创建元数据文件
      const metadataFileName = `${fileName}.json`
      const metadataPath = `${this.config.path}/.metadata/${metadataFileName}`
      const metadataContent = JSON.stringify(metadata, null, 2)

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: metadataPath,
        message: `Update metadata for: ${fileName}`,
        content: Buffer.from(metadataContent).toString('base64'),
        branch: this.config.branch,
        sha: fileInfo.data.sha,
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

  // 辅助方法：从 URL 获取图片信息
  private async getImageInfoFromUrl(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        })
      }
      img.src = url
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
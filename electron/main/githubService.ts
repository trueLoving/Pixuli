import { Octokit } from 'octokit'
import { ipcMain } from 'electron'

export class GitHubService {
  private octokit: Octokit | null = null

  constructor() {
    this.setupIpcHandlers()
  }

  private setupIpcHandlers() {
    // 设置 GitHub 认证
    ipcMain.handle('github:setAuth', async (event, token: string) => {
      try {
        this.octokit = new Octokit({ auth: token })
        return { success: true }
      } catch (error) {
        console.error('Failed to set GitHub auth:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
    })

    // 上传图片
    ipcMain.handle('github:upload', async (event, params: any) => {
      try {
        if (!this.octokit) {
          throw new Error('GitHub 认证未设置')
        }

        const { owner, repo, path, branch, fileName, content, description, tags } = params
        const filePath = `${path}/${fileName}`
        
        const response = await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `Add image: ${fileName}`,
          content,
          branch,
        })

        return {
          sha: response.data.content?.sha,
          downloadUrl: response.data.content?.download_url,
          htmlUrl: response.data.content?.html_url,
        }
      } catch (error) {
        console.error('GitHub upload failed:', error)
        throw error
      }
    })

    // 删除图片
    ipcMain.handle('github:delete', async (event, params: any) => {
      try {
        if (!this.octokit) {
          throw new Error('GitHub 认证未设置')
        }

        const { owner, repo, path, branch, fileName } = params
        const filePath = `${path}/${fileName}`
        
        // 获取文件的当前 SHA
        const fileInfo = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: filePath,
          ref: branch,
        })

        if (Array.isArray(fileInfo.data)) {
          throw new Error('路径指向目录，不是文件')
        }

        await this.octokit.rest.repos.deleteFile({
          owner,
          repo,
          path: filePath,
          message: `Delete image: ${fileName}`,
          sha: fileInfo.data.sha,
          branch,
        })
      } catch (error) {
        console.error('GitHub delete failed:', error)
        throw error
      }
    })

    // 获取图片列表
    ipcMain.handle('github:getList', async (event, params: any) => {
      try {
        if (!this.octokit) {
          throw new Error('GitHub 认证未设置')
        }

        const { owner, repo, path, branch } = params
        
        const response = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        })

        if (!Array.isArray(response.data)) {
          return []
        }

        const imageItems = []
        
        for (const item of response.data) {
          if (this.isImageFile(item.name)) {
            imageItems.push({
              sha: item.sha,
              name: item.name,
              downloadUrl: item.download_url,
              htmlUrl: item.html_url,
              width: 0, // 需要额外处理获取图片尺寸
              height: 0,
              tags: [],
              description: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        }

        return imageItems
      } catch (error) {
        console.error('GitHub get list failed:', error)
        throw error
      }
    })

    // 更新元数据
    ipcMain.handle('github:updateMetadata', async (event, params: any) => {
      try {
        if (!this.octokit) {
          throw new Error('GitHub 认证未设置')
        }

        const { owner, repo, path, branch, fileName, metadata } = params
        
        // 创建元数据文件
        const metadataFileName = `${fileName}.json`
        const metadataPath = `${path}/.metadata/${metadataFileName}`
        const metadataContent = JSON.stringify(metadata, null, 2)

        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: metadataPath,
          message: `Update metadata for: ${fileName}`,
          content: Buffer.from(metadataContent).toString('base64'),
          branch,
        })
      } catch (error) {
        console.error('GitHub update metadata failed:', error)
        throw error
      }
    })
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  }
} 
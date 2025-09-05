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
        
        // 首先检查文件是否已存在
        let existingSha: string | null = null
        try {
          const existingFile = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch,
          })
          
          if (Array.isArray(existingFile.data)) {
            // 如果是目录，抛出错误
            throw new Error('Path is a directory')
          } else {
            existingSha = existingFile.data.sha
          }
        } catch (error: any) {
          // 如果文件不存在，existingSha 保持为 null
          if (error.status !== 404) {
            console.warn('Error checking existing file:', error.message)
          }
        }
        
        const response = await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: existingSha ? `Update image: ${fileName}` : `Add image: ${fileName}`,
          content,
          branch,
          ...(existingSha && { sha: existingSha }),
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

        const { owner, repo, path, branch, fileName, metadata, oldFileName } = params
        
        // 如果文件名发生了变化，需要重命名文件
        if (oldFileName && oldFileName !== metadata.name) {
          await this.renameFile(owner, repo, path, branch, oldFileName, metadata.name)
        }
        
        // 创建或更新元数据文件
        const metadataFileName = `${metadata.name}.json`
        const metadataPath = `${path}/.metadata/${metadataFileName}`
        const metadataContent = JSON.stringify(metadata, null, 2)

        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: metadataPath,
          message: `Update metadata for: ${metadata.name}`,
          content: Buffer.from(metadataContent).toString('base64'),
          branch,
        })
      } catch (error) {
        console.error('GitHub update metadata failed:', error)
        throw error
      }
    })
  }

  // 重命名文件
  private async renameFile(owner: string, repo: string, path: string, branch: string, oldFileName: string, newFileName: string) {
    try {
      const oldFilePath = `${path}/${oldFileName}`
      const newFilePath = `${path}/${newFileName}`

      // 1. 获取原文件内容
      const fileInfo = await this.octokit!.rest.repos.getContent({
        owner,
        repo,
        path: oldFilePath,
        ref: branch,
      })

      if (Array.isArray(fileInfo.data)) {
        throw new Error('原路径指向目录，不是文件')
      }

      const fileData = fileInfo.data as any
      const fileContent = fileData.content
      const fileEncoding = fileData.encoding

      if (!fileContent || fileEncoding !== 'base64') {
        throw new Error('无法获取文件内容')
      }

      // 2. 上传到新文件名
      await this.octokit!.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: newFilePath,
        message: `Rename file: ${oldFileName} → ${newFileName}`,
        content: fileContent,
        branch,
      })

      // 3. 删除原文件
      await this.octokit!.rest.repos.deleteFile({
        owner,
        repo,
        path: oldFilePath,
        message: `Delete old file after rename: ${oldFileName}`,
        sha: fileData.sha,
        branch,
      })

      // 4. 删除旧的metadata文件（如果存在）
      try {
        const oldMetadataPath = `${path}/.metadata/${oldFileName}.json`
        const oldMetadataInfo = await this.octokit!.rest.repos.getContent({
          owner,
          repo,
          path: oldMetadataPath,
          ref: branch,
        })

        if (!Array.isArray(oldMetadataInfo.data)) {
          const oldMetadataData = oldMetadataInfo.data as any
          await this.octokit!.rest.repos.deleteFile({
            owner,
            repo,
            path: oldMetadataPath,
            message: `Delete old metadata after rename: ${oldFileName}`,
            sha: oldMetadataData.sha,
            branch,
          })
        }
      } catch (metadataError) {
        // 如果旧的metadata文件不存在，忽略错误
        console.log('Old metadata file not found, skipping deletion')
      }

    } catch (error) {
      console.error('GitHub rename file failed:', error)
      throw new Error(`重命名文件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  }
} 
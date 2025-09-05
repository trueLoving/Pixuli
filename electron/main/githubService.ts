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

        // 筛选出图片文件
        const imageFiles = response.data.filter(item => this.isImageFile(item.name))
        
        if (imageFiles.length === 0) {
          return []
        }

        // 使用批量方式获取文件时间信息
        const imageItems = []
        const defaultDate = new Date().toISOString()
        const fileTimeMap = new Map<string, string>()
        
        try {
          // 方案1：尝试使用 GraphQL 批量获取
          const query = `
            query GetFileHistory($owner: String!, $repo: String!, $branch: String!) {
              repository(owner: $owner, name: $repo) {
                ref(qualifiedName: $branch) {
                  target {
                    ... on Commit {
                      history(first: 100) {
                        nodes {
                          committedDate
                          message
                          additions
                          deletions
                        }
                      }
                    }
                  }
                }
              }
            }
          `
          
          const graphqlResponse = await this.octokit.graphql(query, {
            owner,
            repo,
            branch: `refs/heads/${branch}`
          }) as any
          
          const commits = graphqlResponse.repository?.ref?.target?.history?.nodes || []
           
          // 获取仓库第一次提交的时间（最后一个提交，因为历史是按时间倒序排列）
          const firstCommitDate = commits.length > 0 ? commits[commits.length - 1].committedDate : defaultDate
          
          // 为每个图片文件分配时间
          for (const imageFile of imageFiles) {
            let bestDate = firstCommitDate // 默认使用第一次提交时间
            
            // 查找包含此文件名的提交
            for (const commit of commits) {
              if (commit.message && commit.message.includes(imageFile.name)) {
                const commitDate = commit.committedDate
                if (new Date(commitDate) > new Date(bestDate)) {
                  bestDate = commitDate
                }
              }
            }
            
            fileTimeMap.set(imageFile.name, bestDate)
          }
        } catch (graphqlError) {
          console.warn('GraphQL failed, falling back to individual file queries:', graphqlError)
          
          // 方案2：降级到逐个文件查询（虽然慢但准确）
          // 首先获取仓库的第一次提交时间作为默认值
          let firstCommitDate = defaultDate
          try {
            const allCommits = await this.octokit.rest.repos.listCommits({
              owner,
              repo,
              per_page: 1,
            })
            
            if (allCommits.data.length > 0) {
              // 获取完整的提交历史来找到第一次提交
              const fullHistory = await this.octokit.rest.repos.listCommits({
                owner,
                repo,
                per_page: 1000, // 获取更多提交以找到第一次提交
              })
              
              if (fullHistory.data.length > 0) {
                // 最后一个提交是第一次提交
                const firstCommit = fullHistory.data[fullHistory.data.length - 1]
                firstCommitDate = firstCommit.commit.committer?.date || 
                                 firstCommit.commit.author?.date || 
                                 defaultDate
              }
            }
          } catch (historyError) {
            console.warn('Failed to get repository history:', historyError)
          }
          
          for (const imageFile of imageFiles) {
            try {
              const fileCommits = await this.octokit.rest.repos.listCommits({
                owner,
                repo,
                path: `${path}/${imageFile.name}`,
                per_page: 1,
              })
              
              if (fileCommits.data.length > 0) {
                const commit = fileCommits.data[0]
                const commitDate = commit.commit.committer?.date || 
                                 commit.commit.author?.date || 
                                 firstCommitDate
                fileTimeMap.set(imageFile.name, commitDate)
              } else {
                // 如果没有找到该文件的提交记录，使用第一次提交时间
                fileTimeMap.set(imageFile.name, firstCommitDate)
              }
            } catch (fileError) {
              console.warn(`Failed to get commit for ${imageFile.name}:`, fileError)
              // 如果获取失败，使用第一次提交时间
              fileTimeMap.set(imageFile.name, firstCommitDate)
            }
          }
        }
        
        // 构建最终结果
        for (const item of imageFiles) {
          const lastCommitDate = fileTimeMap.get(item.name) || defaultDate
          
          imageItems.push({
            sha: item.sha,
            name: item.name,
            downloadUrl: item.download_url,
            htmlUrl: item.html_url,
            size: item.size,
            width: 0, // 图片尺寸需要前端动态获取
            height: 0,
            tags: [],
            description: '',
            createdAt: lastCommitDate,
            updatedAt: lastCommitDate,
          })
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
import { ipcMain } from 'electron';

class GiteeService {
  public token: string | null = null;
  private baseUrl = 'https://gitee.com/api/v5';

  constructor() {}

  /**
   * 将 Gitee API 返回的 download_url 转换为 raw URL 格式
   * 避免使用 assets.gitee.com 导致的跨域问题
   * @param owner 仓库所有者
   * @param repo 仓库名
   * @param branch 分支名
   * @param path 文件路径（相对于仓库根目录）
   * @returns raw URL
   */
  public getRawUrl(
    owner: string,
    repo: string,
    branch: string,
    path: string
  ): string {
    // Gitee raw URL 格式: https://gitee.com/{owner}/{repo}/raw/{branch}/{path}
    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return `https://gitee.com/${owner}/${repo}/raw/${encodeURIComponent(branch)}/${encodedPath}`;
  }

  public isImageFile(fileName: string): boolean {
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
    ];
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  public async makeRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    if (!this.token) {
      throw new Error('Gitee 认证未设置');
    }

    // Gitee API v5 使用 access_token 作为查询参数
    // 注意：path 可能已经包含查询参数（如 ref=branch），需要正确处理
    let url: string;
    if (path.includes('?')) {
      // path 已经包含查询参数，使用 & 连接 access_token
      url = `${this.baseUrl}${path}&access_token=${encodeURIComponent(this.token)}`;
    } else if (path.includes('&')) {
      // path 包含 & 但没有 ?，说明可能是 getFileSha 传入的格式
      url = `${this.baseUrl}${path}&access_token=${encodeURIComponent(this.token)}`;
    } else {
      // path 没有查询参数，使用 ? 连接 access_token
      url = `${this.baseUrl}${path}?access_token=${encodeURIComponent(this.token)}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      // 对于 POST/PUT/DELETE 请求，access_token 已经在 URL 中，不需要在 body 中重复
      // 但如果 body 中有 access_token，需要移除它
      const { access_token, ...bodyWithoutToken } = body;
      options.body = JSON.stringify(bodyWithoutToken);
    }

    console.log('fetch url', url);
    console.log('fetch options', options);

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gitee API 错误: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // 处理空响应
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  }

  public async getFileSha(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<string | null> {
    try {
      const pathWithRef = `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
      const response = await this.makeRequest('GET', pathWithRef);

      // Gitee API 返回的数据结构：
      // 单个文件时返回对象，包含 sha 字段
      // 目录时返回数组
      if (!response || Array.isArray(response)) {
        return null;
      }

      return response.sha || null;
    } catch (error: any) {
      // 文件不存在时返回 null，不抛出错误
      if (error.message.includes('404') || error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  }
}

const giteeService = new GiteeService();

export function registerGiteeHandlers() {
  // 设置 Gitee 认证
  ipcMain.handle('gitee:setAuth', async (event, token: string) => {
    try {
      giteeService.token = token;
      return { success: true };
    } catch (error) {
      console.error('Failed to set Gitee auth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // 上传图片
  ipcMain.handle('gitee:upload', async (event, params: any) => {
    try {
      const {
        owner,
        repo,
        path,
        branch,
        fileName,
        content,
        description,
        tags,
        size,
        width,
        height,
        type,
      } = params;
      const filePath = `${path}/${fileName}`;

      // 首先检查文件是否已存在
      const existingSha = await giteeService.getFileSha(
        owner,
        repo,
        filePath,
        branch
      );

      const requestBody: any = {
        message: existingSha
          ? `Update image: ${fileName}`
          : `Add image: ${fileName}`,
        content,
        branch,
      };

      if (existingSha) {
        requestBody.sha = existingSha;
      }

      const response = await giteeService.makeRequest(
        'POST',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
        requestBody
      );

      // 使用 raw URL 替代 API 返回的 download_url，避免跨域问题
      const rawUrl = giteeService.getRawUrl(owner, repo, branch, filePath);

      const imageSha = response.content?.sha;

      // 构建元数据对象
      const metadata = {
        id:
          imageSha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        description: description || '',
        tags: tags || [],
        size: size || 0,
        width: width || 0,
        height: height || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 同时上传元数据文件
      try {
        const getMetadataFileName = (fileName: string): string => {
          const nameWithoutExt = fileName.substring(
            0,
            fileName.lastIndexOf('.')
          );
          const extension = fileName.substring(fileName.lastIndexOf('.'));
          return `${nameWithoutExt}.metadata${extension}.json`;
        };
        const metadataFileName = getMetadataFileName(fileName);
        const metadataPath = `${path}/.metadata/${metadataFileName}`;
        const metadataContent = JSON.stringify(metadata, null, 2);

        // 检查元数据文件是否已存在
        const metadataSha = await giteeService.getFileSha(
          owner,
          repo,
          metadataPath,
          branch
        );

        const metadataRequestBody: any = {
          message: metadataSha
            ? `Update metadata for: ${fileName}`
            : `Create metadata for: ${fileName}`,
          content: Buffer.from(metadataContent).toString('base64'),
          branch,
        };

        if (metadataSha) {
          metadataRequestBody.sha = metadataSha;
        }

        // 根据文件是否存在选择使用 POST 或 PUT 方法
        if (metadataSha) {
          await giteeService.makeRequest(
            'PUT',
            `/repos/${owner}/${repo}/contents/${encodeURIComponent(metadataPath)}`,
            metadataRequestBody
          );
        } else {
          await giteeService.makeRequest(
            'POST',
            `/repos/${owner}/${repo}/contents/${encodeURIComponent(metadataPath)}`,
            metadataRequestBody
          );
        }
      } catch (metadataError) {
        // 元数据上传失败时，记录警告但不影响图片上传的成功
        console.warn(
          'Image file uploaded successfully, but metadata upload failed:',
          metadataError
        );
      }

      return {
        sha: imageSha,
        downloadUrl: rawUrl,
        htmlUrl: response.content?.html_url,
      };
    } catch (error) {
      console.error('Gitee upload failed:', error);
      throw error;
    }
  });

  // 删除图片
  ipcMain.handle('gitee:delete', async (event, params: any) => {
    try {
      const { owner, repo, path, branch, fileName } = params;
      const filePath = `${path}/${fileName}`;

      // 获取文件的当前 SHA
      const sha = await giteeService.getFileSha(owner, repo, filePath, branch);
      if (!sha) {
        throw new Error('文件不存在');
      }

      await giteeService.makeRequest(
        'DELETE',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
        {
          message: `Delete image: ${fileName}`,
          sha,
          branch,
        }
      );
    } catch (error) {
      console.error('Gitee delete failed:', error);
      throw error;
    }
  });

  // 获取图片列表
  ipcMain.handle('gitee:getList', async (event, params: any) => {
    try {
      const { owner, repo, path, branch } = params;

      const response = await giteeService.makeRequest(
        'GET',
        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
      );

      if (!Array.isArray(response)) {
        return [];
      }

      // 筛选出图片文件
      const imageFiles = response.filter((item: any) =>
        giteeService.isImageFile(item.name)
      );

      if (imageFiles.length === 0) {
        return [];
      }

      // 批量获取 metadata 文件
      const metadataMap = new Map<string, any>();

      try {
        const metadataResponse = await giteeService.makeRequest(
          'GET',
          `/repos/${owner}/${repo}/contents/${encodeURIComponent(path + '/.metadata')}?ref=${branch}`
        );

        if (Array.isArray(metadataResponse)) {
          const metadataPromises = metadataResponse
            .filter((file: any) => file.name.endsWith('.json'))
            .map(async (file: any) => {
              try {
                const fileResponse = await giteeService.makeRequest(
                  'GET',
                  `/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}?ref=${branch}`
                );

                if (fileResponse.content) {
                  const content = Buffer.from(
                    fileResponse.content,
                    'base64'
                  ).toString('utf8');
                  const metadata = JSON.parse(content);
                  let imageName = file.name;
                  if (file.name.includes('.metadata.')) {
                    imageName = file.name.replace(
                      /\.metadata\.([^.]+)\.json$/,
                      '.$1'
                    );
                  } else {
                    imageName = file.name.replace('.json', '');
                  }
                  metadataMap.set(imageName, metadata);
                  if (file.name !== imageName) {
                    metadataMap.set(file.name, metadata);
                  }
                }
              } catch (error) {
                // 忽略单个 metadata 文件加载失败
              }
            });

          await Promise.all(metadataPromises);
        }
      } catch (metadataError) {
        // .metadata 目录不存在或无法访问，使用默认值
      }

      // 构建最终结果
      const imageItems = [];
      const defaultDate = new Date().toISOString();

      for (const item of imageFiles) {
        const metadataKey = item.name.replace(/\.metadata\.[^.]+\.json$/, '');
        const parsedMetadata =
          metadataMap.get(metadataKey) || metadataMap.get(item.name);
        const metadata = parsedMetadata
          ? {
              size: parsedMetadata.size || item.size || 0,
              width: parsedMetadata.width || 0,
              height: parsedMetadata.height || 0,
              tags: Array.isArray(parsedMetadata.tags)
                ? parsedMetadata.tags
                : [],
              description: parsedMetadata.description || '',
              updatedAt: parsedMetadata.updatedAt || defaultDate,
            }
          : {
              size: item.size || 0,
              width: 0,
              height: 0,
              tags: [] as string[],
              description: '',
              updatedAt: defaultDate,
            };

        // 使用 raw URL 替代 API 返回的 download_url，避免跨域问题
        const filePath = `${path}/${item.name}`;
        const rawUrl = giteeService.getRawUrl(owner, repo, branch, filePath);

        imageItems.push({
          sha: item.sha,
          name: item.name,
          downloadUrl: rawUrl,
          htmlUrl: item.html_url,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
          tags: metadata.tags,
          description: metadata.description,
          createdAt: defaultDate,
          updatedAt: metadata.updatedAt,
        });
      }

      return imageItems;
    } catch (error) {
      console.error('Gitee get list failed:', error);
      throw error;
    }
  });

  // 获取图片数据（用于在 Electron 中解决跨域问题）
  ipcMain.handle('gitee:getImageData', async (event, params: any) => {
    try {
      const { url } = params;
      if (!url) {
        throw new Error('URL 参数缺失');
      }

      // 在主进程中获取图片数据，避免跨域问题
      const response = await fetch(url, {
        headers: {
          Referer: 'https://gitee.com/',
          Origin: 'https://gitee.com',
        },
      });

      if (!response.ok) {
        throw new Error(
          `获取图片失败: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        data: `data:${contentType};base64,${base64}`,
        contentType,
      };
    } catch (error) {
      console.error('Gitee get image data failed:', error);
      throw error;
    }
  });

  // 更新元数据
  ipcMain.handle('gitee:updateMetadata', async (event, params: any) => {
    try {
      const { owner, repo, path, branch, metadata, fileName } = params;

      // 创建或更新元数据文件
      const getMetadataFileName = (fileName: string): string => {
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        return `${nameWithoutExt}.metadata${extension}.json`;
      };
      const targetFileName = fileName || metadata.name;
      const metadataFileName = getMetadataFileName(targetFileName);
      const metadataPath = `${path}/.metadata/${metadataFileName}`;
      const metadataContent = JSON.stringify(metadata, null, 2);

      // 获取文件的当前 SHA（如果文件存在）
      const fileSha = await giteeService.getFileSha(
        owner,
        repo,
        metadataPath,
        branch
      );

      // 构建请求参数
      const requestBody: any = {
        message: fileSha
          ? `Update metadata for: ${metadata.name}`
          : `Create metadata for: ${metadata.name}`,
        content: Buffer.from(metadataContent).toString('base64'),
        branch,
      };

      // 根据文件是否存在选择使用 POST 或 PUT 方法
      // POST: 创建新文件（如果文件已存在且没有 SHA，会报错）
      // PUT: 更新已存在的文件（必须提供 SHA）
      if (fileSha) {
        // 文件存在，使用 PUT 方法更新，必须提供 SHA
        requestBody.sha = fileSha;
        await giteeService.makeRequest(
          'PUT',
          `/repos/${owner}/${repo}/contents/${encodeURIComponent(metadataPath)}`,
          requestBody
        );
      } else {
        // 文件不存在，使用 POST 方法创建
        await giteeService.makeRequest(
          'POST',
          `/repos/${owner}/${repo}/contents/${encodeURIComponent(metadataPath)}`,
          requestBody
        );
      }
    } catch (error) {
      console.error('Gitee update metadata failed:', error);
      throw error;
    }
  });
}

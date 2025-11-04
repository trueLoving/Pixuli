import { ImageItem, GitHubConfig, ImageUploadData } from 'pixuli-ui/src';
import { Octokit } from 'octokit';
import { getImageInfoFromUri } from '../utils/imageUtils';

export class GitHubStorageService {
  private config: GitHubConfig;
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({ auth: config.token });
  }

  /**
   * 将文件 URI 转换为 base64
   */
  private async uriToBase64(uri: string): Promise<string> {
    try {
      // 使用 fetch 获取文件并转换为 base64
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert URI to base64:', error);
      throw new Error('文件读取失败');
    }
  }

  /**
   * 获取图片信息
   */
  private async getImageInfo(uri: string) {
    try {
      return await getImageInfoFromUri(uri);
    } catch (error) {
      console.warn('获取图片信息失败，使用默认值:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * 检查是否为图片文件
   */
  private isImageFile(fileName: string): boolean {
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

  /**
   * 获取 MIME 类型
   */
  private getMimeType(fileName: string): string {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[extension] || 'image/unknown';
  }

  /**
   * 上传图片到 GitHub
   */
  async uploadImage(uploadData: {
    uri: string;
    name?: string;
    description?: string;
    tags?: string[];
  }): Promise<ImageItem> {
    try {
      const { uri, name, description, tags } = uploadData;
      // 从 URI 中提取文件名
      const fileName = name || uri.split('/').pop() || 'image.jpg';
      const filePath = `${this.config.path}/${fileName}`;

      // 将文件转换为 base64
      const base64Content = await this.uriToBase64(uri);

      // 检查文件是否已存在
      let existingSha: string | null = null;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
          ref: this.config.branch,
        });

        if (!Array.isArray(existingFile.data) && 'sha' in existingFile.data) {
          existingSha = existingFile.data.sha;
        }
      } catch (error: any) {
        // 如果文件不存在，existingSha 保持为 null
        if (error.status !== 404) {
          console.warn('Error checking existing file:', error.message);
        }
      }

      // 上传文件
      const response = await this.octokit.rest.repos.createOrUpdateFileContents(
        {
          owner: this.config.owner,
          repo: this.config.repo,
          path: filePath,
          message: existingSha
            ? `Update image: ${fileName}`
            : `Add image: ${fileName}`,
          content: base64Content,
          branch: this.config.branch,
          ...(existingSha && { sha: existingSha }),
        }
      );

      // 获取图片信息
      const imageInfo = await this.getImageInfo(uri);
      // 尝试获取文件大小（如果无法获取，使用 0）
      let fileSize = 0;
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          fileSize = parseInt(contentLength, 10);
        }
      } catch {
        // 忽略错误，使用默认值 0
      }

      const imageItem: ImageItem = {
        id:
          response.data.content?.sha ||
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        url: response.data.content?.download_url || '',
        githubUrl: response.data.content?.html_url || '',
        size: fileSize,
        width: imageInfo.width,
        height: imageInfo.height,
        type: this.getMimeType(fileName),
        tags: tags || [],
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return imageItem;
    } catch (error) {
      console.error('Upload image failed:', error);
      throw new Error(
        `上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(imageId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`;

      // 获取文件 SHA
      const file = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        ref: this.config.branch,
      });

      if (Array.isArray(file.data)) {
        throw new Error('Path is a directory');
      }

      // 删除文件
      await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path: filePath,
        message: `Delete image: ${fileName}`,
        sha: file.data.sha,
        branch: this.config.branch,
      });
    } catch (error) {
      console.error('Delete image failed:', error);
      throw new Error(
        `删除图片失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 获取图片列表
   */
  async getImageList(): Promise<ImageItem[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        ref: this.config.branch,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      // 筛选出图片文件
      const imageFiles = response.data.filter(item =>
        this.isImageFile(item.name)
      );

      if (imageFiles.length === 0) {
        return [];
      }

      // 转换为 ImageItem 格式
      const images: ImageItem[] = imageFiles.map(item => ({
        id: item.sha,
        name: item.name,
        url: item.download_url || '',
        githubUrl: item.html_url || '',
        size: item.size || 0,
        width: 0, // GitHub API 不直接提供图片尺寸
        height: 0,
        type: this.getMimeType(item.name),
        tags: [],
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return images;
    } catch (error) {
      console.error('Get image list failed:', error);
      throw new Error(
        `获取图片列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 更新图片信息
   */
  async updateImageInfo(
    imageId: string,
    fileName: string,
    metadata: {
      name?: string;
      description?: string;
      tags?: string[];
      updatedAt: string;
    },
    oldFileName?: string
  ): Promise<void> {
    try {
      const filePath = `${this.config.path}/${fileName}`;
      const oldFilePath = oldFileName
        ? `${this.config.path}/${oldFileName}`
        : filePath;

      // 如果文件名改变，需要重命名文件
      if (oldFileName && oldFileName !== fileName) {
        // 获取旧文件内容
        const oldFile = await this.octokit.rest.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: oldFilePath,
          ref: this.config.branch,
        });

        if (Array.isArray(oldFile.data)) {
          throw new Error('Path is a directory');
        }

        // 创建新文件
        if (
          oldFile.data.type === 'file' &&
          'content' in oldFile.data &&
          'encoding' in oldFile.data
        ) {
          await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.config.owner,
            repo: this.config.repo,
            path: filePath,
            message: `Rename image: ${oldFileName} -> ${fileName}`,
            content: oldFile.data.content || '',
            branch: this.config.branch,
            encoding: oldFile.data.encoding as 'base64' | 'utf8',
          });
        }

        // 删除旧文件
        await this.octokit.rest.repos.deleteFile({
          owner: this.config.owner,
          repo: this.config.repo,
          path: oldFilePath,
          message: `Delete old image: ${oldFileName}`,
          sha: oldFile.data.sha,
          branch: this.config.branch,
        });
      }

      // 注意：GitHub API 不支持直接更新文件的元数据（如描述、标签）
      // 这些信息通常需要存储在单独的元数据文件中
      // 这里我们只处理文件重命名
    } catch (error) {
      console.error('Update image info failed:', error);
      throw new Error(
        `更新图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}

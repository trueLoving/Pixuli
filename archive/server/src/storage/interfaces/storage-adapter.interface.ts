/**
 * 存储适配器接口
 * 定义统一的存储操作接口，支持多种存储后端
 */
export interface StorageAdapter {
  /**
   * 上传文件
   * @param file 文件 Buffer
   * @param key 文件唯一标识（路径）
   * @returns 文件访问路径或 URL
   */
  upload(file: Buffer, key: string): Promise<string>;

  /**
   * 下载文件
   * @param key 文件唯一标识
   * @returns 文件 Buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * 删除文件
   * @param key 文件唯一标识
   */
  delete(key: string): Promise<void>;

  /**
   * 检查文件是否存在
   * @param key 文件唯一标识
   * @returns 是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取文件访问 URL
   * @param key 文件唯一标识
   * @returns 访问 URL
   */
  getUrl(key: string): Promise<string>;

  /**
   * 获取预签名 URL（用于直接访问，减轻服务器压力）
   * @param key 文件唯一标识
   * @param expiresIn 过期时间（秒），默认 1 小时
   * @returns 预签名 URL
   */
  getPresignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

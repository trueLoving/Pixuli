import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageItem } from 'pixuli-ui/src';

const METADATA_CACHE_KEY_PREFIX = 'pixuli-metadata-cache';
const METADATA_CACHE_VERSION = '1.0';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时过期
const CACHE_ITEM_EXPIRY_MS = 60 * 60 * 1000; // 单个缓存项1小时过期

/**
 * 生成缓存键（包含仓库源信息，避免不同源的数据混淆）
 */
function getCacheKey(storageType: string, owner: string, repo: string): string {
  return `${METADATA_CACHE_KEY_PREFIX}-${storageType}-${owner}-${repo}`;
}

interface CachedMetadata {
  version: string;
  timestamp: number;
  metadata: Record<string, ImageMetadata>;
}

interface ImageMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  size: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  etag?: string; // 用于检测变更（GitHub SHA）
  cacheTimestamp?: number; // 缓存时间戳
  checksum?: string; // 数据校验和
}

/**
 * Metadata 缓存工具类
 */
export class MetadataCache {
  private static cacheMap: Map<string, CachedMetadata> = new Map();
  private static cachePromiseMap: Map<string, Promise<CachedMetadata | null>> =
    new Map();
  private static currentCacheKey: string | null = null;

  /**
   * 设置当前使用的缓存键（根据仓库源）
   */
  static setCurrentCacheKey(
    storageType: string,
    owner: string,
    repo: string
  ): void {
    this.currentCacheKey = getCacheKey(storageType, owner, repo);
  }

  /**
   * 获取当前缓存键
   */
  private static getCurrentCacheKey(): string {
    if (!this.currentCacheKey) {
      throw new Error('Cache key not set. Call setCurrentCacheKey first.');
    }
    return this.currentCacheKey;
  }

  /**
   * 加载缓存
   */
  static async loadCache(
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<CachedMetadata | null> {
    const cacheKey =
      storageType && owner && repo
        ? getCacheKey(storageType, owner, repo)
        : this.getCurrentCacheKey();

    if (this.cacheMap.has(cacheKey)) {
      return this.cacheMap.get(cacheKey) || null;
    }

    if (this.cachePromiseMap.has(cacheKey)) {
      return this.cachePromiseMap.get(cacheKey) || null;
    }

    const promise = (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (!cached) {
          return null;
        }

        const parsed: CachedMetadata = JSON.parse(cached);

        // 检查版本和过期时间
        if (
          parsed.version !== METADATA_CACHE_VERSION ||
          Date.now() - parsed.timestamp > CACHE_EXPIRY_MS
        ) {
          // 缓存过期或版本不匹配，清除缓存
          await this.clearCache(cacheKey);
          return null;
        }

        this.cacheMap.set(cacheKey, parsed);
        return parsed;
      } catch (error) {
        console.error('Failed to load metadata cache:', error);
        return null;
      } finally {
        this.cachePromiseMap.delete(cacheKey);
      }
    })();

    this.cachePromiseMap.set(cacheKey, promise);
    return promise;
  }

  /**
   * 保存缓存
   */
  static async saveCache(
    metadata: Record<string, ImageMetadata>,
    cacheKey?: string
  ): Promise<void> {
    try {
      const key = cacheKey || this.getCurrentCacheKey();
      const cache: CachedMetadata = {
        version: METADATA_CACHE_VERSION,
        timestamp: Date.now(),
        metadata,
      };

      this.cacheMap.set(key, cache);
      await AsyncStorage.setItem(key, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save metadata cache:', error);
    }
  }

  /**
   * 验证单个 metadata 是否有效
   */
  static isValidMetadata(metadata: ImageMetadata | null): boolean {
    if (!metadata) {
      return false;
    }

    // 1. 检查必填字段
    if (
      !metadata.id ||
      !metadata.name ||
      !metadata.createdAt ||
      !metadata.updatedAt
    ) {
      return false;
    }

    // 2. 检查数据类型
    if (
      typeof metadata.size !== 'number' ||
      typeof metadata.width !== 'number' ||
      typeof metadata.height !== 'number' ||
      !Array.isArray(metadata.tags) ||
      typeof metadata.description !== 'string'
    ) {
      return false;
    }

    // 3. 检查时间戳格式
    try {
      new Date(metadata.createdAt);
      new Date(metadata.updatedAt);
    } catch {
      return false;
    }

    // 4. 检查缓存时间戳（如果存在）
    // 注意：即使过期，只要数据格式正确，仍然认为有效
    // 过期只是标记需要后台更新，但不阻止使用
    // 只有超过整体缓存过期时间（24小时）才认为无效
    if (metadata.cacheTimestamp) {
      const cacheAge = Date.now() - metadata.cacheTimestamp;
      // 超过24小时才认为无效（整体缓存过期）
      if (cacheAge > CACHE_EXPIRY_MS) {
        return false; // 整体缓存过期
      }
      // 超过1小时但未超过24小时，仍然有效，只是需要后台更新
    }

    // 5. 验证校验和（如果存在）
    if (metadata.checksum) {
      const calculatedChecksum = this.calculateChecksum(metadata);
      if (calculatedChecksum !== metadata.checksum) {
        return false; // 数据被篡改
      }
    }

    return true;
  }

  /**
   * 计算 metadata 的校验和
   */
  private static calculateChecksum(metadata: ImageMetadata): string {
    // 使用关键字段计算简单校验和
    const keyFields = [
      metadata.id,
      metadata.name,
      metadata.updatedAt,
      metadata.size?.toString() || '0',
      metadata.width?.toString() || '0',
      metadata.height?.toString() || '0',
    ].join('|');

    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < keyFields.length; i++) {
      const char = keyFields.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取单个图片的缓存 metadata（带验证）
   */
  static async getCachedMetadata(
    fileName: string,
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<ImageMetadata | null> {
    const cache = await this.loadCache(storageType, owner, repo);
    const metadata = cache?.metadata[fileName] || null;

    // 验证有效性
    if (!this.isValidMetadata(metadata)) {
      // 如果无效，从缓存中移除
      if (metadata) {
        await this.removeCachedMetadata(fileName, storageType, owner, repo);
      }
      return null;
    }

    return metadata;
  }

  /**
   * 批量获取缓存的 metadata（带验证）
   */
  static async getCachedMetadataBatch(
    fileNames: string[],
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<Map<string, ImageMetadata>> {
    const cache = await this.loadCache(storageType, owner, repo);
    const result = new Map<string, ImageMetadata>();
    const invalidFiles: string[] = [];

    if (!cache) {
      return result;
    }

    fileNames.forEach(fileName => {
      const metadata = cache.metadata[fileName];
      if (metadata && this.isValidMetadata(metadata)) {
        result.set(fileName, metadata);
      } else if (metadata) {
        // 标记为无效，稍后清理
        invalidFiles.push(fileName);
      }
    });

    // 异步清理无效缓存
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(fileName => {
        this.removeCachedMetadata(fileName, storageType, owner, repo).catch(
          () => {
            // 忽略清理错误
          }
        );
      });
    }

    return result;
  }

  /**
   * 更新单个 metadata 缓存（带校验和）
   */
  static async updateCachedMetadata(
    fileName: string,
    metadata: ImageMetadata,
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    // 添加缓存时间戳和校验和
    const metadataWithValidation: ImageMetadata = {
      ...metadata,
      cacheTimestamp: Date.now(),
      checksum: this.calculateChecksum(metadata),
    };

    const cache = await this.loadCache(storageType, owner, repo);
    const cacheKey =
      storageType && owner && repo
        ? getCacheKey(storageType, owner, repo)
        : this.getCurrentCacheKey();
    const updatedCache: CachedMetadata = cache || {
      version: METADATA_CACHE_VERSION,
      timestamp: Date.now(),
      metadata: {},
    };

    updatedCache.metadata[fileName] = metadataWithValidation;
    updatedCache.timestamp = Date.now();
    await this.saveCache(updatedCache.metadata, cacheKey);
  }

  /**
   * 批量更新 metadata 缓存（带校验和）
   */
  static async updateCachedMetadataBatch(
    metadataMap: Map<string, ImageMetadata>,
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const cache = await this.loadCache(storageType, owner, repo);
    const cacheKey =
      storageType && owner && repo
        ? getCacheKey(storageType, owner, repo)
        : this.getCurrentCacheKey();
    const updatedCache: CachedMetadata = cache || {
      version: METADATA_CACHE_VERSION,
      timestamp: Date.now(),
      metadata: {},
    };

    metadataMap.forEach((metadata, fileName) => {
      // 添加缓存时间戳和校验和
      updatedCache.metadata[fileName] = {
        ...metadata,
        cacheTimestamp: Date.now(),
        checksum: this.calculateChecksum(metadata),
      };
    });

    updatedCache.timestamp = Date.now();
    await this.saveCache(updatedCache.metadata, cacheKey);
  }

  /**
   * 删除单个 metadata 缓存
   */
  static async removeCachedMetadata(
    fileName: string,
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const cache = await this.loadCache(storageType, owner, repo);
    const cacheKey =
      storageType && owner && repo
        ? getCacheKey(storageType, owner, repo)
        : this.getCurrentCacheKey();
    if (!cache) {
      return;
    }

    delete cache.metadata[fileName];
    cache.timestamp = Date.now();
    await this.saveCache(cache.metadata, cacheKey);
  }

  /**
   * 清除指定缓存（如果未指定则清除当前缓存）
   */
  static async clearCache(cacheKey?: string): Promise<void> {
    try {
      const key = cacheKey || this.getCurrentCacheKey();
      this.cacheMap.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear metadata cache:', error);
    }
  }

  /**
   * 清除所有缓存（用于清理所有仓库源的缓存）
   */
  static async clearAllCaches(): Promise<void> {
    try {
      // 获取所有以 METADATA_CACHE_KEY_PREFIX 开头的键
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(METADATA_CACHE_KEY_PREFIX)
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      this.cacheMap.clear();
      this.cachePromiseMap.clear();
      this.currentCacheKey = null;
    } catch (error) {
      console.error('Failed to clear all metadata caches:', error);
    }
  }

  /**
   * 获取需要更新的文件列表（通过比较 etag、updatedAt 或缓存有效性）
   */
  static async getFilesToUpdate(
    fileNames: string[],
    remoteMetadata?: Map<string, ImageMetadata>,
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<string[]> {
    const cache = await this.loadCache(storageType, owner, repo);
    if (!cache) {
      return fileNames; // 没有缓存，全部需要更新
    }

    const filesToUpdate: string[] = [];

    fileNames.forEach(fileName => {
      const cached = cache.metadata[fileName];

      // 1. 缓存中没有
      if (!cached) {
        filesToUpdate.push(fileName);
        return;
      }

      // 2. 验证缓存有效性
      if (!this.isValidMetadata(cached)) {
        filesToUpdate.push(fileName);
        return;
      }

      // 3. 如果有远程数据，进行比较
      if (remoteMetadata) {
        const remote = remoteMetadata.get(fileName);
        if (remote) {
          // 比较 ETag（如果存在）
          if (cached.etag && remote.etag && cached.etag !== remote.etag) {
            filesToUpdate.push(fileName);
            return;
          }

          // 比较更新时间
          try {
            const cachedTime = new Date(cached.updatedAt).getTime();
            const remoteTime = new Date(remote.updatedAt).getTime();

            if (remoteTime > cachedTime) {
              // 远程更新了，需要更新
              filesToUpdate.push(fileName);
              return;
            }
          } catch {
            // 时间解析失败，需要更新
            filesToUpdate.push(fileName);
            return;
          }
        }
      }

      // 4. 检查缓存是否过期（超过1小时）
      // 注意：即使过期，如果数据有效，也会先使用缓存，后台更新
      if (cached.cacheTimestamp) {
        const cacheAge = Date.now() - cached.cacheTimestamp;
        // 只有超过过期时间才标记为需要更新（但不会阻止使用缓存）
        if (cacheAge > CACHE_ITEM_EXPIRY_MS) {
          filesToUpdate.push(fileName);
        }
        // 如果缓存未过期，不添加到更新列表（完全使用缓存）
      } else {
        // 没有缓存时间戳，需要更新
        filesToUpdate.push(fileName);
      }
    });

    return filesToUpdate;
  }

  /**
   * 验证缓存数据的完整性（用于调试和监控）
   */
  static async validateCacheIntegrity(
    storageType?: string,
    owner?: string,
    repo?: string
  ): Promise<{
    total: number;
    valid: number;
    invalid: number;
    expired: number;
    invalidFiles: string[];
  }> {
    const cache = await this.loadCache(storageType, owner, repo);
    if (!cache) {
      return {
        total: 0,
        valid: 0,
        invalid: 0,
        expired: 0,
        invalidFiles: [],
      };
    }

    const result = {
      total: Object.keys(cache.metadata).length,
      valid: 0,
      invalid: 0,
      expired: 0,
      invalidFiles: [] as string[],
    };

    Object.entries(cache.metadata).forEach(([fileName, metadata]) => {
      if (!this.isValidMetadata(metadata)) {
        result.invalid++;
        result.invalidFiles.push(fileName);
      } else if (metadata.cacheTimestamp) {
        const cacheAge = Date.now() - metadata.cacheTimestamp;
        if (cacheAge > CACHE_ITEM_EXPIRY_MS) {
          result.expired++;
        } else {
          result.valid++;
        }
      } else {
        result.valid++;
      }
    });

    return result;
  }

  /**
   * 将 ImageItem 转换为 ImageMetadata
   */
  static imageItemToMetadata(image: ImageItem): ImageMetadata {
    return {
      id: image.id,
      name: image.name,
      description: image.description || '',
      tags: image.tags || [],
      size: image.size || 0,
      width: image.width || 0,
      height: image.height || 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  /**
   * 将 ImageMetadata 合并到 ImageItem
   */
  static mergeMetadataToImage(
    image: ImageItem,
    metadata: ImageMetadata
  ): ImageItem {
    return {
      ...image,
      id: metadata.id || image.id,
      name: metadata.name || image.name,
      description: metadata.description || image.description || '',
      tags: metadata.tags || image.tags || [],
      size: metadata.size || image.size || 0,
      width: metadata.width || image.width || 0,
      height: metadata.height || image.height || 0,
      createdAt: metadata.createdAt || image.createdAt,
      updatedAt: metadata.updatedAt || image.updatedAt,
    };
  }
}

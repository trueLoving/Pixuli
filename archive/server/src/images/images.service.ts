import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { LocalStorageAdapter } from '../storage/adapters/local-storage.adapter';
import { ImageMetadata } from './interfaces/image.interface';
import { Prisma } from '@prisma/client';

type Image = Prisma.ImageGetPayload<{}>;

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly localStorageAdapter: LocalStorageAdapter,
  ) {}

  /**
   * 将 Prisma Image 转换为 ImageMetadata
   */
  private toImageMetadata(image: Image): ImageMetadata {
    const metadata = (image.metadata as Record<string, any>) || {};

    return {
      id: image.id,
      filename: image.filename,
      originalName: image.originalName,
      mimeType: image.mimeType,
      title: image.title ?? undefined,
      metadata: {
        size: metadata.size || 0,
        width: metadata.width,
        height: metadata.height,
        description: metadata.description,
        tags: metadata.tags || [],
        ...metadata, // 保留其他扩展字段
      },
      uploadDate: image.uploadDate,
      url: image.url,
      path: image.path,
    };
  }

  /**
   * 获取所有图片元数据
   */
  async findAll(): Promise<ImageMetadata[]> {
    const images = await this.prisma.image.findMany({
      orderBy: { uploadDate: 'desc' },
    });
    return images.map(img => this.toImageMetadata(img));
  }

  /**
   * 根据 ID 获取图片元数据
   */
  async findOne(id: string): Promise<ImageMetadata> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    return this.toImageMetadata(image);
  }

  /**
   * 上传单张图片
   */
  async uploadSingle(
    file: Express.Multer.File,
    dto?: {
      title?: string;
      description?: string;
      metadata?: Record<string, any>;
      tagNames?: string[];
    },
  ): Promise<ImageMetadata> {
    if (!file) {
      throw new BadRequestException('未提供图片文件');
    }

    // 验证文件类型
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('文件必须是图片格式');
    }

    const id = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${id}.${fileExtension}`;
    const storageKey = filename; // 存储键（用于对象存储）

    // 使用存储服务上传文件（支持多存储后端）
    await this.storageService.upload(file.buffer, storageKey);

    // 获取图片尺寸
    let width: number | undefined;
    let height: number | undefined;
    try {
      const imageMetadata = await sharp(file.buffer).metadata();
      width = imageMetadata.width;
      height = imageMetadata.height;
    } catch (error) {
      // 如果无法读取元数据，忽略错误
    }

    // 获取文件访问 URL
    const url = await this.storageService.getUrl(storageKey);

    // 构建 metadata 对象
    const metadata: Record<string, any> = {
      size: file.size,
      width,
      height,
      description: dto?.description,
      tags: dto?.tagNames || [],
      ...(dto?.metadata || {}), // 合并其他扩展元数据
    };

    // 创建图片记录
    const image = await this.prisma.image.create({
      data: {
        id,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        title: dto?.title || file.originalname,
        metadata,
        path: storageKey, // 存储键作为路径
        url, // 使用存储服务生成的 URL
      },
    });

    return this.toImageMetadata(image);
  }

  /**
   * 上传多张图片
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    dto?: {
      title?: string;
      description?: string;
      metadata?: Record<string, any>;
      tagNames?: string[];
    },
  ): Promise<ImageMetadata[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('未提供图片文件');
    }

    const results: ImageMetadata[] = [];
    for (const file of files) {
      const result = await this.uploadSingle(file, dto);
      results.push(result);
    }

    return results;
  }

  /**
   * 更新图片元数据
   */
  async updateMetadata(
    id: string,
    dto: {
      title?: string;
      description?: string;
      metadata?: Record<string, any>;
      tagNames?: string[];
    },
  ): Promise<ImageMetadata> {
    // 检查图片是否存在
    const existing = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    // 获取现有 metadata
    const existingMetadata = (existing.metadata as Record<string, any>) || {};

    // 构建更新的 metadata
    const updatedMetadata: Record<string, any> = {
      ...existingMetadata,
      ...(dto.metadata || {}),
    };

    // 更新特定字段
    if (dto.description !== undefined) {
      updatedMetadata.description = dto.description;
    }

    if (dto.tagNames !== undefined) {
      updatedMetadata.tags = dto.tagNames;
    }

    // 更新记录
    const image = await this.prisma.image.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : existing.title,
        metadata: updatedMetadata,
      },
    });

    return this.toImageMetadata(image);
  }

  /**
   * 删除图片
   */
  async delete(id: string): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    // 使用存储服务删除文件（从所有启用的存储删除）
    await this.storageService.delete(image.path);

    // 删除数据库记录
    await this.prisma.image.delete({
      where: { id },
    });
  }

  /**
   * 获取图片文件路径（用于直接文件访问）
   */
  async getImagePath(id: string): Promise<string> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    // 如果是本地存储，返回文件路径
    const localAdapter = this.storageService.getLocalStorageAdapter();
    if (localAdapter) {
      const filePath = localAdapter.getFilePath(image.path);
      const exists = await this.storageService.exists(image.path);
      if (!exists) {
        throw new NotFoundException(`图片文件不存在: ${image.path}`);
      }
      return filePath;
    }

    // 如果是对象存储，需要下载到临时文件（不推荐，应该使用预签名 URL）
    // 这里暂时抛出异常，建议使用预签名 URL 直接访问
    throw new NotFoundException(
      '当前存储后端不支持直接文件路径访问，请使用 URL 访问',
    );
  }

  /**
   * 获取图片文件 Buffer（用于流式传输）
   */
  async getImageBuffer(id: string): Promise<Buffer> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    // 使用存储服务下载文件
    return this.storageService.download(image.path);
  }

  /**
   * 获取预签名 URL（用于直接访问，减轻服务器压力）
   */
  async getPresignedUrl(
    id: string,
    expiresIn?: number,
  ): Promise<string | null> {
    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`图片 ID ${id} 不存在`);
    }

    return this.storageService.getPresignedUrl(image.path, expiresIn);
  }

  /**
   * 根据标签获取图片列表
   */
  async findByTag(tagName: string): Promise<ImageMetadata[]> {
    // 获取所有图片，然后在内存中过滤（MySQL JSON 查询较复杂）
    const allImages = await this.prisma.image.findMany({
      orderBy: { uploadDate: 'desc' },
    });

    // 过滤包含指定标签的图片
    const filteredImages = allImages.filter(image => {
      const metadata = (image.metadata as Record<string, any>) || {};
      const tags = metadata.tags || [];
      return Array.isArray(tags) && tags.includes(tagName);
    });

    return filteredImages.map(img => this.toImageMetadata(img));
  }
}

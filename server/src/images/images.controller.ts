import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Res,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UpdateImageMetadataDto } from './dto/update-image-metadata.dto';
import { ImageMetadata } from './interfaces/image.interface';

@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /**
   * 上传单张图片
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ): Promise<ImageMetadata> {
    return this.imagesService.uploadSingle(file, dto);
  }

  /**
   * 上传多张图片
   */
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadImageDto,
  ): Promise<ImageMetadata[]> {
    return this.imagesService.uploadMultiple(files, dto);
  }

  /**
   * 获取所有图片列表
   */
  @Get()
  async findAll(): Promise<ImageMetadata[]> {
    return this.imagesService.findAll();
  }

  /**
   * 获取单张图片的元数据
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageMetadata> {
    return this.imagesService.findOne(id);
  }

  /**
   * 获取图片文件（在线访问链接）
   */
  @Get(':id/file')
  async getImageFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // 尝试获取文件路径（本地存储）
      const filePath = await this.imagesService.getImagePath(id);
      res.sendFile(filePath);
    } catch (error) {
      // 如果无法获取文件路径，使用 Buffer 流式传输
      const buffer = await this.imagesService.getImageBuffer(id);
      const image = await this.imagesService.findOne(id);
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${image.originalName}"`,
      );
      res.send(buffer);
    }
  }

  /**
   * 获取预签名 URL（用于直接访问，减轻服务器压力）
   */
  @Get(':id/presigned-url')
  async getPresignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<{ url: string | null; expiresIn?: number }> {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn, 10) : undefined;
    const url = await this.imagesService.getPresignedUrl(id, expiresInSeconds);
    return {
      url,
      expiresIn: expiresInSeconds || 3600,
    };
  }

  /**
   * 更新图片元数据
   */
  @Put(':id/metadata')
  async updateMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImageMetadataDto,
  ): Promise<ImageMetadata> {
    return this.imagesService.updateMetadata(id, dto);
  }

  /**
   * 删除图片
   */
  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.imagesService.delete(id);
    return { message: '图片删除成功' };
  }

  /**
   * 根据标签获取图片列表
   */
  @Get('tags/:tagName')
  async findByTag(@Param('tagName') tagName: string): Promise<ImageMetadata[]> {
    return this.imagesService.findByTag(tagName);
  }
}

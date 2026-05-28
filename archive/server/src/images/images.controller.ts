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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { UpdateImageMetadataDto } from './dto/update-image-metadata.dto';
import { ImageMetadata } from './interfaces/image.interface';
import {
  ImageMetadataResponseDto,
  PresignedUrlResponseDto,
  DeleteImageResponseDto,
} from './dto/image-metadata-response.dto';

@ApiTags('images')
@ApiSecurity('api-key')
@ApiSecurity('bearer')
@Controller('api/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  /**
   * 上传单张图片
   */
  @Post('upload')
  @ApiOperation({
    summary: 'Upload a single image',
    description: 'Upload a single image file with optional metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        title: {
          type: 'string',
          description: 'Image title',
          example: 'My Image',
        },
        description: {
          type: 'string',
          description: 'Image description',
          example: 'This is a beautiful image',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
          example: { author: 'John Doe', location: 'New York' },
        },
        tagNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names',
          example: ['nature', 'landscape'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: ImageMetadataResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
  @ApiOperation({
    summary: 'Upload multiple images',
    description:
      'Upload multiple image files (up to 10) with optional metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to upload (up to 10)',
        },
        title: {
          type: 'string',
          description: 'Image title (applied to all images)',
          example: 'My Images',
        },
        description: {
          type: 'string',
          description: 'Image description (applied to all images)',
          example: 'Batch uploaded images',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (applied to all images)',
          example: { author: 'John Doe' },
        },
        tagNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names (applied to all images)',
          example: ['batch', 'upload'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: [ImageMetadataResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
  @ApiOperation({
    summary: 'Get all images',
    description: 'Retrieve a list of all uploaded images with their metadata',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all images',
    type: [ImageMetadataResponseDto],
  })
  async findAll(): Promise<ImageMetadata[]> {
    return this.imagesService.findAll();
  }

  /**
   * 获取单张图片的元数据
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get image metadata by ID',
    description:
      'Retrieve metadata for a specific image by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Image metadata',
    type: ImageMetadataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageMetadata> {
    return this.imagesService.findOne(id);
  }

  /**
   * 获取图片文件（在线访问链接）
   */
  @Get(':id/file')
  @ApiOperation({
    summary: 'Get image file',
    description: 'Retrieve the actual image file for viewing or downloading',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Image file',
    content: {
      'image/*': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
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
  @ApiOperation({
    summary: 'Get presigned URL',
    description:
      'Get a presigned URL for direct image access without server load',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'expiresIn',
    description: 'URL expiration time in seconds',
    required: false,
    example: '3600',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL',
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
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
  @ApiOperation({
    summary: 'Update image metadata',
    description: 'Update metadata for an existing image',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Image metadata updated successfully',
    type: ImageMetadataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
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
  @ApiOperation({
    summary: 'Delete image',
    description: 'Delete an image and its metadata',
  })
  @ApiParam({
    name: 'id',
    description: 'Image unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    type: DeleteImageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Image not found' })
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
  @ApiOperation({
    summary: 'Get images by tag',
    description: 'Retrieve all images that have a specific tag',
  })
  @ApiParam({
    name: 'tagName',
    description: 'Tag name to filter by',
    example: 'nature',
  })
  @ApiResponse({
    status: 200,
    description: 'List of images with the specified tag',
    type: [ImageMetadataResponseDto],
  })
  async findByTag(@Param('tagName') tagName: string): Promise<ImageMetadata[]> {
    return this.imagesService.findByTag(tagName);
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class ImageMetadataResponseDto {
  @ApiProperty({
    description: 'Image unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Stored filename',
    example: 'image-123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'my-image.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the image',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Image title',
    example: 'My Image',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description:
      'Image metadata including size, dimensions, description, tags, etc.',
    example: {
      size: 1024000,
      width: 1920,
      height: 1080,
      description: 'A beautiful landscape',
      tags: ['nature', 'landscape'],
    },
  })
  metadata: {
    size: number;
    width?: number;
    height?: number;
    description?: string;
    tags?: string[];
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Upload date',
    example: '2025-01-15T10:30:00.000Z',
  })
  uploadDate: Date;

  @ApiProperty({
    description: 'Image access URL',
    example:
      'https://example.com/images/image-123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Image storage path',
    example: '/images/image-123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  path: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for direct image access',
    example: 'https://example.com/images/image.jpg?signature=xxx',
    nullable: true,
  })
  url: string | null;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
    required: false,
  })
  expiresIn?: number;
}

export class DeleteImageResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: '图片删除成功',
  })
  message: string;
}

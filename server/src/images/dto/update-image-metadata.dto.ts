import { IsOptional, IsString, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateImageMetadataDto {
  @ApiProperty({
    description: 'Image title',
    example: 'Updated Image Title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Image description',
    example: 'Updated image description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Additional metadata as key-value pairs',
    example: { author: 'Jane Doe', location: 'San Francisco' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Array of tag names',
    example: ['updated', 'new-tag'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[]; // 标签名称数组
}

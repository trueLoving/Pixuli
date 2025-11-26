import { IsOptional, IsString, IsObject, IsArray } from 'class-validator';

export class UploadImageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[]; // 标签名称数组
}

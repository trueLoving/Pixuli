import type { ImageCompressionOptions } from '@pixuli/core/types';

export interface CompressionPreviewRecord {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  originalPreviewUrl?: string;
  compressedPreviewUrl?: string;
}

export type CompressionPreviewMap = Record<string, CompressionPreviewRecord>;

export const DEFAULT_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  maintainAspectRatio: true,
  outputFormat: 'image/jpeg',
};

import type { ImageItem } from '@pixuli/core/types';

export function sumListedFileSize(files: ImageItem[]): number {
  return files.reduce((sum, file) => sum + Math.max(0, file.size || 0), 0);
}

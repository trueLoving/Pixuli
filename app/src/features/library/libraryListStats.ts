import type { AssetItem } from '@pixuli/core/types';

export function sumListedFileSize(files: AssetItem[]): number {
  return files.reduce((sum, file) => sum + Math.max(0, file.size || 0), 0);
}

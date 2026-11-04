import type { ImageItem } from '@pixuli/core/types';
import { readAssetBytes } from '@/features/library/assetDownloadService';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { webImageProcessorService } from '@/features/tools/imageProcessor';
import { resolveImportTargetDir } from '@/features/workspace/workspaceLocalFs';
import { getWorkspaceVault } from '@/features/workspace/workspaceRuntime';
import {
  convertedFileName,
  croppedFileName,
  cropOutputMime,
  parentDirOfRelativePath,
  uniqueRelativePath,
  type ImageConvertRequest,
  type ImageCropRect,
} from './imageConvertTarget';
import type { OutputMimeType } from '@/features/tools/imageProcessor';

export interface ConvertLibraryImagesResult {
  saved: number;
  failed: string[];
}

function mimeForItem(item: ImageItem): string {
  if (item.type?.startsWith('image/')) return item.type;
  return 'image/jpeg';
}

async function saveBesideOriginal(
  item: ImageItem,
  file: File,
  fileName: string,
  mimeType: string,
  width: number,
  height: number,
  taken: Set<string>,
): Promise<void> {
  const vault = getWorkspaceVault();
  const dir = item.localPath
    ? parentDirOfRelativePath(item.localPath)
    : await resolveImportTargetDir();
  if (item.localPath) taken.add(item.localPath);
  const target = uniqueRelativePath(dir, fileName, taken);
  taken.add(target);
  const savedName = target.split('/').pop() ?? fileName;
  await vault.importFile(file, target, {
    name: savedName,
    mimeType,
    width,
    height,
    syncState: 'local-only',
  });
}

function cropFile(
  file: File,
  crop: ImageCropRect,
  mime: OutputMimeType,
): Promise<{ file: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = img.naturalWidth || img.width;
      const maxH = img.naturalHeight || img.height;
      const x = Math.max(
        0,
        Math.min(Math.round(crop.x), Math.max(0, maxW - 1)),
      );
      const y = Math.max(
        0,
        Math.min(Math.round(crop.y), Math.max(0, maxH - 1)),
      );
      const width = Math.max(1, Math.min(Math.round(crop.width), maxW - x));
      const height = Math.max(1, Math.min(Math.round(crop.height), maxH - y));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('无法创建 Canvas 上下文'));
        return;
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('裁剪失败'));
            return;
          }
          resolve({
            file: new File([blob], croppedFileName(file.name, mime), {
              type: mime,
            }),
            width,
            height,
          });
        },
        mime,
        mime === 'image/png' ? undefined : 0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };
    img.src = objectUrl;
  });
}

/**
 * 按像素选区裁出一张新图，写回原文件夹。只改本机，不加入同步队列。
 */
export async function cropLibraryImage(
  item: ImageItem,
  crop: ImageCropRect,
): Promise<{ saved: number }> {
  if (getAssetKind(item) !== 'image') {
    throw new Error('not an image');
  }
  const bytes = await readAssetBytes(item);
  const mime = cropOutputMime(item.name, item.type);
  const source = new File([bytes.slice()], item.name, {
    type: mimeForItem(item),
  });
  const result = await cropFile(source, crop, mime);
  const vault = getWorkspaceVault();
  const existing = await vault.list();
  const taken = new Set(existing.map(entry => entry.relativePath));
  await saveBesideOriginal(
    item,
    result.file,
    result.file.name,
    mime,
    result.width,
    result.height,
    taken,
  );
  return { saved: 1 };
}

/**
 * 把选中的图片转换成新文件，写回原文件夹。
 * 只改本机，不加入同步队列。单张失败不影响其余文件。
 */
export async function convertLibraryImages(
  items: ImageItem[],
  request: ImageConvertRequest,
): Promise<ConvertLibraryImagesResult> {
  const images = items.filter(item => getAssetKind(item) === 'image');
  const failed: string[] = [];
  if (images.length === 0) {
    return { saved: 0, failed };
  }

  const vault = getWorkspaceVault();
  const existing = await vault.list();
  const taken = new Set(existing.map(entry => entry.relativePath));
  let saved = 0;

  for (const item of images) {
    try {
      const bytes = await readAssetBytes(item);
      const source = new File([bytes.slice()], item.name, {
        type: mimeForItem(item),
      });
      const result = await webImageProcessorService.convert(
        source,
        request.format,
        {
          quality: request.quality,
          maxWidth: request.maxEdge,
          maxHeight: request.maxEdge,
          maintainAspectRatio: true,
          allowUpscale: false,
        },
      );
      const fileName = convertedFileName(item.name, request.format);
      await saveBesideOriginal(
        item,
        result.file,
        fileName,
        request.format,
        result.width,
        result.height,
        taken,
      );
      if (result.uri.startsWith('blob:')) URL.revokeObjectURL(result.uri);
      saved += 1;
    } catch {
      failed.push(item.name);
    }
  }

  return { saved, failed };
}

import type { ImageItem } from '@pixuli/core/types';
import { zipSync } from 'fflate';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

export function uniqueZipEntryName(name: string, used: Set<string>): string {
  const base = name.trim() || 'file';
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let index = 2;
  while (used.has(`${stem} (${index})${ext}`)) {
    index += 1;
  }
  const next = `${stem} (${index})${ext}`;
  used.add(next);
  return next;
}

export function buildZipDownloadFilename(count: number): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `pixuli-${count}-files-${stamp}.zip`;
}

async function readAssetBytes(item: ImageItem): Promise<Uint8Array> {
  if (item.localPath && isWorkspaceAvailable()) {
    return getWorkspaceAdapter().readFile(item.localPath);
  }

  const response = await fetch(item.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadAssetFile(item: ImageItem): void {
  const link = document.createElement('a');
  link.href = item.url;
  link.download = item.name;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadAssetsAsZip(
  items: ImageItem[],
  zipFilename?: string,
): Promise<{ packed: number; failed: number }> {
  if (items.length === 0) {
    return { packed: 0, failed: 0 };
  }

  if (items.length === 1) {
    downloadAssetFile(items[0]);
    return { packed: 1, failed: 0 };
  }

  const archive: Record<string, Uint8Array> = {};
  const usedNames = new Set<string>();
  let packed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const bytes = await readAssetBytes(item);
      const entryName = uniqueZipEntryName(item.name, usedNames);
      archive[entryName] = bytes;
      packed += 1;
    } catch {
      failed += 1;
    }
  }

  if (packed === 0) {
    throw new Error('zip pack failed');
  }

  const zipped = zipSync(archive);
  const blob = new Blob([zipped], { type: 'application/zip' });
  triggerBlobDownload(blob, zipFilename ?? buildZipDownloadFilename(packed));

  return { packed, failed };
}

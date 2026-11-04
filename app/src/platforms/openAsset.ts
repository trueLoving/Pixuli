import { Capacitor, registerPlugin } from '@capacitor/core';
import type { getPlatform } from './platform';

interface AndroidDownloadSaver {
  save(options: {
    name: string;
    data: string;
    mimeType: string;
  }): Promise<void>;
}

const androidDownloads =
  registerPlugin<AndroidDownloadSaver>('PixuliDownloads');

export type OpenAssetPlatform = ReturnType<typeof getPlatform>;

export interface OpenAssetTarget {
  name: string;
  /** blob: 或 http(s) 预览地址 */
  url: string;
  localPath?: string;
}

export type DownloadAssetAction =
  | { type: 'browser'; name: string; url: string }
  | { type: 'mobile'; name: string; url: string };

export function downloadAssetLabelKey(): string {
  return 'image.inspector.downloadFile';
}

function isHttpUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}

/**
 * 不直接打开文件，只下载，由用户自己打开。
 * - Web / Desktop：浏览器下载
 * - Mobile：Android 写入系统「下载」；iOS 写入本机文稿（WebView 的下载链接不可靠）
 */
export function resolveDownloadAssetAction(
  platform: OpenAssetPlatform,
  target: OpenAssetTarget,
): DownloadAssetAction | null {
  const url = target.url.trim();
  if (!url) return null;
  return {
    type: platform === 'mobile' ? 'mobile' : 'browser',
    name: target.name.trim() || 'file',
    url,
  };
}

export function isOpenCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /cancel|abort|dismiss/i.test(message);
}

export function downloadInBrowser(name: string, url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function sanitizeDownloadFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return cleaned || `file-${Date.now()}`;
}

function mimeFromName(name: string): string {
  const ext = name.includes('.')
    ? name.slice(name.lastIndexOf('.') + 1).toLowerCase()
    : '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'md' || ext === 'markdown') return 'text/markdown';
  if (ext === 'txt') return 'text/plain';
  if (ext === 'json') return 'application/json';
  return 'application/octet-stream';
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('read blob failed'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('invalid data url'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('read blob failed'));
    reader.readAsDataURL(blob);
  });
}

async function readDownloadBytes(
  url: string,
  localPath?: string,
): Promise<{ base64: string; mimeType: string }> {
  if (localPath) {
    const { getWorkspaceAdapter, isWorkspaceAvailable } = await import(
      './workspacePlatform'
    );
    if (isWorkspaceAvailable()) {
      const bytes = await getWorkspaceAdapter().readFile(localPath);
      return { base64: bytesToBase64(bytes), mimeType: '' };
    }
  }

  let bytesUrl = url;
  let revoke = false;
  if (isHttpUrl(url)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bytesUrl = URL.createObjectURL(await response.blob());
    revoke = true;
  }
  try {
    const response = await fetch(bytesUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return { base64: await blobToBase64(blob), mimeType: blob.type };
  } finally {
    if (revoke) URL.revokeObjectURL(bytesUrl);
  }
}

async function downloadOnMobile(
  name: string,
  url: string,
  localPath?: string,
): Promise<void> {
  const safeName = sanitizeDownloadFileName(name);
  const { base64, mimeType } = await readDownloadBytes(url, localPath);
  const resolvedMime = mimeType || mimeFromName(safeName);
  if (Capacitor.getPlatform() === 'android') {
    await androidDownloads.save({
      name: safeName,
      data: base64,
      mimeType: resolvedMime,
    });
    return;
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  await Filesystem.writeFile({
    path: safeName,
    data: base64,
    directory: Directory.Documents,
  });
}

export async function downloadAssetOnPlatform(
  platform: OpenAssetPlatform,
  target: OpenAssetTarget,
): Promise<'browser' | 'mobile'> {
  const action = resolveDownloadAssetAction(platform, target);
  if (!action) throw new Error('download unavailable');

  if (action.type === 'mobile') {
    await downloadOnMobile(action.name, action.url, target.localPath);
    return 'mobile';
  }

  let href = action.url;
  let revoke = false;
  if (isHttpUrl(action.url)) {
    const response = await fetch(action.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    href = URL.createObjectURL(await response.blob());
    revoke = true;
  }
  try {
    downloadInBrowser(action.name, href);
  } finally {
    if (revoke) window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return 'browser';
}

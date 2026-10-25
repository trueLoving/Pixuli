import type { getPlatform } from './platform';

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
 * - Mobile：写入本机文件目录（WebView 的下载链接不可靠）
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

async function downloadOnMobile(name: string, url: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
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
    const base64 = await blobToBase64(await response.blob());
    const safeName = name.replace(/[/\\]/g, '_') || `file-${Date.now()}`;
    await Filesystem.writeFile({
      path: safeName,
      data: base64,
      directory: Directory.Documents,
    });
  } finally {
    if (revoke) URL.revokeObjectURL(bytesUrl);
  }
}

export async function downloadAssetOnPlatform(
  platform: OpenAssetPlatform,
  target: OpenAssetTarget,
): Promise<'browser' | 'mobile'> {
  const action = resolveDownloadAssetAction(platform, target);
  if (!action) throw new Error('download unavailable');

  if (action.type === 'mobile') {
    await downloadOnMobile(action.name, action.url);
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

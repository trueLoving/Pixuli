import { Capacitor, CapacitorHttp } from '@capacitor/core';

function fileFromBytes(
  bytes: Uint8Array,
  name: string,
  mimeType = 'application/zip',
): File {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new File([copy], name, { type: mimeType });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.includes(',')
    ? (base64.split(',').pop() ?? base64)
    : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function filenameFromHeaders(
  headers: Headers | Record<string, string>,
): string {
  const raw =
    headers instanceof Headers
      ? headers.get('Content-Disposition') || headers.get('content-disposition')
      : headers['Content-Disposition'] ||
        headers['content-disposition'] ||
        headers['Content-disposition'];
  const disp = raw || '';
  const match =
    /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disp) || null;
  return decodeURIComponent(
    (match && (match[1] || match[2])) || 'pixuli-transfer.zip',
  );
}

/**
 * 拉取转移包 zip。
 * 移动端走 CapacitorHttp（原生明文 HTTP / 绕过 https WebView 混合内容限制）。
 */
export async function fetchTransferZipAsFile(sourceUrl: string): Promise<File> {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({
      url: sourceUrl,
      connectTimeout: 20_000,
      readTimeout: 120_000,
      responseType: 'arraybuffer',
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`fetch failed: ${response.status}`);
    }
    let bytes: Uint8Array;
    if (typeof response.data === 'string') {
      bytes = base64ToUint8Array(response.data);
    } else if (response.data instanceof ArrayBuffer) {
      bytes = new Uint8Array(response.data);
    } else if (Array.isArray(response.data)) {
      bytes = Uint8Array.from(response.data as number[]);
    } else {
      throw new Error('fetch failed: unexpected body');
    }
    return fileFromBytes(bytes, filenameFromHeaders(response.headers || {}));
  }

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status}`);
  }
  const blob = await res.blob();
  return new File([blob], filenameFromHeaders(res.headers), {
    type: 'application/zip',
  });
}

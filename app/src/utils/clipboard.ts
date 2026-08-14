import { isNativeMobile } from './platform';

/**
 * 复制文本；Capacitor WebView 下 navigator.clipboard 常不可用（REF-607 P6 / #161）。
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (isNativeMobile()) {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through
    }
  }

  if (typeof document === 'undefined') {
    throw new Error('clipboard unavailable');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) {
    throw new Error('clipboard copy failed');
  }
}

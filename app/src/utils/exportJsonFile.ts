import { copyTextToClipboard } from './clipboard';
import { isNativeMobile } from './platform';

export type ExportJsonResult = 'file' | 'clipboard';

/**
 * 导出 JSON 配置：Web/Desktop 触发下载；Capacitor 复制到剪贴板（#165 J1-06）。
 */
export async function exportJsonFile(
  filename: string,
  content: string,
): Promise<ExportJsonResult> {
  if (isNativeMobile()) {
    await copyTextToClipboard(content);
    return 'clipboard';
  }

  if (typeof document === 'undefined') {
    throw new Error('export unavailable');
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return 'file';
}

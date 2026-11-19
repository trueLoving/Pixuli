import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { showError } from '@/ui/feedback/toast';
import { parseImportTransferDeepLink } from './importDeepLink';
import { useTransferImportStore } from './transferImportStore';

async function fetchTransferZipAsFile(sourceUrl: string): Promise<File> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status}`);
  }
  const blob = await res.blob();
  const disp = res.headers.get('Content-Disposition') || '';
  const match =
    /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disp) || null;
  const name = decodeURIComponent(
    (match && (match[1] || match[2])) || 'pixuli-transfer.zip',
  );
  return new File([blob], name, { type: 'application/zip' });
}

async function handleDeepLinkUrl(
  raw: string,
  onFetchError: () => void,
): Promise<void> {
  const parsed = parseImportTransferDeepLink(raw);
  if (!parsed) return;
  try {
    const file = await fetchTransferZipAsFile(parsed.sourceUrl);
    useTransferImportStore.getState().openImport({ file });
  } catch {
    // 回退：仍打开导入框，让用户手动选文件；同时把 URL 交给弹窗再试一次
    useTransferImportStore.getState().openImport({
      sourceUrl: parsed.sourceUrl,
    });
    onFetchError();
  }
}

/**
 * Desktop（protocol）+ Capacitor（appUrlOpen）接收
 * pixuli://import-transfer?src=…
 */
export function useTransferImportDeepLink(
  t: (key: string, params?: Record<string, string | number>) => string,
): void {
  useEffect(() => {
    let disposed = false;
    let lastUrl = '';
    const notifyFetchError = () => {
      showError(t('settings.lanShare.importDeepLinkFetchFailed'));
    };

    const onUrl = (url: string) => {
      if (disposed || !url || url === lastUrl) return;
      lastUrl = url;
      void handleDeepLinkUrl(url, notifyFetchError).catch(notifyFetchError);
    };

    const unsubElectron = window.pixuliDeepLink?.onOpen(onUrl);
    void window.pixuliDeepLink?.getPending().then(url => {
      if (url) onUrl(url);
    });

    let capHandle: { remove: () => Promise<void> } | undefined;
    if (Capacitor.isNativePlatform()) {
      void CapApp.addListener('appUrlOpen', ({ url }) => onUrl(url)).then(
        handle => {
          capHandle = handle;
        },
      );
      void CapApp.getLaunchUrl()
        .then(result => {
          if (result?.url) onUrl(result.url);
        })
        .catch(() => {
          // ignore
        });
    }

    return () => {
      disposed = true;
      unsubElectron?.();
      void capHandle?.remove();
    };
  }, [t]);
}

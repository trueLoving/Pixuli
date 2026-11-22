import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { showError } from '@/ui/feedback/toast';
import { fetchTransferZipAsFile } from './fetchTransferZip';
import { parseImportTransferDeepLink } from './importDeepLink';
import { useTransferImportStore } from './transferImportStore';

async function handleDeepLinkUrl(
  raw: string,
  onFetchError: () => void,
): Promise<void> {
  const parsed = parseImportTransferDeepLink(raw);
  if (!parsed) return;
  const openOpts = {
    strategy: parsed.strategy,
    targetFolder: parsed.targetFolder,
    librarySync: parsed.librarySync,
  };
  try {
    const file = await fetchTransferZipAsFile(parsed.sourceUrl);
    useTransferImportStore.getState().openImport({
      file,
      ...openOpts,
    });
  } catch {
    useTransferImportStore.getState().openImport({
      sourceUrl: parsed.sourceUrl,
      ...openOpts,
    });
    onFetchError();
  }
}

/**
 * Desktop（protocol）+ Capacitor（appUrlOpen）接收
 * pixuli://import-transfer?...
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

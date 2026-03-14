/**
 * Desktop 构建时使用：无 PWA 插件，virtual:pwa-register/react 被 alias 到此文件，
 * 提供 no-op 的 useRegisterSW，避免构建报错。
 */
import type { Dispatch, SetStateAction } from 'react';

export function useRegisterSW(_options?: {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: Error) => void;
}) {
  const needRefresh = false;
  const offlineReady = false;
  const updateServiceWorker = async () => {};
  const setNeedRefresh = (() => {}) as Dispatch<SetStateAction<boolean>>;
  const setOfflineReady = (() => {}) as Dispatch<SetStateAction<boolean>>;
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    setNeedRefresh,
    setOfflineReady,
  };
}

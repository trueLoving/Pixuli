/// <reference types="vite/client" />
/// <reference path="./types/service-worker.d.ts" />

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  export interface RegisterSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    setNeedRefresh: Dispatch<SetStateAction<boolean>>;
    setOfflineReady: Dispatch<SetStateAction<boolean>>;
  };
}

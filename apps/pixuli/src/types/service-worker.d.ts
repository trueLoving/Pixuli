// Service Worker 和 Workbox 类型定义
// 这些类型定义用于修复 workbox-core 的类型错误

// 在全局作用域中声明 ExtendableEvent
declare global {
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }

  // 确保 ServiceWorkerGlobalScope 也有 ExtendableEvent
  interface ServiceWorkerGlobalScope {
    addEventListener(
      type: 'install' | 'activate' | 'fetch' | 'message' | 'sync' | 'push',
      listener: (event: ExtendableEvent) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
  }
}

// Workbox 类型定义
declare module 'workbox-core' {
  export interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }
}

export {};

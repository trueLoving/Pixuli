import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './i18n';
import './index.css';
import { isWeb } from './utils/platform';

// Web 模式特有的初始化
if (isWeb()) {
  // 动态导入 Web 模式的服务（避免在 Desktop 模式下加载）
  Promise.all([
    import('./utils-web/loading').catch(() => null),
    import('./services-web/pwaService').catch(() => null),
    import('./services-web/performanceService').catch(() => null),
  ]).then(([loadingModule, pwaServiceModule, performanceServiceModule]) => {
    // 初始化加载动画
    if (loadingModule?.loading) {
      loadingModule.loading();
    }

    // 初始化性能监控
    if (performanceServiceModule?.performanceService) {
      performanceServiceModule.performanceService.init();
    }

    // 注册 Service Worker
    if ('serviceWorker' in navigator && pwaServiceModule?.pwaService) {
      pwaServiceModule.pwaService.registerServiceWorker().catch(error => {
        console.error('[PWA] Failed to register Service Worker:', error);
      });
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

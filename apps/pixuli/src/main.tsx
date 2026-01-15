import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import './i18n';
import './index.css';
import { isWeb } from './utils/platform';

// Web 模式特有的初始化
if (isWeb()) {
  // 动态导入 Web 模式的服务（避免在 Desktop 模式下加载）
  Promise.all([
    import('./platforms/web/utils/loading').catch(() => null),
    import('./platforms/web/services/pwaService').catch(() => null),
    import('./platforms/web/services/performanceService').catch(() => null),
  ]).then(([loadingModule, pwaServiceModule, performanceServiceModule]) => {
    // 初始化加载动画
    if (loadingModule?.loading) {
      loadingModule.loading();
    }

    // 初始化性能监控
    if (performanceServiceModule?.performanceService) {
      performanceServiceModule.performanceService.init();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

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
  Promise.all([import('./platforms/web/utils/loading').catch(() => null)]).then(
    ([loadingModule]) => {
      // 初始化加载动画
      if (loadingModule?.loading) {
        loadingModule.loading();
      }
    },
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';
import './i18n';
import { loading } from './utils/loading';
import { pwaService } from './services/pwaService';

// 初始化加载动画
loading();

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  pwaService.registerServiceWorker().catch(error => {
    console.error('[PWA] Failed to register Service Worker:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

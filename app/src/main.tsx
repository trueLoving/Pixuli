import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { bootstrapCapacitorNative } from './capacitor-bootstrap';

import './i18n';
import './index.css';
import { loading } from './boot/loading';
import { startPluginRuntime } from '@/plugins/runtime';

function mountApp() {
  loading();
  startPluginRuntime();

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );

  // 首帧后尽快收起 boot 遮罩，避免工作区恢复较慢时误以为一直卡在启动页
  requestAnimationFrame(() => {
    window.postMessage({ payload: 'removeLoading' }, window.location.origin);
  });
}

bootstrapCapacitorNative().finally(mountApp);

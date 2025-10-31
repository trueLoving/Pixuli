import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';
import './i18n';
import { loading } from './utils/loading';

// 初始化加载动画
loading();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

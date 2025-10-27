/**
 * TODO:
 * 1.3.0 桌面端版本需求：
 *  多窗口模式支持，
 *    1. 一个窗口用于仓库源设置，设置完成后下方列出设置的仓库源列表。
 *    2. 点击仓库源的 item，会打开图片浏览窗口（新的窗口，可进行图片的上传、查阅、删除、编辑）。
 *  系统托盘支持： 将图片压缩功能、图片转换、图片AI（rust-wasm）分析的入口放在系统托盘。用户点击后，会打开图片压缩窗口、图片转换窗口。
 *  应用设置相关： 将用户的设置（语言设置、快捷键设置）顶部菜单（参考 vscode IDE）
 *  桌面端自动更新方案设计： 自动检查和更新
 *  新的仓库源支持：目前先计划支持又拍云和GitHub，后续再支持其他仓库源
 *  版本信息添加（添加开发时依赖和构建时依赖，跟 web 端保持一致）
 *  图片重命名文件：是否应该支持，决定不支持，因为又拍云不支持，GitHub 支持，但是不常用（且存在性能问题，因为需要先获取原文件信息，再创建新文件，再删除原文件），而且处理起来比较麻烦，所以决定不支持。
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React, { Suspense } from 'react';
import { isWeb } from './utils/platform';
import './App.css';
import DesktopApp from './App.desktop';

// 动态导入 Web 版本的 App（仅在 Web 模式下加载）
const WebApp = isWeb() ? React.lazy(() => import('./App.web')) : null;

// 根据平台动态导入不同的 App 组件
function App() {
  // Web 模式：使用 Web 版本的 App
  if (isWeb() && WebApp) {
    return (
      <Suspense fallback={<DesktopApp />}>
        <WebApp />
      </Suspense>
    );
  }

  // Desktop 模式：使用 Desktop 版本的 App
  return <DesktopApp />;
}

export default App;

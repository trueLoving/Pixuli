import React, { Suspense } from 'react';
import { isWeb } from './utils/platform';
import './App.css';
import DesktopApp from './App.desktop';

// 动态导入 Web 版本的 App（使用 React.lazy 进行代码分割）
const WebApp = React.lazy(() => import('./App.web'));

// 根据平台动态导入不同的 App 组件
function App() {
  // Web 模式：使用 Web 版本的 App
  if (isWeb()) {
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

/**
 * 主内容区域（无顶栏 Header；日志与语言在设置中）
 */

import React from 'react';

interface AppMainProps {
  children: React.ReactNode;
}

export const AppMain: React.FC<AppMainProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <main className="flex-1 overflow-hidden bg-white relative min-h-0">
        {children}
      </main>
    </div>
  );
};

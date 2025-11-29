// Demo 组件公共类型定义

// 演示环境工具函数类型定义
export interface DemoConfig {
  version: string;
  platform: string;
  timestamp: string;
  config: {
    owner: string;
    repo: string;
    branch: string;
    token: string;
    path: string;
  };
}

// Demo 组件 Props 接口
export interface DemoProps {
  t: (key: string) => string;
  onExitDemo: () => void;
}

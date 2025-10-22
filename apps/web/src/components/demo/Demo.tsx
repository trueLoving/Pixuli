import { Play } from 'lucide-react';
import { useCallback, useState } from 'react';

// 演示环境工具函数
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

// 检测是否为演示环境
export function isDemoEnvironment(): boolean {
  // 检测优先级：
  // 1. 环境变量 VITE_DEMO_MODE
  // 2. URL 参数 ?demo=true
  // 3. localStorage 标记

  // 环境变量检测
  const envDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // URL 参数检测
  const urlParams = new URLSearchParams(window.location.search);
  const urlDemoMode = urlParams.get('demo') === 'true';

  // localStorage 检测
  const localStorageDemo = localStorage.getItem('pixuli-demo-mode') === 'true';

  return envDemoMode || urlDemoMode || localStorageDemo;
}

// 设置演示模式
export function setDemoMode(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('pixuli-demo-mode', 'true');
  } else {
    localStorage.removeItem('pixuli-demo-mode');
  }
}

// 获取演示配置
export function getDemoConfig(): DemoConfig {
  return {
    version: '1.0',
    platform: 'web',
    timestamp: new Date().toISOString(),
    config: {
      owner: import.meta.env.VITE_DEMO_GITHUB_OWNER,
      repo: import.meta.env.VITE_DEMO_GITHUB_REPO,
      branch: import.meta.env.VITE_DEMO_GITHUB_BRANCH,
      token: import.meta.env.VITE_DEMO_GITHUB_TOKEN,
      path: import.meta.env.VITE_DEMO_GITHUB_PATH,
    },
  };
}

// 下载演示配置文件
export function downloadDemoConfig(): void {
  const demoConfig = getDemoConfig();
  const configJson = JSON.stringify(demoConfig, null, 2);

  const blob = new Blob([configJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pixuli-github-config-demo.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// 从文件导入配置
export function importConfigFromFile(file: File): Promise<DemoConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as DemoConfig;

        // 验证配置格式
        if (!config.config || !config.config.owner || !config.config.repo) {
          throw new Error('配置文件格式不正确');
        }

        resolve(config);
      } catch (error) {
        reject(
          new Error(
            '配置文件解析失败: ' +
              (error instanceof Error ? error.message : '未知错误')
          )
        );
      }
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsText(file);
  });
}

// 检查环境变量是否已配置
export function isEnvConfigured(): boolean {
  return !!(
    import.meta.env.VITE_DEMO_MODE &&
    import.meta.env.VITE_DEMO_GITHUB_OWNER &&
    import.meta.env.VITE_DEMO_GITHUB_REPO &&
    import.meta.env.VITE_DEMO_GITHUB_TOKEN
  );
}

// Demo 组件 Props 接口
interface DemoProps {
  t: (key: string) => string;
  onExitDemo: () => void;
}

// Demo 组件
export function Demo({ t, onExitDemo }: DemoProps) {
  const handleDownloadDemoConfig = useCallback(() => {
    downloadDemoConfig();
  }, []);

  const handleExitDemoMode = useCallback(() => {
    setDemoMode(false);
    onExitDemo();
  }, [onExitDemo]);

  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Play className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-purple-800">
          {t('app.demoMode.title')}
        </h3>
      </div>
      <p className="text-purple-700 text-sm mb-3">
        {t('app.demoMode.description')}
      </p>
      <div className="flex justify-center space-x-3">
        <button
          onClick={handleDownloadDemoConfig}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{t('app.demoMode.downloadDemo')}</span>
        </button>
        <button
          onClick={handleExitDemoMode}
          className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
        >
          {t('app.demoMode.exitDemo')}
        </button>
      </div>
    </div>
  );
}

// Demo 状态 Hook
export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(isDemoEnvironment());

  const exitDemoMode = useCallback(() => {
    setDemoMode(false);
    setIsDemoMode(false);
  }, []);

  const enterDemoMode = useCallback(() => {
    setDemoMode(true);
    setIsDemoMode(true);
  }, []);

  return {
    isDemoMode,
    exitDemoMode,
    enterDemoMode,
  };
}

import { ChevronDown, Github, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

// 获取 GitHub 演示配置
export function getDemoGitHubConfig(): DemoConfig {
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

// 获取 Gitee 演示配置
export function getDemoGiteeConfig(): DemoConfig {
  return {
    version: '1.0',
    platform: 'web',
    timestamp: new Date().toISOString(),
    config: {
      owner: import.meta.env.VITE_DEMO_GITEE_OWNER,
      repo: import.meta.env.VITE_DEMO_GITEE_REPO,
      branch: import.meta.env.VITE_DEMO_GITEE_BRANCH,
      token: import.meta.env.VITE_DEMO_GITEE_TOKEN,
      path: import.meta.env.VITE_DEMO_GITEE_PATH,
    },
  };
}

// 兼容性：保留旧函数名
export function getDemoConfig(): DemoConfig {
  return getDemoGitHubConfig();
}

// 下载 GitHub 演示配置文件
export function downloadDemoGitHubConfig(): void {
  const demoConfig = getDemoGitHubConfig();
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

// 下载 Gitee 演示配置文件
export function downloadDemoGiteeConfig(): void {
  const demoConfig = getDemoGiteeConfig();
  const configJson = JSON.stringify(demoConfig, null, 2);

  const blob = new Blob([configJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pixuli-gitee-config-demo.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// 兼容性：保留旧函数名
export function downloadDemoConfig(): void {
  downloadDemoGitHubConfig();
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDownloadGitHub = useCallback(() => {
    downloadDemoGitHubConfig();
    setShowDropdown(false);
  }, []);

  const handleDownloadGitee = useCallback(() => {
    downloadDemoGiteeConfig();
    setShowDropdown(false);
  }, []);

  const handleExitDemoMode = useCallback(() => {
    setDemoMode(false);
    onExitDemo();
  }, [onExitDemo]);

  // 点击外部关闭下拉菜单
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  }, []);

  // 监听点击外部事件
  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown, handleClickOutside]);

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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{t('app.demoMode.downloadDemo')}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                onClick={handleDownloadGitHub}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                <Github className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {t('app.demoMode.downloadGitHub')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('app.demoMode.downloadGitHubDesc')}
                  </div>
                </div>
              </button>
              <button
                onClick={handleDownloadGitee}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors border-t border-gray-100"
              >
                <span className="w-5 h-5 text-gray-700 text-lg flex-shrink-0 flex items-center justify-center">
                  码云
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {t('app.demoMode.downloadGitee')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('app.demoMode.downloadGiteeDesc')}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
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

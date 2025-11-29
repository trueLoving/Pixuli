import {
  AlertTriangle,
  ChevronDown,
  Github,
  Play,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import './Demo.css';

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
  // 1. 环境变量 VITE_DEMO_MODE（主要方式）
  // 2. URL 参数 ?demo=true（开发/测试用）
  // 3. localStorage 标记（用户手动启用）

  // 环境变量检测（主要控制方式）
  const envDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // URL 参数检测（用于开发测试）
  const urlParams = new URLSearchParams(window.location.search);
  const urlDemoMode = urlParams.get('demo') === 'true';

  // localStorage 检测（用户手动启用）
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
      owner: import.meta.env.VITE_DEMO_GITHUB_OWNER || '',
      repo: import.meta.env.VITE_DEMO_GITHUB_REPO || '',
      branch: import.meta.env.VITE_DEMO_GITHUB_BRANCH || 'main',
      token: import.meta.env.VITE_DEMO_GITHUB_TOKEN || '',
      path: import.meta.env.VITE_DEMO_GITHUB_PATH || '',
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
      owner: import.meta.env.VITE_DEMO_GITEE_OWNER || '',
      repo: import.meta.env.VITE_DEMO_GITEE_REPO || '',
      branch: import.meta.env.VITE_DEMO_GITEE_BRANCH || 'master',
      token: import.meta.env.VITE_DEMO_GITEE_TOKEN || '',
      path: import.meta.env.VITE_DEMO_GITEE_PATH || '',
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
              (error instanceof Error ? error.message : '未知错误'),
          ),
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
  const envConfigured = isEnvConfigured();

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
    <div className="demo-banner">
      <div className="demo-banner-inner">
        {/* 头部：标题和说明 */}
        <div className="demo-banner-header">
          <div className="demo-banner-header-left">
            <div className="demo-banner-icon">
              <Sparkles className="demo-banner-icon-svg" />
            </div>
            <div className="demo-banner-title-block">
              <h3 className="demo-banner-title">
                {t('app.demoMode.title')}
                <span className="demo-banner-badge">Demo</span>
              </h3>
              <p className="demo-banner-desc">
                {t('app.demoMode.description')}
              </p>
            </div>
          </div>
        </div>

        {!envConfigured && (
          <div className="demo-banner-warning">
            <AlertTriangle size={16} className="demo-banner-warning-icon" />
            <span className="demo-banner-warning-text">
              {t('app.demoMode.missingConfig')}
            </span>
          </div>
        )}

        {/* 操作按钮区域 */}
        <div className="demo-banner-actions">
          <div className="demo-banner-dropdown" ref={dropdownRef}>
            <button
              onClick={() => envConfigured && setShowDropdown(!showDropdown)}
              disabled={!envConfigured}
              className={`demo-banner-btn demo-banner-btn-primary${
                envConfigured ? '' : ' demo-banner-btn-disabled'
              }`}
            >
              <Play className="demo-banner-btn-icon" />
              <span className="demo-banner-btn-text">
                {t('app.demoMode.downloadDemo')}
              </span>
              <ChevronDown
                className={`demo-banner-btn-chevron${
                  showDropdown ? ' demo-banner-btn-chevron-open' : ''
                }`}
              />
            </button>
            {showDropdown && envConfigured && (
              <div className="demo-banner-menu">
                <button
                  onClick={handleDownloadGitHub}
                  className="demo-banner-menu-item"
                >
                  <div className="demo-banner-menu-icon">
                    <Github className="demo-banner-menu-icon-svg" />
                  </div>
                  <div className="demo-banner-menu-text">
                    <div className="demo-banner-menu-title">
                      {t('app.demoMode.downloadGitHub')}
                    </div>
                    <div className="demo-banner-menu-desc">
                      {t('app.demoMode.downloadGitHubDesc')}
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleDownloadGitee}
                  className="demo-banner-menu-item demo-banner-menu-item--bordered"
                >
                  <div className="demo-banner-menu-icon">
                    <span className="demo-banner-menu-gitee">码</span>
                  </div>
                  <div className="demo-banner-menu-text">
                    <div className="demo-banner-menu-title">
                      {t('app.demoMode.downloadGitee')}
                    </div>
                    <div className="demo-banner-menu-desc">
                      {t('app.demoMode.downloadGiteeDesc')}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleExitDemoMode}
            className="demo-banner-btn demo-banner-btn-secondary"
          >
            {t('app.demoMode.exitDemo')}
          </button>
        </div>
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

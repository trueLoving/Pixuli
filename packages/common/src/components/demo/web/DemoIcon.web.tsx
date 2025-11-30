import { AlertCircle, Github, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultTranslate } from '../../../locales';
import { demoLocales } from '../locales';
import {
  isEnvConfigured,
  getDemoGitHubConfig,
  getDemoGiteeConfig,
  isDemoEnvironment,
} from './Demo.web';
import './DemoIcon.css';

interface DemoIconProps {
  t?: (key: string) => string;
  /** 是否处于 Demo 模式（可选，如果不提供则自动检测） */
  isDemoMode?: boolean;
}

// Demo 图标组件（Web 版本）- 用于 Header 右上角
export function DemoIcon({ t, isDemoMode: propIsDemoMode }: DemoIconProps) {
  const translate =
    t || ((key: string) => defaultTranslate(key, demoLocales['zh-CN']));
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const envConfigured = isEnvConfigured();

  // 如果传入了 isDemoMode prop，使用它；否则自动检测
  const isDemoMode =
    propIsDemoMode !== undefined ? propIsDemoMode : isDemoEnvironment();

  // 如果不在 demo 模式，不显示
  if (!isDemoMode) {
    return null;
  }

  const handleDownloadGitHub = useCallback(() => {
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
    setShowDropdown(false);
  }, []);

  const handleDownloadGitee = useCallback(() => {
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
    setShowDropdown(false);
  }, []);

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
    <div className="demo-icon-wrapper" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="demo-icon-button"
        title={translate('app.demoMode.title')}
      >
        <Sparkles size={18} className="demo-icon-svg" />
        {!envConfigured && (
          <span className="demo-icon-warning-badge">
            <AlertCircle size={10} />
          </span>
        )}
        <span className="demo-icon-text">
          {translate('app.demoMode.label') || translate('app.demoMode.title')}
        </span>
      </button>

      {showDropdown && (
        <div className="demo-icon-dropdown">
          <div className="demo-icon-dropdown-header">
            <div className="demo-icon-dropdown-title">
              <Sparkles size={16} />
              <span>{translate('app.demoMode.title')}</span>
              <span className="demo-icon-badge">Demo</span>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="demo-icon-dropdown-close"
              aria-label="关闭"
            >
              <X size={14} />
            </button>
          </div>

          {!envConfigured && (
            <div className="demo-icon-dropdown-warning">
              <AlertCircle size={14} />
              <span>{translate('app.demoMode.missingConfig')}</span>
            </div>
          )}

          <div className="demo-icon-dropdown-content">
            {envConfigured && (
              <>
                <button
                  onClick={handleDownloadGitHub}
                  className="demo-icon-dropdown-item"
                >
                  <Github size={16} className="demo-icon-dropdown-item-icon" />
                  <div className="demo-icon-dropdown-item-text">
                    <div className="demo-icon-dropdown-item-title">
                      {translate('app.demoMode.downloadGitHub')}
                    </div>
                    <div className="demo-icon-dropdown-item-desc">
                      {translate('app.demoMode.downloadGitHubDesc')}
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleDownloadGitee}
                  className="demo-icon-dropdown-item"
                >
                  <span className="demo-icon-dropdown-item-icon">码</span>
                  <div className="demo-icon-dropdown-item-text">
                    <div className="demo-icon-dropdown-item-title">
                      {translate('app.demoMode.downloadGitee')}
                    </div>
                    <div className="demo-icon-dropdown-item-desc">
                      {translate('app.demoMode.downloadGiteeDesc')}
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoIcon;

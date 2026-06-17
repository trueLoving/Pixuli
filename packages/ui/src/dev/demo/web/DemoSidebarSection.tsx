import { AlertCircle, Github, Sparkles } from 'lucide-react';
import { useCallback } from 'react';
import { defaultTranslate } from '@pixuli/ui/locales';
import { demoLocales } from '@pixuli/ui/dev/demo/locales';
import {
  downloadDemoGitHubConfig,
  downloadDemoGiteeConfig,
  isEnvConfigured,
  setDemoMode,
} from './Demo';
import './DemoSidebarSection.css';

export interface DemoSidebarSectionProps {
  t?: (key: string) => string;
  onExitDemo?: () => void;
}

/** 侧栏演示模式区块：下载 Demo 配置、退出演示（REF-512 移动端菜单） */
export function DemoSidebarSection({ t, onExitDemo }: DemoSidebarSectionProps) {
  const translate =
    t || ((key: string) => defaultTranslate(key, demoLocales['zh-CN']));
  const envConfigured = isEnvConfigured();

  const handleExitDemo = useCallback(async () => {
    await setDemoMode(false);
    onExitDemo?.();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [onExitDemo]);

  return (
    <section
      className="sidebar-demo-section"
      aria-label={translate('app.demoMode.title')}
    >
      <div className="sidebar-demo-section-header">
        <Sparkles size={16} className="sidebar-demo-section-icon" />
        <span className="sidebar-demo-section-title">
          {translate('app.demoMode.title')}
        </span>
        <span className="sidebar-demo-section-badge">Demo</span>
      </div>

      <p className="sidebar-demo-section-desc">
        {translate('app.demoMode.description')}
      </p>

      {!envConfigured && (
        <div className="sidebar-demo-section-warning" role="status">
          <AlertCircle size={14} />
          <span>{translate('app.demoMode.missingConfig')}</span>
        </div>
      )}

      {envConfigured && (
        <div className="sidebar-demo-section-actions">
          <button
            type="button"
            className="sidebar-demo-download-btn"
            onClick={downloadDemoGitHubConfig}
          >
            <Github size={16} />
            <span className="sidebar-demo-download-text">
              <span className="sidebar-demo-download-title">
                {translate('app.demoMode.downloadGitHub')}
              </span>
              <span className="sidebar-demo-download-desc">
                {translate('app.demoMode.downloadGitHubDesc')}
              </span>
            </span>
          </button>
          <button
            type="button"
            className="sidebar-demo-download-btn"
            onClick={downloadDemoGiteeConfig}
          >
            <span className="sidebar-demo-gitee-icon">码</span>
            <span className="sidebar-demo-download-text">
              <span className="sidebar-demo-download-title">
                {translate('app.demoMode.downloadGitee')}
              </span>
              <span className="sidebar-demo-download-desc">
                {translate('app.demoMode.downloadGiteeDesc')}
              </span>
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        className="sidebar-demo-exit-btn"
        onClick={() => void handleExitDemo()}
      >
        {translate('app.demoMode.exitDemo')}
      </button>
    </section>
  );
}

export default DemoSidebarSection;

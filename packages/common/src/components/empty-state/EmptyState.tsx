import {
  BookOpen,
  Github,
  GitBranch,
  HelpCircle,
  Image as ImageIcon,
  Play,
  Settings,
} from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '../../locales';
import './EmptyState.css';

interface EmptyStateProps {
  onAddGitHub: () => void;
  onAddGitee: () => void;
  onTryDemo?: () => void;
  t?: (key: string) => string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onAddGitHub,
  onAddGitee,
  onTryDemo,
  t,
}) => {
  const translate = t || defaultTranslate;

  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        {/* 图标 */}
        <div className="empty-state-icon">
          <ImageIcon size={80} className="empty-state-icon-svg" />
        </div>

        {/* 标题 */}
        <h2 className="empty-state-title">{translate('emptyState.title')}</h2>

        {/* 描述 */}
        <p className="empty-state-description">
          {translate('emptyState.description')}
        </p>

        {/* 主要操作按钮 */}
        <div className="empty-state-actions">
          <button onClick={onAddGitHub} className="empty-state-button primary">
            <Github className="w-5 h-5" />
            {translate('emptyState.addGitHub')}
          </button>
          <button onClick={onAddGitee} className="empty-state-button primary">
            <GitBranch className="w-5 h-5" />
            {translate('emptyState.addGitee')}
          </button>
          {onTryDemo && (
            <button
              onClick={onTryDemo}
              className="empty-state-button secondary"
            >
              <Play className="w-5 h-5" />
              {translate('emptyState.tryDemo')}
            </button>
          )}
        </div>

        {/* 快速开始指南 */}
        <div className="empty-state-guide">
          <h3 className="guide-title">{translate('emptyState.quickStart')}</h3>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>{translate('emptyState.step1.title')}</h4>
                <p>{translate('emptyState.step1.description')}</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>{translate('emptyState.step2.title')}</h4>
                <p>{translate('emptyState.step2.description')}</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>{translate('emptyState.step3.title')}</h4>
                <p>{translate('emptyState.step3.description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 帮助链接 */}
        <div className="empty-state-help">
          <HelpCircle className="w-4 h-4" />
          <span>{translate('emptyState.needHelp')}</span>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              // 可以打开帮助文档或触发帮助事件
              window.dispatchEvent(new CustomEvent('openKeyboardHelp'));
            }}
            className="help-link"
          >
            {translate('emptyState.viewDocs')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;

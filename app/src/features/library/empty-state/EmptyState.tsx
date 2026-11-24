import React from 'react';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import { defaultTranslate } from '@/i18n/locales';
import { StorageSourceIcon } from '@/plugins/storageUi';
import type { EmptyStateProps } from './types';
import './EmptyState.css';

const EmptyState: React.FC<EmptyStateProps> = ({ providers, t }) => {
  const translate = t || defaultTranslate;

  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <BrandPixelMark variant="offline" size={112} />
        </div>

        <h2 className="empty-state-title">{translate('emptyState.title')}</h2>

        <p className="empty-state-description">
          {translate('emptyState.description')}
        </p>

        <div className="empty-state-actions">
          {providers.map(provider => (
            <button
              key={provider.pluginId}
              type="button"
              onClick={provider.onAdd}
              className="empty-state-button primary"
            >
              <StorageSourceIcon pluginId={provider.pluginId} size={20} />
              {(() => {
                const template = translate('emptyState.addProvider');
                if (template === 'emptyState.addProvider') {
                  return `配置 ${provider.name}`;
                }
                return template.replace('{name}', provider.name);
              })()}
            </button>
          ))}
        </div>

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
      </div>
    </div>
  );
};

export default EmptyState;

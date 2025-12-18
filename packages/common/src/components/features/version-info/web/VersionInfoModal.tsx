import { useEscapeKey } from '../../../../hooks';
import {
  Calendar,
  Code,
  GitBranch,
  Hash,
  Info,
  Package,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import type { VersionInfo } from './types';
import './VersionInfoModal.css';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
  versionInfo: VersionInfo;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  isOpen,
  onClose,
  t,
  versionInfo,
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'frameworks' | 'dependencies'
  >('basic');

  // ESC 键关闭模态框
  useEscapeKey(() => {
    if (isOpen) {
      onClose();
    }
  }, isOpen);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatVersion = (version: string) => {
    return version.replace(/[\^~]/, '');
  };

  return (
    <div className="version-info-modal-overlay" onClick={onClose}>
      <div
        className="version-info-modal-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="version-info-modal-header">
          <div className="version-info-modal-title-section">
            <div className="version-info-modal-icon-container">
              <Info className="version-info-modal-icon" />
            </div>
            <div>
              <h2 className="version-info-modal-title-text">
                {t('version.title')}
              </h2>
              <p className="version-info-modal-subtitle">
                {t('version.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="version-info-modal-close"
            aria-label={t('common.close')}
          >
            <X className="version-info-modal-close-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="version-info-modal-body">
          {/* Tabs */}
          <div className="version-info-modal-tabs">
            <button
              onClick={() => setActiveTab('basic')}
              className={`version-info-modal-tab ${
                activeTab === 'basic' ? 'active' : ''
              }`}
            >
              <Package className="version-info-modal-tab-icon" />
              <span className="version-info-modal-tab-text">
                {t('version.tabs.basic')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('frameworks')}
              className={`version-info-modal-tab ${
                activeTab === 'frameworks' ? 'active' : ''
              }`}
            >
              <Code className="version-info-modal-tab-icon" />
              <span className="version-info-modal-tab-text">
                {t('version.tabs.frameworks')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`version-info-modal-tab ${
                activeTab === 'dependencies' ? 'active' : ''
              }`}
            >
              <Package className="version-info-modal-tab-icon" />
              <span className="version-info-modal-tab-text">
                {t('version.tabs.dependencies')}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {activeTab === 'basic' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div className="version-info-modal-grid">
                  <div className="version-info-modal-card">
                    <div className="version-info-modal-card-header">
                      <Package
                        className="version-info-modal-card-icon"
                        style={{ color: '#2563eb' }}
                      />
                      <span className="version-info-modal-card-label">
                        {t('version.basic.name')}
                      </span>
                    </div>
                    <p className="version-info-modal-card-value">
                      {versionInfo.name}
                    </p>
                  </div>

                  <div className="version-info-modal-card">
                    <div className="version-info-modal-card-header">
                      <Hash
                        className="version-info-modal-card-icon"
                        style={{ color: '#10b981' }}
                      />
                      <span className="version-info-modal-card-label">
                        {t('version.basic.version')}
                      </span>
                    </div>
                    <p className="version-info-modal-card-value mono">
                      {versionInfo.version}
                    </p>
                  </div>

                  <div className="version-info-modal-card">
                    <div className="version-info-modal-card-header">
                      <Calendar
                        className="version-info-modal-card-icon"
                        style={{ color: '#a855f7' }}
                      />
                      <span className="version-info-modal-card-label">
                        {t('version.basic.buildTime')}
                      </span>
                    </div>
                    <p className="version-info-modal-card-value">
                      {formatDate(versionInfo.buildTime)}
                    </p>
                  </div>

                  <div className="version-info-modal-card">
                    <div className="version-info-modal-card-header">
                      <GitBranch
                        className="version-info-modal-card-icon"
                        style={{ color: '#f97316' }}
                      />
                      <span className="version-info-modal-card-label">
                        {t('version.basic.branch')}
                      </span>
                    </div>
                    <p className="version-info-modal-card-value mono">
                      {versionInfo.git.branch}
                    </p>
                  </div>

                  <div className="version-info-modal-card">
                    <div className="version-info-modal-card-header">
                      <Hash
                        className="version-info-modal-card-icon"
                        style={{ color: '#06b6d4' }}
                      />
                      <span className="version-info-modal-card-label">
                        Commit
                      </span>
                    </div>
                    <p className="version-info-modal-card-value mono">
                      {versionInfo.git.commit}
                    </p>
                  </div>
                </div>

                <div className="version-info-modal-card">
                  <div className="version-info-modal-card-header">
                    <Info
                      className="version-info-modal-card-icon"
                      style={{ color: '#2563eb' }}
                    />
                    <span className="version-info-modal-card-label">
                      {t('version.basic.description')}
                    </span>
                  </div>
                  <p className="version-info-modal-card-value">
                    {versionInfo.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'frameworks' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  className="version-info-modal-grid"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  }}
                >
                  {Object.entries(versionInfo.frameworks).map(
                    ([name, version]) => (
                      <div
                        key={name}
                        className="version-info-modal-framework-item"
                      >
                        <div className="version-info-modal-framework-header">
                          <span className="version-info-modal-framework-name">
                            {name}
                          </span>
                          <span className="version-info-modal-framework-version">
                            {formatVersion(version as string)}
                          </span>
                        </div>
                        <div className="version-info-modal-progress-bar">
                          <div
                            className="version-info-modal-progress-fill"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {Object.entries(versionInfo.dependencies).map(
                    ([name, version]) => (
                      <div
                        key={name}
                        className="version-info-modal-dependency-item"
                      >
                        <div className="version-info-modal-dependency-left">
                          <div className="version-info-modal-dependency-dot"></div>
                          <span className="version-info-modal-dependency-name">
                            {name}
                          </span>
                        </div>
                        <span className="version-info-modal-dependency-version">
                          {formatVersion(version as string)}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <div className="version-info-modal-info-box">
                  <div className="version-info-modal-info-header">
                    <Info className="version-info-modal-info-icon" />
                    <span className="version-info-modal-info-title">
                      {t('version.dependencies.note')}
                    </span>
                  </div>
                  <p className="version-info-modal-info-text">
                    {t('version.dependencies.description')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="version-info-modal-footer">
          <div className="version-info-modal-footer-text">
            {t('version.footer.generated')}: {formatDate(versionInfo.buildTime)}
          </div>
          <button
            onClick={onClose}
            className="version-info-modal-footer-button"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionInfoModal;

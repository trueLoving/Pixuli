// TODO: 自定义快捷键
import { Command, Keyboard, RefreshCw, X, Zap } from 'lucide-react';
import React from 'react';
import { useEscapeKey } from '../../hooks';
import { defaultTranslate } from '../../locales';
import './KeyboardHelpModal.css';

interface KeyboardShortcut {
  description: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ShortcutCategory[];
  t?: (key: string) => string;
}

const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({
  isOpen,
  onClose,
  categories,
  t,
}) => {
  // ESC 键关闭模态框
  useEscapeKey(() => {
    if (isOpen) {
      onClose();
    }
  }, isOpen);

  if (!isOpen) return null;

  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate;

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case translate('keyboard.categories.general'):
        return <Command className="keyboard-help-category-icon" />;
      case translate('keyboard.categories.features'):
        return <Zap className="keyboard-help-category-icon" />;
      case translate('keyboard.categories.browsing'):
        return <RefreshCw className="keyboard-help-category-icon" />;
      default:
        return <Command className="keyboard-help-category-icon" />;
    }
  };

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Cmd');
    parts.push(shortcut.key);
    return parts.join(' + ');
  };

  return (
    <div className="keyboard-help-modal-overlay">
      <div className="keyboard-help-modal-content">
        {/* 头部 */}
        <div className="keyboard-help-modal-header">
          <div className="keyboard-help-modal-title-section">
            <div className="keyboard-help-modal-icon-container">
              <Keyboard className="keyboard-help-modal-icon" />
            </div>
            <div>
              <h2 className="keyboard-help-modal-title-text">
                {translate('keyboard.title')}
              </h2>
              <p className="keyboard-help-modal-subtitle">
                {translate('keyboard.subtitle')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="keyboard-help-modal-close">
            <X className="keyboard-help-modal-close-icon" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="keyboard-help-modal-body">
          <div className="keyboard-help-categories">
            {categories.map(category => (
              <div key={category.name} className="keyboard-help-category">
                <div className="keyboard-help-category-header">
                  {getCategoryIcon(category.name)}
                  <h3 className="keyboard-help-category-title">
                    {category.name}
                  </h3>
                </div>

                <div className="keyboard-help-shortcuts-grid">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="keyboard-help-shortcut-item">
                      <span className="keyboard-help-shortcut-description">
                        {shortcut.description}
                      </span>
                      <div className="keyboard-help-shortcut-keys">
                        {formatShortcut(shortcut)
                          .split(' + ')
                          .map((part, partIndex) => (
                            <React.Fragment key={partIndex}>
                              <kbd className="keyboard-help-key">{part}</kbd>
                              {partIndex <
                                formatShortcut(shortcut).split(' + ').length -
                                  1 && (
                                <span className="keyboard-help-key-separator">
                                  +
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 使用提示 */}
          <div className="keyboard-help-tips">
            <h4 className="keyboard-help-tips-title">
              {translate('keyboard.usageTips.title')}
            </h4>
            <div className="keyboard-help-tips-content">
              <div className="keyboard-help-tip-item">
                <span className="keyboard-help-tip-bullet"></span>
                <span>{translate('keyboard.usageTips.tip1')}</span>
              </div>
              <div className="keyboard-help-tip-item">
                <span className="keyboard-help-tip-bullet"></span>
                <span>{translate('keyboard.usageTips.tip2')}</span>
              </div>
              <div className="keyboard-help-tip-item">
                <span className="keyboard-help-tip-bullet"></span>
                <span>{translate('keyboard.usageTips.tip3')}</span>
              </div>
              <div className="keyboard-help-tip-item">
                <span className="keyboard-help-tip-bullet"></span>
                <span>{translate('keyboard.usageTips.tip4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardHelpModal;

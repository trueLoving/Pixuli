import { Check, Globe } from 'lucide-react';
import React, { useState } from 'react';
import './LanguageSwitcher.css';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface LanguageSwitcherProps {
  /** 当前选中的语言代码 */
  currentLanguage: string;
  /** 可用的语言列表 */
  availableLanguages: Language[];
  /** 语言切换回调函数 */
  onLanguageChange: (languageCode: string) => void;
  /** 切换语言的提示文本 */
  switchTitle?: string;
  /** 当前语言的提示文本 */
  currentTitle?: string;
  /** 是否显示背景遮罩 */
  showBackdrop?: boolean;
  /** 自定义 CSS 类名 */
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  switchTitle = 'Switch Language',
  currentTitle = 'Current Language',
  showBackdrop = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    onLanguageChange(langCode);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  const currentLang = availableLanguages.find(
    lang => lang.code === currentLanguage
  );

  return (
    <div className={`language-switcher ${className}`}>
      <button
        onClick={handleToggle}
        className="language-switcher__trigger"
        title={switchTitle}
        type="button"
      >
        <Globe className="language-switcher__globe-icon" />
        <span className="language-switcher__flag">{currentLang?.flag}</span>
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          {showBackdrop && (
            <div
              className="language-switcher__backdrop"
              onClick={handleBackdropClick}
            />
          )}

          {/* 下拉菜单 */}
          <div className="language-switcher__dropdown">
            <div className="language-switcher__content">
              <div className="language-switcher__current-title">
                {currentTitle}
              </div>
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`language-switcher__option ${
                    currentLanguage === lang.code
                      ? 'language-switcher__option--active'
                      : ''
                  }`}
                  type="button"
                >
                  <div className="language-switcher__option-content">
                    <span className="language-switcher__option-flag">
                      {lang.flag}
                    </span>
                    <span className="language-switcher__option-name">
                      {lang.name}
                    </span>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check className="language-switcher__check-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;

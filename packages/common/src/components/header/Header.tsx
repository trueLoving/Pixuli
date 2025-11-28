import { RefreshCw, Upload } from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '../../locales';
import {
  default as LanguageSwitcher,
  type Language,
} from '../language-switcher/LanguageSwitcher';
import { SearchBar } from '../search';
import './Header.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpload?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  hasConfig: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  onSettings?: () => void;
  currentLanguage?: string;
  availableLanguages?: Language[];
  onLanguageChange?: (language: string) => void;
  t?: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onUpload,
  hasConfig,
  onRefresh,
  loading = false,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  t,
}) => {
  const translate = t || defaultTranslate;

  return (
    <header className="app-header">
      <div className="header-left">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={
            hasConfig
              ? translate('header.search.placeholder')
              : translate('header.search.placeholderDisabled')
          }
          disabled={!hasConfig}
        />
      </div>

      <div className="header-right">
        {hasConfig && onUpload && (
          <button
            onClick={onUpload}
            className="header-button primary"
            title={translate('header.upload')}
          >
            <Upload size={18} />
            <span className="header-button-label">
              {translate('header.upload')}
            </span>
          </button>
        )}

        {hasConfig && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="header-button icon-only"
            title={`${translate('navigation.refresh')} (F5)`}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        )}

        {currentLanguage && availableLanguages && onLanguageChange && (
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            availableLanguages={availableLanguages}
            onLanguageChange={onLanguageChange}
            switchTitle={translate('language.switch')}
            currentTitle={translate('language.current')}
            showBackdrop={true}
          />
        )}
      </div>
    </header>
  );
};

export default Header;

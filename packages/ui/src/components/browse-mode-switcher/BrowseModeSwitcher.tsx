import { ChevronDown, FileText, Play } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { defaultTranslate } from '../../locales';
import './BrowseModeSwitcher.css';

export type BrowseMode = 'file' | 'slide' | 'wall' | 'gallery3d';

interface BrowseModeSwitcherProps {
  currentMode: BrowseMode;
  onModeChange: (mode: BrowseMode) => void;
  className?: string;
  t?: (key: string) => string;
}

const BrowseModeSwitcher: React.FC<BrowseModeSwitcherProps> = ({
  currentMode,
  onModeChange,
  className = '',
  t,
}) => {
  const translate = t || defaultTranslate;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modes: Array<{
    mode: BrowseMode;
    icon: React.ReactNode;
    label: string;
  }> = [
    {
      mode: 'file',
      icon: <FileText className="browse-mode-icon" />,
      label: translate('browseMode.file'),
    },
    {
      mode: 'slide',
      icon: <Play className="browse-mode-icon" />,
      label: translate('browseMode.slide'),
    },
    // TODO: 暂时隐藏，等稳定后再开放
    // {
    //   mode: 'wall',
    //   icon: <LayoutGrid className="browse-mode-icon" />,
    //   label: translate('browseMode.wall'),
    // },
    // {
    //   mode: 'gallery3d',
    //   icon: <Image className="browse-mode-icon" />,
    //   label: translate('browseMode.gallery3d'),
    // },
  ];

  const currentModeData = modes.find(m => m.mode === currentMode) || modes[0];

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleModeSelect = (mode: BrowseMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`browse-mode-switcher ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="browse-mode-select-button"
        title={currentModeData.label}
      >
        <div className="browse-mode-select-content">
          {currentModeData.icon}
          <span className="browse-mode-select-label">
            {currentModeData.label}
          </span>
        </div>
        <ChevronDown
          className={`browse-mode-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`browse-mode-dropdown open`}>
          {modes.map(({ mode, icon, label }, index) => (
            <button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              className={`browse-mode-dropdown-item ${
                currentMode === mode ? 'active' : ''
              }`}
              style={{
                animationDelay: `${index * 0.03}s`,
              }}
            >
              {icon}
              <span className="browse-mode-dropdown-label">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseModeSwitcher;

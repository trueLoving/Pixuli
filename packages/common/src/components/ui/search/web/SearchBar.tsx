import { Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 快捷键 '/' 聚焦搜索
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果按 '/' 且不在输入框中
      if (
        e.key === '/' &&
        !isFocused &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, disabled]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`search-bar ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <Search className="search-icon" size={20} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className="search-input"
      />
      {value && !disabled && (
        <button
          onClick={handleClear}
          className="search-clear"
          type="button"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      {!disabled && !isFocused && (
        <div className="search-shortcut-hint">
          <kbd>/</kbd>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

import { Clock, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './SearchBar.css';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** 是否显示历史记录 */
  showHistory?: boolean;
  /** 历史记录数据 */
  history?: SearchHistoryItem[];
  /** 选择历史记录回调 */
  onSelectHistory?: (query: string) => void;
  /** 删除历史记录回调 */
  onDeleteHistory?: (query: string) => void;
  /** 清空历史记录回调 */
  onClearHistory?: () => void;
  /** 保存历史记录回调（按下 Enter 时调用） */
  onSaveHistory?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  onFocus,
  onBlur,
  showHistory = false,
  history = [],
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  onSaveHistory,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 过滤历史记录（根据当前输入）
  const filteredHistory = React.useMemo(() => {
    if (!value || value.trim().length === 0) {
      return history;
    }
    const lowerValue = value.toLowerCase();
    return history.filter(item =>
      item.query.toLowerCase().includes(lowerValue),
    );
  }, [history, value]);

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

  // 键盘导航历史记录
  useEffect(() => {
    if (!showHistoryPanel || filteredHistory.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHistoryIndex(prev =>
          prev < filteredHistory.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHistoryIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        if (selectedHistoryIndex >= 0) {
          // 有选中项，选择该项
          e.preventDefault();
          const selectedItem = filteredHistory[selectedHistoryIndex];
          if (selectedItem && onSelectHistory) {
            onSelectHistory(selectedItem.query);
            setShowHistoryPanel(false);
            setSelectedHistoryIndex(-1);
          }
        } else if (value && value.trim().length > 0) {
          // 没有选中项，保存当前输入的历史记录
          e.preventDefault();
          if (onSaveHistory) {
            onSaveHistory(value.trim());
          }
          setShowHistoryPanel(false);
          setSelectedHistoryIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setShowHistoryPanel(false);
        setSelectedHistoryIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    showHistoryPanel,
    filteredHistory,
    selectedHistoryIndex,
    onSelectHistory,
    value,
    onSaveHistory,
  ]);

  // 点击外部关闭历史记录面板
  useEffect(() => {
    if (!showHistoryPanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowHistoryPanel(false);
        setSelectedHistoryIndex(-1);
      }
    };

    // 延迟添加事件监听，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryPanel]);

  const handleFocus = () => {
    setIsFocused(true);
    if (showHistory && filteredHistory.length > 0) {
      setShowHistoryPanel(true);
    }
    onFocus?.();
  };

  const handleBlur = () => {
    // 延迟处理，以便点击历史记录项时不会立即关闭
    setTimeout(() => {
      setIsFocused(false);
      onBlur?.();
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // 输入时显示历史记录
    if (showHistory && filteredHistory.length > 0) {
      setShowHistoryPanel(true);
    } else {
      setShowHistoryPanel(false);
    }
    setSelectedHistoryIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
    setShowHistoryPanel(false);
    setSelectedHistoryIndex(-1);
  };

  const handleSelectHistory = useCallback(
    (query: string) => {
      onChange(query);
      if (onSelectHistory) {
        onSelectHistory(query);
      }
      setShowHistoryPanel(false);
      setSelectedHistoryIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, onSelectHistory],
  );

  const handleDeleteHistory = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.stopPropagation();
      if (onDeleteHistory) {
        onDeleteHistory(query);
      }
      // 重新过滤历史记录
      setSelectedHistoryIndex(-1);
    },
    [onDeleteHistory],
  );

  const handleClearHistory = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClearHistory) {
        onClearHistory();
      }
      setShowHistoryPanel(false);
    },
    [onClearHistory],
  );

  // 处理 Enter 键：当历史记录面板未打开时保存历史记录
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 按下 Enter 键时，如果历史记录面板未打开，保存历史记录
      if (
        e.key === 'Enter' &&
        !showHistoryPanel &&
        value &&
        value.trim().length > 0
      ) {
        if (onSaveHistory) {
          onSaveHistory(value.trim());
        }
      }
    },
    [showHistoryPanel, value, onSaveHistory],
  );

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div
        className={`search-bar ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <Search className="search-icon" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
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
        {!disabled && !isFocused && !value && (
          <div className="search-shortcut-hint">
            <kbd>/</kbd>
          </div>
        )}
      </div>

      {/* 历史记录下拉面板 */}
      {showHistory &&
        showHistoryPanel &&
        filteredHistory.length > 0 &&
        !disabled && (
          <div className="search-history-panel" ref={historyPanelRef}>
            <div className="search-history-header">
              <span className="search-history-title">搜索历史</span>
              {onClearHistory && (
                <button
                  onClick={handleClearHistory}
                  className="search-history-clear-all"
                  type="button"
                >
                  清空
                </button>
              )}
            </div>
            <div className="search-history-list">
              {filteredHistory.map((item, index) => (
                <div
                  key={`${item.query}-${item.timestamp}`}
                  className={`search-history-item ${
                    selectedHistoryIndex === index ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectHistory(item.query)}
                  onMouseEnter={() => setSelectedHistoryIndex(index)}
                >
                  <Clock className="search-history-icon" size={16} />
                  <span className="search-history-query">{item.query}</span>
                  {onDeleteHistory && (
                    <button
                      onClick={e => handleDeleteHistory(e, item.query)}
                      className="search-history-delete"
                      type="button"
                      aria-label="Delete history"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default SearchBar;

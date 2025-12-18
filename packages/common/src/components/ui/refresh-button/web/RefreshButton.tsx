import { RefreshCw } from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '../../../../locales';
import './RefreshButton.css';

export interface RefreshButtonProps {
  /** 刷新回调函数 */
  onRefresh: () => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否禁用（通常在有配置时启用） */
  disabled?: boolean;
  /** 翻译函数 */
  t?: (key: string) => string;
  /** 自定义 CSS 类名 */
  className?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  loading = false,
  disabled = false,
  t,
  className = '',
}) => {
  const translate = t || defaultTranslate;
  const title = `${translate('navigation.refresh')} (F5)`;

  return (
    <button
      onClick={onRefresh}
      disabled={disabled || loading}
      className={`refresh-button icon-only ${className}`}
      title={title}
      type="button"
    >
      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
    </button>
  );
};

export default RefreshButton;

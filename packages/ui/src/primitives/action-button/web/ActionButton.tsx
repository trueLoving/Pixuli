import React, { ReactNode } from 'react';
import './ActionButton.css';

export type ActionButtonVariant = 'icon-only' | 'icon-text' | 'text-only';
export type ActionButtonSize = 'small' | 'medium' | 'large';

export interface ActionButtonProps {
  /** 点击回调函数 */
  onClick: () => void;
  /** 图标（React 节点） */
  icon?: ReactNode;
  /** 文字标签 */
  label?: string;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮变体 */
  variant?: ActionButtonVariant;
  /** 按钮尺寸 */
  size?: ActionButtonSize;
  /** 标题（tooltip） */
  title?: string;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 通用操作按钮组件
 * 提供统一的按钮样式和行为，支持图标、文字、加载状态等
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  label,
  loading = false,
  disabled = false,
  variant = 'icon-text',
  size = 'medium',
  title,
  className = '',
  type = 'button',
  style,
}) => {
  // 根据 variant 决定显示内容
  const showIcon = variant !== 'text-only' && icon;
  const showLabel = variant !== 'icon-only' && label;

  // 如果没有图标和文字，使用 icon-only 变体
  const actualVariant = !showIcon && !showLabel ? 'icon-only' : variant;

  // 生成类名
  const buttonClassName = [
    'action-button',
    `action-button--${actualVariant}`,
    `action-button--${size}`,
    loading && 'action-button--loading',
    disabled && 'action-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClassName}
      title={title}
      type={type}
      style={style}
    >
      {showIcon && (
        <span className="action-button-icon">
          {loading ? <span className="action-button-spinner" /> : icon}
        </span>
      )}
      {showLabel && <span className="action-button-label">{label}</span>}
    </button>
  );
};

export default ActionButton;

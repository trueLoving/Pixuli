import { Lock } from 'lucide-react';
import React from 'react';
import { defaultTranslate } from '@/i18n/locales';
import type { SidebarNavItemProps } from './types';

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon,
  label,
  active,
  disabled,
  comingSoon,
  onClick,
  tooltip,
  t,
}) => {
  const translate = t || defaultTranslate;
  const finalTooltip = comingSoon
    ? translate('sidebar.comingSoon')
    : tooltip || (disabled ? translate('sidebar.disabled') : undefined);

  return (
    <button
      className={`sidebar-nav-item ${active ? 'active' : ''} ${
        disabled ? 'disabled' : ''
      } ${comingSoon ? 'coming-soon' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={finalTooltip}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      <span className="sidebar-nav-label">{label}</span>
      {comingSoon ? (
        <span
          className="sidebar-nav-badge coming-soon-badge"
          title={finalTooltip}
        >
          <Lock size={12} />
        </span>
      ) : null}
      {disabled && !comingSoon ? (
        <span className="sidebar-nav-badge" title={finalTooltip}>
          <Lock size={12} />
        </span>
      ) : null}
    </button>
  );
};

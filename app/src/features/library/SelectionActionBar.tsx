import { X } from 'lucide-react';
import React from 'react';
import type { CompactAction } from '@/features/inspector/inspectorTypes';
import { filterActionsForMobileBar } from '@/features/library/selectionActions';

export interface SelectionActionBarProps {
  selectedCount: number;
  actions: { grid: CompactAction[]; danger: CompactAction | null };
  compact?: boolean;
  t: (key: string) => string;
  onClearSelection: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  actions,
  compact = false,
  t,
  onClearSelection,
}) => {
  const visible = compact ? filterActionsForMobileBar(actions) : actions;
  const clearLabel = t('image.library.clearSelection');

  return (
    <div className="asset-library-batch selection-action-bar" role="toolbar">
      <span className="asset-library-batch-count">
        {t('image.library.selectedCount').replace(
          '{count}',
          String(selectedCount),
        )}
      </span>
      {visible.grid.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className="asset-library-icon-btn"
            title={action.title ?? action.label}
            aria-label={action.title ?? action.label}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <Icon size={18} aria-hidden />
          </button>
        );
      })}
      {visible.danger
        ? (() => {
            const DangerIcon = visible.danger.icon;
            return (
              <button
                type="button"
                className="asset-library-icon-btn asset-library-icon-btn--danger"
                title={visible.danger.title ?? visible.danger.label}
                aria-label={visible.danger.title ?? visible.danger.label}
                disabled={visible.danger.disabled || selectedCount === 0}
                onClick={visible.danger.onClick}
              >
                <DangerIcon size={18} aria-hidden />
              </button>
            );
          })()
        : null}
      <button
        type="button"
        className="asset-library-icon-btn"
        onClick={onClearSelection}
        aria-label={clearLabel}
        title={clearLabel}
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
};

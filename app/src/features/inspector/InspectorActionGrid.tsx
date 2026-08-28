import React from 'react';
import type { CompactAction } from './inspectorTypes';

export function InspectorActionGrid({
  actions,
  danger,
}: {
  actions: CompactAction[];
  danger?: CompactAction | null;
}) {
  const DangerIcon = danger?.icon;
  return (
    <div className="asset-inspector-actions-block">
      <div className="asset-inspector-action-grid" role="group">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="asset-inspector-action-btn"
              title={action.title ?? action.label}
              aria-label={action.title ?? action.label}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              <Icon size={18} aria-hidden />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
      {danger && DangerIcon ? (
        <button
          type="button"
          className="asset-inspector-action-danger"
          title={danger.title ?? danger.label}
          aria-label={danger.title ?? danger.label}
          disabled={danger.disabled}
          onClick={danger.onClick}
        >
          <DangerIcon size={16} aria-hidden />
          <span>{danger.label}</span>
        </button>
      ) : null}
    </div>
  );
}

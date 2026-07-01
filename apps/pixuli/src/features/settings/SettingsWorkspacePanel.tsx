import React from 'react';
import { WorkspaceManagePanel } from '@/features/workspace/WorkspaceManagePanel';

interface SettingsWorkspacePanelProps {
  t: (key: string) => string;
}

export const SettingsWorkspacePanel: React.FC<SettingsWorkspacePanelProps> = ({
  t,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings.menuWorkspace')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('workspace.manageHint')}
        </p>
      </div>
      <WorkspaceManagePanel />
    </div>
  );
};

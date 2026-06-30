import React from 'react';
import { WorkspaceManagePanel } from '@/features/workspace/WorkspaceManagePanel';
import { WorkspaceMigrationWizard } from '@/features/workspace';
import { useSourceStore } from '@/stores/sourceStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export const WorkspacePage: React.FC = () => {
  const needsSetup = useWorkspaceStore(state => state.needsWorkspaceSetup());
  const { sources } = useSourceStore();
  const showMigration = needsSetup && sources.length > 0;

  if (showMigration) {
    return (
      <div className="workspace-page h-full overflow-y-auto">
        <WorkspaceMigrationWizard />
      </div>
    );
  }

  return (
    <div className="workspace-page h-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <WorkspaceManagePanel />
      </div>
    </div>
  );
};

export default WorkspacePage;

import React from 'react';
import { WorkspaceFolderTree } from '@/features/workspace/WorkspaceFolderTree';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { ActivityBar } from '@/layouts/ActivityBar';
import { useUIStore } from '@/stores/uiStore';
import { AppMain } from './AppMain';
import './WorkspaceShell.css';

interface WorkspaceShellProps {
  children: React.ReactNode;
  t: (key: string) => string;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  children,
  t,
}) => {
  const isMobile = useMobileViewport();
  const workspaceExplorerOpen = useUIStore(
    state => state.workspaceExplorerOpen,
  );
  const setWorkspaceExplorerOpen = useUIStore(
    state => state.setWorkspaceExplorerOpen,
  );

  const showExplorer = !isMobile || workspaceExplorerOpen;

  return (
    <div className="workspace-shell">
      <ActivityBar t={t} />
      {showExplorer ? <WorkspaceFolderTree /> : null}
      {isMobile && workspaceExplorerOpen ? (
        <button
          type="button"
          className="workspace-explorer-backdrop"
          aria-label={t('workspace.closeExplorer')}
          onClick={() => setWorkspaceExplorerOpen(false)}
        />
      ) : null}
      <div className="workspace-shell-main">
        <AppMain>{children}</AppMain>
      </div>
    </div>
  );
};

const WORKSPACE_STORAGE_KEY = 'pixuli.workspace.v1';
const WORKSPACE_MODE_KEY = 'pixuli.workspaceMode.v1';

export type WorkspacePersist = {
  rootPath: string;
  workspaceId: string;
  folderLabel?: string;
};

export function saveWorkspaceModePref(
  mode: Exclude<import('@pixuli/core/vault').WorkspaceMode, 'unset'>,
): void {
  try {
    localStorage.setItem(WORKSPACE_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function loadPersistedWorkspace(): WorkspacePersist | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspacePersist;
    if (parsed?.rootPath) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePersistedWorkspace(
  rootPath: string,
  workspaceId: string,
  folderLabel?: string,
): void {
  try {
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ rootPath, workspaceId, folderLabel }),
    );
  } catch {
    // ignore
  }
}

export function clearPersistedWorkspace(): void {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    localStorage.removeItem(WORKSPACE_MODE_KEY);
  } catch {
    // ignore
  }
}

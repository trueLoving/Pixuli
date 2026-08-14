interface WorkspacePickResult {
  ok: boolean;
  rootPath: string | null;
}

interface WorkspaceAPI {
  getRoot: () => Promise<{ rootPath: string | null }>;
  pickRoot: () => Promise<WorkspacePickResult>;
  setRoot: (rootPath: string) => Promise<{ ok: boolean; rootPath?: string }>;
  readFile: (relativePath: string) => Promise<Uint8Array>;
  writeFile: (relativePath: string, data: Uint8Array) => Promise<{ ok: boolean }>;
  deleteFile: (relativePath: string) => Promise<{ ok: boolean }>;
  listFiles: (
    relativeDir: string,
    recursive?: boolean,
  ) => Promise<string[]>;
  exists: (relativePath: string) => Promise<boolean>;
}

interface Window {
  workspaceAPI?: WorkspaceAPI;
}

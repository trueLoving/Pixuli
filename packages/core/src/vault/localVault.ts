import { WORKSPACE_PATHS, WORKSPACE_SCHEMA_VERSION } from './paths';
import { randomUUID } from '../utils/randomUUID';
import type {
  LocalImageIndexEntry,
  LocalListOptions,
  LocalVault,
  WorkspaceAdapter,
  WorkspaceBinding,
  WorkspaceConfig,
} from './types';
import {
  basename,
  createIndexEntry,
  decodeJson,
  encodeJson,
  isIngestibleFilePath,
  nowIso,
} from './utils';

type IndexFile = {
  schemaVersion: number;
  entries: LocalImageIndexEntry[];
};

type FoldersFile = {
  schemaVersion: number;
  folders: string[];
};

function normalizeDir(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function joinPath(dir: string, name: string): string {
  const base = normalizeDir(dir);
  return base ? `${base}/${name}` : name;
}

export function createLocalVault(adapter: WorkspaceAdapter): LocalVault {
  let config: WorkspaceConfig | null = null;
  let index: LocalImageIndexEntry[] = [];
  let folders: string[] = [];

  const persistConfig = async () => {
    if (!config) {
      throw new Error('Workspace config is not initialized');
    }
    await adapter.writeFile(WORKSPACE_PATHS.config, encodeJson(config));
  };

  const persistIndex = async () => {
    const payload: IndexFile = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      entries: index,
    };
    await adapter.writeFile(WORKSPACE_PATHS.index, encodeJson(payload));
  };

  const persistFolders = async () => {
    const payload: FoldersFile = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      folders: [...folders].sort(),
    };
    await adapter.writeFile(WORKSPACE_PATHS.folders, encodeJson(payload));
  };

  const loadOrInitFolders = async (): Promise<string[]> => {
    if (await adapter.exists(WORKSPACE_PATHS.folders)) {
      const raw = await adapter.readFile(WORKSPACE_PATHS.folders);
      const parsed = decodeJson<FoldersFile>(raw);
      return (parsed.folders ?? []).map(normalizeDir).filter(Boolean);
    }
    const empty: FoldersFile = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      folders: [],
    };
    await adapter.writeFile(WORKSPACE_PATHS.folders, encodeJson(empty));
    return [];
  };

  const loadOrInitConfig = async (): Promise<WorkspaceConfig> => {
    if (await adapter.exists(WORKSPACE_PATHS.config)) {
      const raw = await adapter.readFile(WORKSPACE_PATHS.config);
      const parsed = decodeJson<WorkspaceConfig>(raw);
      if (parsed.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
        throw new Error(
          `Unsupported workspace schema: ${parsed.schemaVersion}`,
        );
      }
      return parsed;
    }

    const initial: WorkspaceConfig = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      workspaceId: randomUUID(),
      displayName: 'Pixuli Library',
      createdAt: nowIso(),
      bindings: [],
    };
    await adapter.writeFile(WORKSPACE_PATHS.config, encodeJson(initial));
    return initial;
  };

  const loadOrInitIndex = async (): Promise<LocalImageIndexEntry[]> => {
    if (await adapter.exists(WORKSPACE_PATHS.index)) {
      const raw = await adapter.readFile(WORKSPACE_PATHS.index);
      const parsed = decodeJson<IndexFile>(raw);
      return parsed.entries ?? [];
    }

    const empty: IndexFile = {
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      entries: [],
    };
    await adapter.writeFile(WORKSPACE_PATHS.index, encodeJson(empty));
    return [];
  };

  const vault: LocalVault = {
    adapter,

    async open() {
      if (!adapter.isReady()) {
        await adapter.pickRoot();
      }
      config = await loadOrInitConfig();
      index = await loadOrInitIndex();
      folders = await loadOrInitFolders();
    },

    getConfig() {
      if (!config) {
        throw new Error('LocalVault is not open; call open() first');
      }
      return config;
    },

    async list(options?: LocalListOptions) {
      let entries = index.filter(entry => {
        if (!options?.includeDeleted && entry.deletedAt) {
          return false;
        }
        if (options?.bindingId && entry.bindingId !== options.bindingId) {
          return false;
        }
        if (options?.search) {
          const q = options.search.toLowerCase();
          const haystack = [
            entry.name,
            entry.description ?? '',
            entry.tags.join(' '),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) {
            return false;
          }
        }
        return true;
      });
      return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async getByPath(relativePath) {
      return index.find(entry => entry.relativePath === relativePath) ?? null;
    },

    async importFile(source, targetRelativePath, meta) {
      const data = await readSourceBytes(adapter, source);
      await adapter.writeFile(targetRelativePath, data);
      const entry = createIndexEntry(targetRelativePath, data.byteLength, meta);
      const existingIdx = index.findIndex(
        item => item.relativePath === targetRelativePath,
      );
      if (existingIdx >= 0) {
        index[existingIdx] = {
          ...index[existingIdx],
          ...entry,
          id: index[existingIdx].id,
          createdAt: index[existingIdx].createdAt,
          updatedAt: nowIso(),
        };
      } else {
        index.push(entry);
      }
      await persistIndex();
      return (
        index.find(item => item.relativePath === targetRelativePath) ?? entry
      );
    },

    async updateMetadata(relativePath, patch, options) {
      const entry = index.find(item => item.relativePath === relativePath);
      if (!entry || entry.deletedAt) {
        throw new Error(`Image not found: ${relativePath}`);
      }
      const metadataChanged =
        (patch.name !== undefined && patch.name !== entry.name) ||
        (patch.description !== undefined &&
          patch.description !== entry.description) ||
        (patch.tags !== undefined &&
          JSON.stringify(patch.tags) !== JSON.stringify(entry.tags));
      Object.assign(entry, patch, { updatedAt: nowIso() });
      if (
        metadataChanged &&
        entry.syncState === 'synced' &&
        !options?.skipPendingPush
      ) {
        entry.syncState = 'pending-push';
      }
      await persistIndex();
      return { ...entry };
    },

    async softDelete(relativePath) {
      const entry = index.find(item => item.relativePath === relativePath);
      if (!entry || entry.deletedAt) {
        throw new Error(`Image not found: ${relativePath}`);
      }
      entry.deletedAt = nowIso();
      entry.updatedAt = entry.deletedAt;
      entry.syncState = 'pending-push';
      await persistIndex();
    },

    async removeEntry(relativePath) {
      const idx = index.findIndex(item => item.relativePath === relativePath);
      if (idx < 0) {
        return;
      }
      index.splice(idx, 1);
      if (await adapter.exists(relativePath)) {
        await adapter.deleteFile(relativePath);
      }
      await persistIndex();
    },

    async listFolders() {
      return [...folders];
    },

    async createFolder(relativeDir) {
      const dir = normalizeDir(relativeDir);
      if (!dir) {
        throw new Error('Folder path is required');
      }
      if (!folders.includes(dir)) {
        folders.push(dir);
        await persistFolders();
      }
      // 占位文件，确保部分 adapter 能列出空目录
      const keep = `${dir}/.pixuli-keep`;
      if (!(await adapter.exists(keep))) {
        await adapter.writeFile(keep, new Uint8Array(0));
      }
    },

    async renameFolder(fromDir, toDir) {
      const from = normalizeDir(fromDir);
      const to = normalizeDir(toDir);
      if (!from || !to || from === to) {
        throw new Error('Invalid folder rename');
      }
      const fromPrefix = `${from}/`;
      let moved = 0;
      for (const entry of index) {
        if (entry.deletedAt) continue;
        if (
          entry.relativePath === from ||
          entry.relativePath.startsWith(fromPrefix)
        ) {
          const nextPath =
            entry.relativePath === from
              ? to
              : `${to}/${entry.relativePath.slice(fromPrefix.length)}`;
          if (await adapter.exists(entry.relativePath)) {
            const data = await adapter.readFile(entry.relativePath);
            await adapter.writeFile(nextPath, data);
            await adapter.deleteFile(entry.relativePath);
          }
          entry.relativePath = nextPath;
          entry.name = basename(nextPath);
          entry.updatedAt = nowIso();
          entry.syncState = 'pending-push';
          moved += 1;
        }
      }
      folders = folders.map(folder => {
        if (folder === from) return to;
        if (folder.startsWith(fromPrefix)) {
          return `${to}/${folder.slice(fromPrefix.length)}`;
        }
        return folder;
      });
      // 去重
      folders = Array.from(new Set(folders.map(normalizeDir).filter(Boolean)));
      if (!folders.includes(to)) {
        folders.push(to);
      }
      await persistIndex();
      await persistFolders();
      return moved;
    },

    async deleteFolder(relativeDir) {
      const dir = normalizeDir(relativeDir);
      if (!dir) {
        throw new Error('Folder path is required');
      }
      const prefix = `${dir}/`;
      let count = 0;
      for (const entry of index) {
        if (entry.deletedAt) continue;
        if (
          entry.relativePath === dir ||
          entry.relativePath.startsWith(prefix)
        ) {
          entry.deletedAt = nowIso();
          entry.updatedAt = entry.deletedAt;
          entry.syncState = 'pending-push';
          count += 1;
        }
      }
      folders = folders.filter(
        folder => folder !== dir && !folder.startsWith(prefix),
      );
      await persistIndex();
      await persistFolders();
      return count;
    },

    async moveFile(relativePath, targetDir) {
      const entry = index.find(item => item.relativePath === relativePath);
      if (!entry || entry.deletedAt) {
        throw new Error(`Image not found: ${relativePath}`);
      }
      const dir = normalizeDir(targetDir);
      const fileName = basename(entry.relativePath);
      const nextPath = joinPath(dir, fileName);
      if (nextPath === entry.relativePath) {
        return { ...entry };
      }
      if (await adapter.exists(entry.relativePath)) {
        const data = await adapter.readFile(entry.relativePath);
        await adapter.writeFile(nextPath, data);
        await adapter.deleteFile(entry.relativePath);
      }
      entry.relativePath = nextPath;
      entry.name = fileName;
      entry.updatedAt = nowIso();
      entry.syncState = 'pending-push';
      await persistIndex();
      return { ...entry };
    },

    async scan() {
      const files = await adapter.listFiles(WORKSPACE_PATHS.imagesDir, {
        recursive: true,
      });
      let count = 0;
      for (const relativePath of files) {
        if (!isIngestibleFilePath(relativePath)) {
          continue;
        }
        const existsInIndex = index.some(
          entry => entry.relativePath === relativePath && !entry.deletedAt,
        );
        if (existsInIndex) {
          continue;
        }
        const data = await adapter.readFile(relativePath);
        index.push(
          createIndexEntry(relativePath, data.byteLength, {
            name: basename(relativePath),
          }),
        );
        count += 1;
      }
      if (count > 0) {
        await persistIndex();
      }
      return count;
    },

    async updateSyncMeta(relativePath, patch) {
      const entry = index.find(item => item.relativePath === relativePath);
      if (!entry || entry.deletedAt) {
        throw new Error(`Image not found: ${relativePath}`);
      }
      Object.assign(entry, patch, { updatedAt: nowIso() });
      await persistIndex();
      return { ...entry };
    },

    async upsertBindings(bindings, options) {
      if (!config) {
        throw new Error('LocalVault is not open; call open() first');
      }
      const nextBindings = options?.replace
        ? bindings
        : (() => {
            const byId = new Map(config.bindings.map(item => [item.id, item]));
            for (const binding of bindings) {
              byId.set(binding.id, binding);
            }
            return Array.from(byId.values());
          })();
      config = {
        ...config,
        bindings: nextBindings,
      };
      await persistConfig();
      return config;
    },
  };

  return vault;
}

async function readSourceBytes(
  adapter: WorkspaceAdapter,
  source: File | string,
): Promise<Uint8Array> {
  if (typeof source === 'string') {
    return adapter.readFile(source);
  }
  if (typeof source.arrayBuffer === 'function') {
    return new Uint8Array(await source.arrayBuffer());
  }
  return new Uint8Array(await new Response(source).arrayBuffer());
}

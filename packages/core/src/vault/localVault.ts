import { WORKSPACE_PATHS, WORKSPACE_SCHEMA_VERSION } from './paths';
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
  isImageFilePath,
  nowIso,
} from './utils';

type IndexFile = {
  schemaVersion: number;
  entries: LocalImageIndexEntry[];
};

export function createLocalVault(adapter: WorkspaceAdapter): LocalVault {
  let config: WorkspaceConfig | null = null;
  let index: LocalImageIndexEntry[] = [];

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
      workspaceId: crypto.randomUUID(),
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

    async updateMetadata(relativePath, patch) {
      const entry = index.find(item => item.relativePath === relativePath);
      if (!entry || entry.deletedAt) {
        throw new Error(`Image not found: ${relativePath}`);
      }
      Object.assign(entry, patch, { updatedAt: nowIso() });
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

    async scan() {
      const files = await adapter.listFiles(WORKSPACE_PATHS.imagesDir, {
        recursive: true,
      });
      let count = 0;
      for (const relativePath of files) {
        if (!isImageFilePath(relativePath)) {
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

    async upsertBindings(bindings) {
      if (!config) {
        throw new Error('LocalVault is not open; call open() first');
      }
      const byId = new Map(config.bindings.map(item => [item.id, item]));
      for (const binding of bindings) {
        byId.set(binding.id, binding);
      }
      config = {
        ...config,
        bindings: Array.from(byId.values()),
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

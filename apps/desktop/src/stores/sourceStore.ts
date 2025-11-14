import { UpyunConfig } from '@packages/ui/src';
import { create } from 'zustand';

export interface GitHubSourceConfig {
  id: string;
  name: string;
  type: 'github';
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export interface UpyunSourceConfig {
  id: string;
  name: string;
  type: 'upyun';
  operator: string;
  password: string;
  bucket: string;
  domain: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export type SourceConfig = GitHubSourceConfig | UpyunSourceConfig;

type SourceState = {
  sources: SourceConfig[];
  addSource: (
    input:
      | Omit<GitHubSourceConfig, 'id' | 'createdAt' | 'updatedAt'>
      | Omit<UpyunSourceConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => SourceConfig;
  updateSource: (
    id: string,
    input:
      | Partial<Omit<GitHubSourceConfig, 'id' | 'createdAt' | 'type'>>
      | Partial<Omit<UpyunSourceConfig, 'id' | 'createdAt' | 'type'>>
  ) => void;
  removeSource: (id: string) => void;
  getSourceById: (id: string) => SourceConfig | undefined;
  openProjectWindow: (id: string) => Promise<void>;
};

const STORAGE_KEY = 'pixuli.sources.v2';

function loadSources(): SourceConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 尝试迁移旧数据
      const oldKey = 'pixuli.github.sources.v1';
      const oldRaw = localStorage.getItem(oldKey);
      if (oldRaw) {
        try {
          const oldData = JSON.parse(oldRaw);
          if (Array.isArray(oldData)) {
            // 迁移旧数据，添加 type 字段
            const migrated = oldData.map((s: any) => ({
              ...s,
              type: 'github' as const,
            }));
            saveSources(migrated);
            localStorage.removeItem(oldKey);
            return migrated;
          }
        } catch {
          // ignore migration error
        }
      }
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // 确保所有源都有 type 字段（兼容旧数据）
    return data.map((s: any) => {
      if (!s.type) {
        return { ...s, type: 'github' };
      }
      return s;
    }) as SourceConfig[];
  } catch {
    return [];
  }
}

function saveSources(sources: SourceConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch {
    // ignore
  }
}

export const useSourceStore = create<SourceState>((set, get) => {
  const initial = loadSources();

  return {
    sources: initial,
    addSource: input => {
      const now = Date.now();
      const source: SourceConfig = {
        id: Math.random().toString(36).slice(2, 10),
        createdAt: now,
        updatedAt: now,
        ...input,
      } as SourceConfig;
      const next = [...get().sources, source];
      set({ sources: next });
      saveSources(next);
      return source;
    },
    updateSource: (id, input) => {
      const next = get().sources.map(s =>
        s.id === id ? { ...s, ...input, updatedAt: Date.now() } : s
      );
      set({ sources: next });
      saveSources(next);
    },
    removeSource: id => {
      const next = get().sources.filter(s => s.id !== id);
      set({ sources: next });
      saveSources(next);
    },
    getSourceById: id => get().sources.find(s => s.id === id),
    openProjectWindow: async id => {
      const ipcRenderer = (window as any).ipcRenderer;
      if (ipcRenderer && ipcRenderer.invoke) {
        await ipcRenderer.invoke(
          'open-win',
          `project?id=${encodeURIComponent(id)}`
        );
      }
    },
  };
});

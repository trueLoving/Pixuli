import { create } from 'zustand';

export interface GitHubSourceConfig {
  id: string;
  type: 'github';
  name: string;
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export interface GiteeSourceConfig {
  id: string;
  type: 'gitee';
  name: string;
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

export type SourceConfig = GitHubSourceConfig | GiteeSourceConfig;

type SourceState = {
  sources: SourceConfig[];
  selectedSourceId: string | null;
  addSource: (
    input:
      | Omit<GitHubSourceConfig, 'id' | 'createdAt' | 'updatedAt'>
      | Omit<GiteeSourceConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ) => SourceConfig;
  updateSource: (
    id: string,
    input:
      | Partial<Omit<GitHubSourceConfig, 'id' | 'createdAt' | 'type'>>
      | Partial<Omit<GiteeSourceConfig, 'id' | 'createdAt' | 'type'>>,
  ) => void;
  removeSource: (id: string) => void;
  getSourceById: (id: string) => SourceConfig | undefined;
  setSelectedSourceId: (id: string | null) => void;
};

const STORAGE_KEY = 'pixuli.sources.v1';

function loadSources(): SourceConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as SourceConfig[];
  } catch {
    return [];
  }
}

function saveSources(sources: SourceConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch (error) {
    console.error('Failed to save sources:', error);
  }
}

export const useSourceStore = create<SourceState>((set, get) => {
  const initial = loadSources();

  return {
    sources: initial,
    selectedSourceId: null,
    addSource: input => {
      const now = Date.now();
      const source: SourceConfig = {
        id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
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
        s.id === id ? { ...s, ...input, updatedAt: Date.now() } : s,
      );
      set({ sources: next });
      saveSources(next);
    },
    removeSource: id => {
      const next = get().sources.filter(s => s.id !== id);
      set({ sources: next });
      saveSources(next);
      // 如果删除的是当前选中的源，清除选中状态
      if (get().selectedSourceId === id) {
        set({ selectedSourceId: null });
      }
    },
    getSourceById: id => get().sources.find(s => s.id === id),
    setSelectedSourceId: id => {
      set({ selectedSourceId: id });
    },
  };
});

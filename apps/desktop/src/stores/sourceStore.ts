import { create } from 'zustand';

export interface GitHubSourceConfig {
  id: string;
  name: string;
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  createdAt: number;
  updatedAt: number;
}

type SourceState = {
  sources: GitHubSourceConfig[];
  addSource: (
    input: Omit<GitHubSourceConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => GitHubSourceConfig;
  updateSource: (
    id: string,
    input: Partial<Omit<GitHubSourceConfig, 'id' | 'createdAt'>>
  ) => void;
  removeSource: (id: string) => void;
  getSourceById: (id: string) => GitHubSourceConfig | undefined;
  openProjectWindow: (id: string) => Promise<void>;
};

const STORAGE_KEY = 'pixuli.github.sources.v1';

function loadSources(): GitHubSourceConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as GitHubSourceConfig[];
  } catch {
    return [];
  }
}

function saveSources(sources: GitHubSourceConfig[]) {
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
      const source: GitHubSourceConfig = {
        id: Math.random().toString(36).slice(2, 10),
        createdAt: now,
        updatedAt: now,
        ...input,
      };
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

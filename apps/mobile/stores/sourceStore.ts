import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  removeSource: (id: string) => Promise<void>;
  getSourceById: (id: string) => SourceConfig | undefined;
  setSelectedSourceId: (id: string | null) => void;
  initialize: () => Promise<void>;
};

const STORAGE_KEY = 'pixuli.sources.v1';
const SELECTED_SOURCE_KEY = 'pixuli.selectedSourceId';

async function loadSources(): Promise<SourceConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as SourceConfig[];
  } catch (error) {
    console.error('Failed to load sources:', error);
    return [];
  }
}

async function saveSources(sources: SourceConfig[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch (error) {
    console.error('Failed to save sources:', error);
  }
}

async function loadSelectedSourceId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELECTED_SOURCE_KEY);
  } catch (error) {
    console.error('Failed to load selected source id:', error);
    return null;
  }
}

async function saveSelectedSourceId(id: string | null): Promise<void> {
  try {
    if (id) {
      await AsyncStorage.setItem(SELECTED_SOURCE_KEY, id);
    } else {
      await AsyncStorage.removeItem(SELECTED_SOURCE_KEY);
    }
  } catch (error) {
    console.error('Failed to save selected source id:', error);
  }
}

export const useSourceStore = create<SourceState>((set, get) => ({
  sources: [],
  selectedSourceId: null,

  initialize: async () => {
    const sources = await loadSources();
    const selectedSourceId = await loadSelectedSourceId();
    set({ sources, selectedSourceId });
  },

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

  removeSource: async id => {
    const next = get().sources.filter(s => s.id !== id);
    set({ sources: next });
    await saveSources(next);
    // 如果删除的是当前选中的源，清除选中状态
    if (get().selectedSourceId === id) {
      set({ selectedSourceId: null });
      await saveSelectedSourceId(null);
    }
  },

  getSourceById: id => get().sources.find(s => s.id === id),

  setSelectedSourceId: id => {
    set({ selectedSourceId: id });
    saveSelectedSourceId(id);
  },
}));

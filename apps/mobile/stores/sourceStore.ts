import {
  createStoredSourceEntry,
  mergeStoredSourceUpdate,
  normalizeStoredSources,
  type CreateStoredSourceInput,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type SourceConfig = StoredSourceEntry;
export type AddSourceInput = CreateStoredSourceInput;
export type UpdateSourceInput = Partial<{
  label: string;
  pluginId: string;
  config: StoredSourceEntry['config'];
}>;

type SourceState = {
  sources: SourceConfig[];
  selectedSourceId: string | null;
  addSource: (input: AddSourceInput) => SourceConfig;
  updateSource: (id: string, input: UpdateSourceInput) => void;
  removeSource: (id: string) => Promise<void>;
  getSourceById: (id: string) => SourceConfig | undefined;
  setSelectedSourceId: (id: string | null) => void;
  initialize: () => Promise<void>;
};

const STORAGE_KEY = 'pixuli.sources.v2';
const LEGACY_STORAGE_KEY = 'pixuli.sources.v1';
const SELECTED_SOURCE_KEY = 'pixuli.selectedSourceId';

async function loadSources(): Promise<SourceConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeStoredSources(JSON.parse(raw));
    }

    const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const data = JSON.parse(legacyRaw);
      if (Array.isArray(data)) {
        const migrated = normalizeStoredSources(data);
        if (migrated.length > 0) {
          await saveSources(migrated);
          return migrated;
        }
      }
    }

    return [];
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
    const source = createStoredSourceEntry(
      input,
      Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    );
    const next = [...get().sources, source];
    set({ sources: next });
    saveSources(next);
    return source;
  },

  updateSource: (id, input) => {
    const next = get().sources.map(s =>
      s.id === id ? mergeStoredSourceUpdate(s, input) : s,
    );
    set({ sources: next });
    saveSources(next);
  },

  removeSource: async id => {
    const next = get().sources.filter(s => s.id !== id);
    set({ sources: next });
    await saveSources(next);
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

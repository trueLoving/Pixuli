import {
  createStoredSourceEntry,
  mergeStoredSourceUpdate,
  normalizeStoredSources,
  type CreateStoredSourceInput,
  type StoredSourceEntry,
} from '@pixuli/core/sources';
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
  removeSource: (id: string) => void;
  getSourceById: (id: string) => SourceConfig | undefined;
  setSelectedSourceId: (id: string | null) => void;
};

const STORAGE_KEY = 'pixuli.sources.v3';

function loadSources(): SourceConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeStoredSources(JSON.parse(raw));
    }

    const v2Raw = localStorage.getItem('pixuli.sources.v2');
    if (v2Raw) {
      const data = JSON.parse(v2Raw);
      if (Array.isArray(data)) {
        const migrated = normalizeStoredSources(
          data.map((s: Record<string, unknown>) =>
            s.type || s.pluginId ? s : { ...s, type: 'github' },
          ),
        );
        if (migrated.length > 0) {
          saveSources(migrated);
          return migrated;
        }
      }
    }

    const v1Raw = localStorage.getItem('pixuli.github.sources.v1');
    if (v1Raw) {
      const data = JSON.parse(v1Raw);
      if (Array.isArray(data)) {
        const migrated = normalizeStoredSources(
          data.map((s: Record<string, unknown>) => ({ ...s, type: 'github' })),
        );
        if (migrated.length > 0) {
          saveSources(migrated);
          localStorage.removeItem('pixuli.github.sources.v1');
          return migrated;
        }
      }
    }

    return [];
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

const SELECTED_SOURCE_KEY = 'pixuli.selectedSourceId';

function loadSelectedSourceId(): string | null {
  try {
    return localStorage.getItem(SELECTED_SOURCE_KEY);
  } catch {
    return null;
  }
}

function saveSelectedSourceId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(SELECTED_SOURCE_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_SOURCE_KEY);
    }
  } catch {
    // ignore
  }
}

export const useSourceStore = create<SourceState>((set, get) => {
  const initial = loadSources();
  const initialSelectedId = loadSelectedSourceId();

  return {
    sources: initial,
    selectedSourceId: initialSelectedId,
    addSource: input => {
      const source = createStoredSourceEntry(input);
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
    removeSource: id => {
      const next = get().sources.filter(s => s.id !== id);
      set({ sources: next });
      saveSources(next);
    },
    getSourceById: id => get().sources.find(s => s.id === id),
    setSelectedSourceId: id => {
      set({ selectedSourceId: id });
      saveSelectedSourceId(id);
    },
  };
});

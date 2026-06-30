import { create } from 'zustand';

export type SyncDefaultDirection = 'both' | 'push' | 'pull';

const STORAGE_KEY = 'pixuli.syncPreferences.v1';

interface SyncPreferencesPersist {
  defaultDirection: SyncDefaultDirection;
}

interface SyncPreferencesState {
  defaultDirection: SyncDefaultDirection;
  setDefaultDirection: (direction: SyncDefaultDirection) => void;
  hydrate: () => void;
}

function readPersisted(): SyncDefaultDirection {
  if (typeof localStorage === 'undefined') {
    return 'both';
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'both';
    const parsed = JSON.parse(raw) as Partial<SyncPreferencesPersist>;
    if (
      parsed.defaultDirection === 'push' ||
      parsed.defaultDirection === 'pull' ||
      parsed.defaultDirection === 'both'
    ) {
      return parsed.defaultDirection;
    }
  } catch {
    // ignore
  }
  return 'both';
}

function writePersisted(direction: SyncDefaultDirection): void {
  if (typeof localStorage === 'undefined') return;
  const payload: SyncPreferencesPersist = { defaultDirection: direction };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export const useSyncPreferencesStore = create<SyncPreferencesState>(set => ({
  defaultDirection: readPersisted(),
  setDefaultDirection: direction => {
    writePersisted(direction);
    set({ defaultDirection: direction });
  },
  hydrate: () => set({ defaultDirection: readPersisted() }),
}));

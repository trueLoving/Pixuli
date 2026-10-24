import { create } from 'zustand';
import {
  applyThemePreference,
  readThemePreference,
  writeThemePreference,
  type ThemePreference,
} from './theme';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>(set => ({
  preference: readThemePreference(),
  setPreference: preference => {
    writeThemePreference(preference);
    applyThemePreference(preference);
    set({ preference });
  },
}));

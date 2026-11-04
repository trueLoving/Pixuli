export const THEME_STORAGE_KEY = 'pixuli-theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_COLOR_LIGHT = '#7c6cf0';
const THEME_COLOR_DARK = '#1e1b4b';

export function isThemePreference(
  value: string | null,
): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): ThemePreference {
  if (!storage) return 'system';
  try {
    const raw = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: Pick<Storage, 'setItem'> | null = safeStorage(),
) {
  if (!storage) return;
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* private mode or blocked storage */
  }
}

export function resolveDark(
  preference: ThemePreference,
  systemDark: boolean,
): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return systemDark;
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyResolvedTheme(dark: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
  }
}

export function applyThemePreference(preference: ThemePreference) {
  applyResolvedTheme(resolveDark(preference, systemPrefersDark()));
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

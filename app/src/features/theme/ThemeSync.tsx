import { useEffect } from 'react';
import { applyThemePreference } from './theme';
import { useThemeStore } from './themeStore';

/** 偏好为「跟随系统」时，操作系统切换配色后立刻跟上。 */
export function ThemeSync() {
  const preference = useThemeStore(state => state.preference);

  useEffect(() => {
    applyThemePreference(preference);
    if (preference !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemePreference('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  return null;
}

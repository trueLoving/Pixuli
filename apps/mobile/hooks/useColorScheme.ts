import { loadTheme, saveTheme, ThemeMode } from '@/config/theme';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

let themeMode: ThemeMode = 'auto';
let listeners: Set<() => void> = new Set();
let isInitialized = false;

// 用于在设置页面监听主题变化的 hook
export const useThemeMode = (): ThemeMode => {
  const [mode, setMode] = useState<ThemeMode>(themeMode);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => {
      setMode(themeMode);
      forceUpdate({});
    };
    listeners.add(listener);
    setMode(themeMode);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return mode;
};

// 通知所有监听者主题已更改
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// 设置主题模式
export const setThemeMode = async (mode: ThemeMode) => {
  themeMode = mode;
  await saveTheme(mode);
  notifyListeners();
};

// 获取当前主题模式
export const getThemeMode = (): ThemeMode => {
  return themeMode;
};

// 初始化主题（从存储加载）
export const initTheme = async () => {
  if (isInitialized) {
    return;
  }
  const saved = await loadTheme();
  if (saved) {
    themeMode = saved;
  }
  isInitialized = true;
  notifyListeners();
};

// 自定义 hook，支持手动切换主题
export const useColorScheme = (): 'light' | 'dark' => {
  const systemColorScheme = useRNColorScheme();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // 初始化时加载主题（只初始化一次）
    if (!isInitialized) {
      initTheme();
    }

    // 添加监听器
    const listener = () => {
      forceUpdate({});
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // 根据主题模式返回实际的主题
  if (themeMode === 'auto') {
    return systemColorScheme ?? 'light';
  }
  return themeMode;
};

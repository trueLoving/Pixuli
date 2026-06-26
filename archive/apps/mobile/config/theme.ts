import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'pixuli.theme';

export type ThemeMode = 'light' | 'dark' | 'auto';

// 从本地存储加载主题设置
export const loadTheme = async (): Promise<ThemeMode | null> => {
  try {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
      return saved as ThemeMode;
    }
    return null;
  } catch (error) {
    console.error('Failed to load theme:', error);
    return null;
  }
};

// 保存主题设置到本地存储
export const saveTheme = async (theme: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
};

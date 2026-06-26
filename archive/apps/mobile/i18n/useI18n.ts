import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_KEY = 'pixuli.language';

export const useI18n = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    AsyncStorage.setItem(LANGUAGE_KEY, lng).catch(() => {});
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
      { code: 'en-US', name: 'English', flag: '🇺🇸' },
    ];
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    isReady: i18n.isInitialized,
  };
};

// 在任意使用该 hook 的组件首次挂载时，尝试从本地恢复语言
export const useInitLanguage = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved && saved !== i18n.language) {
          await i18n.changeLanguage(saved);
        }
      } catch {}
    })();
  }, [i18n]);
};

export default useI18n;

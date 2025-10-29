import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateAllToasts } from '@packages/ui/src/utils/toast';

export const useI18n = () => {
  const { t, i18n } = useTranslation();

  // 监听语言变化，更新所有活跃的 toast
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      updateAllToasts(t);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, t]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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

export default useI18n;

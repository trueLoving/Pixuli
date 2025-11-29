import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// 导入packages/ui的语言包
// zhCN 和 enUS 已经包含了所有组件语言包（包括 versionInfoLocales）
import { enUS, zhCN, deepMerge } from '@packages/common/src';
// 导入web端组件的语言包
import { pwaLocales } from '../components';

const resources = {
  'zh-CN': {
    translation: deepMerge({}, zhCN, pwaLocales['zh-CN']),
  },
  'en-US': {
    translation: deepMerge({}, enUS, pwaLocales['en-US']),
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    debug: false,

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

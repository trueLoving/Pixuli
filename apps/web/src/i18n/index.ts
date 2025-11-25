import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// 导入packages/ui的语言包
import { enUS, zhCN, deepMerge } from '@packages/common/src';
// 导入web端组件的语言包
import { demoLocales, versionInfoLocales, pwaLocales } from '../components';

const resources = {
  'zh-CN': {
    translation: deepMerge(
      {},
      zhCN,
      demoLocales['zh-CN'],
      versionInfoLocales['zh-CN'],
      pwaLocales['zh-CN']
    ),
  },
  'en-US': {
    translation: deepMerge(
      {},
      enUS,
      demoLocales['en-US'],
      versionInfoLocales['en-US'],
      pwaLocales['en-US']
    ),
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

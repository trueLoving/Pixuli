import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// 导入packages/ui的语言包
import { enUS, zhCN } from '@packages/ui/src';
// 导入web端专用语言包
import zhCNWeb from '../locales/zh-CN.json';
import enUSWeb from '../locales/en-US.json';

// 合并语言包
const mergeLocales = (baseLocales: any, webLocales: any) => {
  const merged = { ...baseLocales };
  Object.keys(webLocales).forEach(key => {
    if (merged[key]) {
      merged[key] = { ...merged[key], ...webLocales[key] };
    } else {
      merged[key] = webLocales[key];
    }
  });
  return merged;
};

const resources = {
  'zh-CN': {
    translation: mergeLocales(zhCN, zhCNWeb),
  },
  'en-US': {
    translation: mergeLocales(enUS, enUSWeb),
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

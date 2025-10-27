import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// 导入packages/ui的语言包
import { enUS, zhCN } from '@packages/ui/src';
// 导入组件语言包
import {
  aiAnalysisLocales,
  imageCompressionLocales,
  imageConverterLocales,
  versionInfoLocales,
} from '../components';

// 合并语言包
const mergeLocales = (baseLocales: any, componentLocales: any) => {
  const merged = { ...baseLocales };
  Object.keys(componentLocales).forEach(lang => {
    if (merged[lang]) {
      merged[lang] = { ...merged[lang], ...componentLocales[lang] };
    } else {
      merged[lang] = componentLocales[lang];
    }
  });
  return merged;
};

const resources = {
  'zh-CN': {
    translation: {
      ...zhCN,
      ...aiAnalysisLocales['zh-CN'],
      ...imageCompressionLocales['zh-CN'],
      ...imageConverterLocales['zh-CN'],
      ...versionInfoLocales['zh-CN'],
    },
  },
  'en-US': {
    translation: {
      ...enUS,
      ...aiAnalysisLocales['en-US'],
      ...imageCompressionLocales['en-US'],
      ...imageConverterLocales['en-US'],
      ...versionInfoLocales['en-US'],
    },
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

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// 导入packages/ui的语言包
import { deepMerge, enUS, zhCN } from '@packages/common/src';
// 导入桌面端功能模块语言包
import {
  aiAnalysisLocales,
  imageCompressionLocales,
  imageConverterLocales,
} from '../features';
import { desktopLocales } from './locales';

// zhCN 和 enUS 已经包含了所有组件语言包（包括 versionInfoLocales 和 slideShowLocales）
const resources = {
  'zh-CN': {
    translation: deepMerge(
      {},
      zhCN,
      desktopLocales['zh-CN'],
      aiAnalysisLocales['zh-CN'],
      imageCompressionLocales['zh-CN'],
      imageConverterLocales['zh-CN'],
    ),
  },
  'en-US': {
    translation: deepMerge(
      {},
      enUS,
      desktopLocales['en-US'],
      aiAnalysisLocales['en-US'],
      imageCompressionLocales['en-US'],
      imageConverterLocales['en-US'],
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

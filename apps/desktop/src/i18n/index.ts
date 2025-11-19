import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
// 导入packages/ui的语言包
import { deepMerge, enUS, zhCN } from '@packages/ui/src';
// 导入桌面端功能模块语言包
import {
  aiAnalysisLocales,
  imageCompressionLocales,
  imageConverterLocales,
  versionInfoLocales,
} from '../features';
// 从 packages/ui 导入幻灯片语言包
import { slideShowLocales } from '@packages/ui/src';
import { desktopLocales } from './locales';

const resources = {
  'zh-CN': {
    translation: deepMerge(
      {},
      zhCN,
      desktopLocales['zh-CN'],
      aiAnalysisLocales['zh-CN'],
      imageCompressionLocales['zh-CN'],
      imageConverterLocales['zh-CN'],
      slideShowLocales['zh-CN'],
      versionInfoLocales['zh-CN']
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
      slideShowLocales['en-US'],
      versionInfoLocales['en-US']
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

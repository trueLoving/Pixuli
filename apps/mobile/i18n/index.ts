import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
// 直接从 locales 导入，避免导入 toast 相关的内容
import { deepMerge, enUS, zhCN } from 'pixuli-ui/src/locales';
// 导入移动端语言包
import { mobileLocales } from './locales';

const resources = {
  'zh-CN': {
    translation: deepMerge({}, zhCN, mobileLocales['zh-CN']),
  },
  'en-US': {
    translation: deepMerge({}, enUS, mobileLocales['en-US']),
  },
};

// 确保 i18n 在使用前完全初始化
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: Localization.getLocales()[0].languageCode || 'zh-CN',
    fallbackLng: 'zh-CN',
    debug: false,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    compatibilityJSON: 'v4',
  });
}

export default i18n;

import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// 直接从 locales 导入，避免导入 toast 相关的内容
import { deepMerge, enUS, zhCN } from '@packages/common/src/index.native';
// 导入移动端语言包
import { mobileLocales } from './locales';

// 确保 mobileLocales 正确覆盖基础语言包
const resources = {
  'zh-CN': {
    translation: deepMerge({}, zhCN || {}, mobileLocales['zh-CN'] || {}),
  },
  'en-US': {
    translation: deepMerge({}, enUS || {}, mobileLocales['en-US'] || {}),
  },
};

// 确保 i18n 在使用前完全初始化
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'zh-CN',
    fallbackLng: 'zh-CN',
    debug: false,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    compatibilityJSON: 'v4',
    keySeparator: '.', // 使用点号作为嵌套 key 的分隔符
    nsSeparator: ':', // 使用冒号作为命名空间的分隔符
    // 确保缺失的翻译键返回 key 本身，而不是 undefined
    returnEmptyString: false,
    returnNull: false,
    // 当找不到翻译时，返回原始键（不转换大小写）
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key}`);
      return key;
    },
  });
}

export default i18n;

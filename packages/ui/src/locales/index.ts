// 应用级语言包
import appZhCN from './app/zh-CN.json';
import appEnUS from './app/en-US.json';
// 通用语言包
import commonZhCN from './common/zh-CN.json';
import commonEnUS from './common/en-US.json';
// 组件语言包
import githubConfigLocales from '../components/github-config/locales';
import giteeConfigLocales from '../components/gitee-config/locales';
import upyunConfigLocales from '../components/upyun-config/locales';
import keyboardHelpLocales from '../components/keyboard-help/locales';
import imageBrowserLocales from '../components/image-browser/locales';
import imageUploadLocales from '../components/image-upload/locales';
import imageSearchLocales from '../components/image-search/locales';
import languageSwitcherLocales from '../components/language-switcher/locales';

/**
 * 深层合并对象
 * @param target 目标对象
 * @param sources 要合并的源对象列表
 * @returns 合并后的对象
 */
export const deepMerge = (
  target: Record<string, any>,
  ...sources: Record<string, any>[]
): Record<string, any> => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * 判断是否为对象
 */
const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// 汇聚所有语言包（使用深层合并）
export const appLocales = {
  'zh-CN': deepMerge(
    {},
    appZhCN,
    commonZhCN,
    githubConfigLocales['zh-CN'],
    giteeConfigLocales['zh-CN'],
    upyunConfigLocales['zh-CN'],
    keyboardHelpLocales['zh-CN'],
    imageBrowserLocales['zh-CN'],
    imageUploadLocales['zh-CN'],
    imageSearchLocales['zh-CN'],
    languageSwitcherLocales['zh-CN']
  ),
  'en-US': deepMerge(
    {},
    appEnUS,
    commonEnUS,
    githubConfigLocales['en-US'],
    giteeConfigLocales['en-US'],
    upyunConfigLocales['en-US'],
    keyboardHelpLocales['en-US'],
    imageBrowserLocales['en-US'],
    imageUploadLocales['en-US'],
    imageSearchLocales['en-US'],
    languageSwitcherLocales['en-US']
  ),
};

// 导出应用级语言包（不含组件语言包）
export const appOnlyLocales = {
  'zh-CN': deepMerge({}, appZhCN, commonZhCN),
  'en-US': deepMerge({}, appEnUS, commonEnUS),
};

/**
 * 默认中文翻译函数
 * 当组件没有传入翻译函数时，使用此函数提供中文翻译
 * @param key 翻译键，支持嵌套路径，如 'github.config.title'
 * @returns 翻译后的文本，如果找不到则返回key本身
 */
export const defaultTranslate = (
  key: string,
  langs?: Record<string, any>
): string => {
  const keys = key.split('.');
  let value: any = langs || appLocales['zh-CN'];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
};

// 兼容性导出：导出为 zhCN 和 enUS
export const zhCN = appLocales['zh-CN'];
export const enUS = appLocales['en-US'];

export default appLocales;

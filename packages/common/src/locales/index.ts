// 应用级语言包（已包含 common 通用词汇）
import appZhCN from './app/zh-CN.json';
import appEnUS from './app/en-US.json';
// 组件语言包
import githubConfigLocales from '../components/github-config/locales';
import giteeConfigLocales from '../components/gitee-config/locales';
import keyboardHelpLocales from '../components/keyboard-help/locales';
import versionInfoLocales from '../components/version-info/locales';
import imageBrowserLocales from '../components/image-browser/locales';
import imageUploadLocales from '../components/image-upload/locales';
import imageSearchLocales from '../components/image-search/locales';
import languageSwitcherLocales from '../components/language-switcher/locales';
import slideShowLocales from '../components/slide-show/locales';
import browseModeSwitcherLocales from '../components/browse-mode-switcher/locales';
import photoWallLocales from '../components/photo-wall/locales';
import gallery3dLocales from '../components/gallery-3d/locales';
import sidebarLocales from '../components/sidebar/locales';
import headerLocales from '../components/header/locales';
import headerSearchLocales from '../components/header-search/locales';
import emptyStateLocales from '../components/empty-state/locales';
import demoLocales from '../components/demo/locales';
import devtoolsLocales from '../components/devtools/locales';

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
    githubConfigLocales['zh-CN'],
    giteeConfigLocales['zh-CN'],
    keyboardHelpLocales['zh-CN'],
    versionInfoLocales['zh-CN'],
    imageBrowserLocales['zh-CN'],
    imageUploadLocales['zh-CN'],
    imageSearchLocales['zh-CN'],
    languageSwitcherLocales['zh-CN'],
    slideShowLocales['zh-CN'],
    browseModeSwitcherLocales['zh-CN'],
    photoWallLocales['zh-CN'],
    gallery3dLocales['zh-CN'],
    sidebarLocales['zh-CN'],
    headerLocales['zh-CN'],
    headerSearchLocales['zh-CN'],
    emptyStateLocales['zh-CN'],
    demoLocales['zh-CN'],
    devtoolsLocales['zh-CN'],
  ),
  'en-US': deepMerge(
    {},
    appEnUS,
    githubConfigLocales['en-US'],
    giteeConfigLocales['en-US'],
    keyboardHelpLocales['en-US'],
    versionInfoLocales['en-US'],
    imageBrowserLocales['en-US'],
    imageUploadLocales['en-US'],
    imageSearchLocales['en-US'],
    languageSwitcherLocales['en-US'],
    slideShowLocales['en-US'],
    browseModeSwitcherLocales['en-US'],
    photoWallLocales['en-US'],
    gallery3dLocales['en-US'],
    sidebarLocales['en-US'],
    headerLocales['en-US'],
    headerSearchLocales['en-US'],
    emptyStateLocales['en-US'],
    demoLocales['en-US'],
    devtoolsLocales['en-US'],
  ),
};

// 导出应用级语言包（不含组件语言包）
export const appOnlyLocales = {
  'zh-CN': deepMerge({}, appZhCN),
  'en-US': deepMerge({}, appEnUS),
};

/**
 * 默认中文翻译函数
 * 当组件没有传入翻译函数时，使用此函数提供中文翻译
 * @param key 翻译键，支持嵌套路径，如 'github.config.title'
 * @returns 翻译后的文本，如果找不到则返回key本身
 */
export const defaultTranslate = (
  key: string,
  langs?: Record<string, any>,
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

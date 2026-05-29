import {
  deepMerge,
  appOnlyLocales,
  defaultTranslate,
} from '@pixuli/core/locales';
// 组件语言包（仍留在 common，待 REF-202/203 迁入 ui）
import imagePreviewModalLocales from '../components/image/image-preview-modal/locales';
import imageBrowserLocales from '../components/image/image-browser/locales';
import imageUploadLocales from '../components/image/image-upload/locales';
import sidebarLocales from '../components/layout/sidebar/locales';
import headerLocales from '../components/layout/header/locales';
import emptyStateLocales from '../components/layout/empty-state/locales';
import githubConfigLocales from '../components/config/github-config/locales';
import giteeConfigLocales from '../components/config/gitee-config/locales';
import searchLocales from '../components/ui/search/locales';
import keyboardHelpLocales from '../components/ui/keyboard-help/locales';
import languageSwitcherLocales from '../components/ui/language-switcher/locales';
import versionInfoLocales from '../components/features/version-info/locales';
import demoLocales from '../components/dev/demo/locales';

export { deepMerge, appOnlyLocales };

export const appLocales = {
  'zh-CN': deepMerge(
    {},
    appOnlyLocales['zh-CN'],
    githubConfigLocales['zh-CN'],
    giteeConfigLocales['zh-CN'],
    keyboardHelpLocales['zh-CN'],
    versionInfoLocales['zh-CN'],
    imagePreviewModalLocales['zh-CN'],
    imageBrowserLocales['zh-CN'],
    imageUploadLocales['zh-CN'],
    languageSwitcherLocales['zh-CN'],
    sidebarLocales['zh-CN'],
    headerLocales['zh-CN'],
    searchLocales['zh-CN'],
    emptyStateLocales['zh-CN'],
    demoLocales['zh-CN'],
  ),
  'en-US': deepMerge(
    {},
    appOnlyLocales['en-US'],
    githubConfigLocales['en-US'],
    giteeConfigLocales['en-US'],
    keyboardHelpLocales['en-US'],
    versionInfoLocales['en-US'],
    imagePreviewModalLocales['en-US'],
    imageBrowserLocales['en-US'],
    imageUploadLocales['en-US'],
    languageSwitcherLocales['en-US'],
    sidebarLocales['en-US'],
    headerLocales['en-US'],
    searchLocales['en-US'],
    emptyStateLocales['en-US'],
    demoLocales['en-US'],
  ),
};

export const defaultTranslate = (
  key: string,
  langs?: Record<string, unknown>,
): string => {
  const keys = key.split('.');
  let value: unknown = langs || appLocales['zh-CN'];
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  return (typeof value === 'string' ? value : undefined) || key;
};

export const zhCN = appLocales['zh-CN'];
export const enUS = appLocales['en-US'];

export default appLocales;

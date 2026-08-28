import { deepMerge } from '@pixuli/core/locales';

import zhAccess from './zh-CN/access.json';
import zhApp from './zh-CN/app.json';
import zhBrand from './zh-CN/brand.json';
import zhCommon from './zh-CN/common.json';
import zhCompressPage from './zh-CN/compressPage.json';
import zhConvertPage from './zh-CN/convertPage.json';
import zhEmptyState from './zh-CN/emptyState.json';
import zhErrors from './zh-CN/errors.json';
import zhGitee from './zh-CN/gitee.json';
import zhGithub from './zh-CN/github.json';
import zhHeader from './zh-CN/header.json';
import zhImage from './zh-CN/image.json';
import zhKeyboard from './zh-CN/keyboard.json';
import zhLanguage from './zh-CN/language.json';
import zhMessages from './zh-CN/messages.json';
import zhNavigation from './zh-CN/navigation.json';
import zhOperationLog from './zh-CN/operationLog.json';
import zhPwa from './zh-CN/pwa.json';
import zhSearch from './zh-CN/search.json';
import zhSettings from './zh-CN/settings.json';
import zhSidebar from './zh-CN/sidebar.json';
import zhSourceManager from './zh-CN/sourceManager.json';
import zhStorage from './zh-CN/storage.json';
import zhVersion from './zh-CN/version.json';
import zhWorkspace from './zh-CN/workspace.json';

import enAccess from './en-US/access.json';
import enApp from './en-US/app.json';
import enBrand from './en-US/brand.json';
import enCommon from './en-US/common.json';
import enCompressPage from './en-US/compressPage.json';
import enConvertPage from './en-US/convertPage.json';
import enEmptyState from './en-US/emptyState.json';
import enErrors from './en-US/errors.json';
import enGitee from './en-US/gitee.json';
import enGithub from './en-US/github.json';
import enHeader from './en-US/header.json';
import enImage from './en-US/image.json';
import enKeyboard from './en-US/keyboard.json';
import enLanguage from './en-US/language.json';
import enMessages from './en-US/messages.json';
import enNavigation from './en-US/navigation.json';
import enOperationLog from './en-US/operationLog.json';
import enPwa from './en-US/pwa.json';
import enSearch from './en-US/search.json';
import enSettings from './en-US/settings.json';
import enSidebar from './en-US/sidebar.json';
import enSourceManager from './en-US/sourceManager.json';
import enStorage from './en-US/storage.json';
import enVersion from './en-US/version.json';
import enWorkspace from './en-US/workspace.json';

/**
 * 应用文案 SSOT：按顶层 key 拆分的 domain JSON。
 * operationLog 为历史扁平根 key（供 OperationLogModal 直读），须最后 merge。
 */
const zhParts = [
  zhCommon,
  zhBrand,
  zhApp,
  zhNavigation,
  zhStorage,
  zhMessages,
  zhErrors,
  zhGithub,
  zhGitee,
  zhImage,
  zhSidebar,
  zhHeader,
  zhEmptyState,
  zhSearch,
  zhKeyboard,
  zhLanguage,
  zhVersion,
  zhSourceManager,
  zhWorkspace,
  zhAccess,
  zhSettings,
  zhCompressPage,
  zhConvertPage,
  zhPwa,
  zhOperationLog,
] as Record<string, unknown>[];

const enParts = [
  enCommon,
  enBrand,
  enApp,
  enNavigation,
  enStorage,
  enMessages,
  enErrors,
  enGithub,
  enGitee,
  enImage,
  enSidebar,
  enHeader,
  enEmptyState,
  enSearch,
  enKeyboard,
  enLanguage,
  enVersion,
  enSourceManager,
  enWorkspace,
  enAccess,
  enSettings,
  enCompressPage,
  enConvertPage,
  enPwa,
  enOperationLog,
] as Record<string, unknown>[];

export const appLocales = {
  'zh-CN': deepMerge({}, ...zhParts),
  'en-US': deepMerge({}, ...enParts),
};

export const zhCN = appLocales['zh-CN'];
export const enUS = appLocales['en-US'];

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

/** OperationLogModal 直读用（扁平根 key，行为与旧 features/operation-log/locales 一致） */
export const operationLogLocales = {
  'zh-CN': zhOperationLog,
  'en-US': enOperationLog,
};

export const pwaLocales = {
  'zh-CN': zhPwa,
  'en-US': enPwa,
};

export { deepMerge };
export default appLocales;

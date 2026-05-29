import appZhCN from './app/zh-CN.json';
import appEnUS from './app/en-US.json';

export const deepMerge = (
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>,
        );
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
};

export const appOnlyLocales = {
  'zh-CN': deepMerge({}, appZhCN),
  'en-US': deepMerge({}, appEnUS),
};

export const defaultTranslate = (
  key: string,
  langs?: Record<string, unknown>,
): string => {
  const keys = key.split('.');
  let value: unknown = langs || appOnlyLocales['zh-CN'];
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  return (typeof value === 'string' ? value : undefined) || key;
};

export const zhCN = appOnlyLocales['zh-CN'];
export const enUS = appOnlyLocales['en-US'];

export default appOnlyLocales;

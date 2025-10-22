import zhCN from './zh-CN.json';

/**
 * 默认中文翻译函数
 * 当组件没有传入翻译函数时，使用此函数提供中文翻译
 * @param key 翻译键，支持嵌套路径，如 'github.config.title'
 * @returns 翻译后的文本，如果找不到则返回key本身
 */
export const defaultTranslate = (key: string): string => {
  const keys = key.split('.');
  let value: any = zhCN;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
};

export default defaultTranslate;

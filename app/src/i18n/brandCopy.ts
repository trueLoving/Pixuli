import enBrand from './locales/en-US/brand.json';
import zhBrand from './locales/zh-CN/brand.json';

export type BrandLocale = 'zh-CN' | 'en-US';
export type BrandCopy = (typeof zhBrand)['brand'];

const brands: Record<BrandLocale, BrandCopy> = {
  'zh-CN': zhBrand.brand,
  'en-US': enBrand.brand,
};

const LOCALE_STORAGE_KEY = 'i18nextLng';

/** React 挂载前解析语言（与 i18next localStorage 键一致） */
export function resolveBootLocale(): BrandLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored?.startsWith('en')) return 'en-US';
    if (stored?.startsWith('zh')) return 'zh-CN';
  } catch {
    // localStorage 不可用
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav.toLowerCase().startsWith('en')) return 'en-US';
  return 'zh-CN';
}

export function getBrandCopy(locale?: BrandLocale): BrandCopy {
  return brands[locale ?? resolveBootLocale()];
}

/** Electron 主进程：按系统 locale 选品牌文案 */
export function getBrandCopyForElectronLocale(
  electronLocale: string,
): BrandCopy {
  return electronLocale.toLowerCase().startsWith('zh')
    ? brands['zh-CN']
    : brands['en-US'];
}

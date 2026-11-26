/**
 * 薄 UI 层：primitives、hooks、反馈与快捷键。
 * 复合业务 UI 在 `@/features/*`；侧栏在 `@/layouts/sidebar`；
 * 库内图片裁剪/转换在 `@pixuli/kind-image`（kind.process）。
 */
export * from './hooks';

export { Search } from './primitives/search';
export type { SearchProps, SearchVariant } from './primitives/search';
export * from './primitives/toaster';
export * from './primitives/fullscreen-loading';
export * from './primitives/content-feedback';

export { BrandPixelMark } from './brand/BrandPixelMark';
export type { BrandPixelMarkProps } from './brand/BrandPixelMark';

export * from './feedback/toast';
export {
  KeyboardShortcutManager,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from './utils/keyboardShortcuts';
export type {
  KeyboardShortcut,
  KeyboardShortcutCategory,
} from './utils/keyboardShortcuts';

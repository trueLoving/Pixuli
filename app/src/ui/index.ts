/**
 * 薄 UI 层：primitives、hooks、反馈与快捷键。
 * 复合业务 UI 在 `@/features/*`；侧栏在 `@/layouts/sidebar`；
 * 压缩/转换与 imageProcessor 在 `@/features/tools`。
 */
export * from './hooks';

export { Search } from './primitives/search';
export type { SearchProps, SearchVariant } from './primitives/search';
export * from './primitives/toaster';
export * from './primitives/refresh-button';
export * from './primitives/keyboard-help';
export * from './primitives/language-switcher';
export * from './primitives/fullscreen-loading';
export * from './primitives/content-feedback';
export * from './primitives/action-button';

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

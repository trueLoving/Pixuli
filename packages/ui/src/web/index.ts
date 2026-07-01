/**
 * @pixuli/ui — Web / Desktop 入口
 */
export * from '../hooks';

// 图片
export * from '../image/image-preview-modal/web';
export * from '../image/image-browser/web';
export * from '../image/image-actions/web';
export * from '../image/image-upload/web';

// 布局
export * from '../layout/sidebar/web';
export * from '../layout/header/web';
export * from '../layout/empty-state/web';

// 配置
export * from '../config/github-config/web';
export * from '../config/gitee-config/web';

// 基础 UI
export { Search } from '../primitives/search/web';
export type { SearchProps, SearchVariant } from '../primitives/search/web';
export * from '../primitives/toaster/web';
export * from '../primitives/refresh-button/web';
export * from '../primitives/upload-button/web';
export * from '../primitives/keyboard-help/web';
export * from '../primitives/language-switcher/web';
export * from '../primitives/fullscreen-loading/web';
export * from '../primitives/content-feedback/web';
export * from '../primitives/action-button/web';

// 功能
export * from '../features/version-info/web';

// 开发
export * from '../dev/demo/web';

// Web 图片处理（Canvas）
export * from '../services/imageProcessor';

// 反馈与工具（Web）
export * from '../feedback/toast';
export {
  KeyboardShortcutManager,
  keyboardManager,
  COMMON_SHORTCUTS,
  SHORTCUT_CATEGORIES,
} from '../utils/keyboardShortcuts';
export type {
  KeyboardShortcut,
  KeyboardShortcutCategory,
} from '../utils/keyboardShortcuts';

// 语言包
export * from '../locales';

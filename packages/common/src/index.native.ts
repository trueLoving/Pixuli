/**
 * @fileoverview React Native 平台专用导出文件
 * @deprecated 请改用 `@pixuli/core`、`@pixuli/ui/native` 及 `pixuli-common/services/native`
 *
 * Web/Desktop 应用请使用 `index.ts`（同样已 deprecated）。
 */

// ==================== 类型导出（@pixuli/core） ====================
export * from '@pixuli/core/types';

// ==================== Services 导出（不含 webImageProcessor，见 REF-205） ====================
export * from './services/index.native';

// ==================== React Native 专用组件（@pixuli/ui/native） ====================
export * from '@pixuli/ui/native';

// ==================== 语言包导出 ====================
export * from './locales';

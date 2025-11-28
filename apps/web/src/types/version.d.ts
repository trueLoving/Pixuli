// 版本信息类型定义 - 从 packages/common 导入
import type { VersionInfo } from '@packages/common/src';

// 全局变量声明
declare global {
  const __VERSION_INFO__: VersionInfo;
}

export {};

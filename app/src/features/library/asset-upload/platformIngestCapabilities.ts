import type { KindIngestSource } from '@pixuli/core/kinds';
import { isNativeMobile } from '@/platforms/platform';

/**
 * 当前平台实际具备的采集适配器能力（App 侧，不进 Kind 包）。
 * 与 Kind `preferredSources` 取交后才展示入口。
 */
export function getPlatformIngestCapabilities(): KindIngestSource[] {
  if (isNativeMobile()) {
    return ['file', 'gallery', 'camera'];
  }
  // Web / Desktop：文件选择与拖放都落在 file
  return ['file'];
}

/** 平台能力 ∩ 插件声明 */
export function resolveAvailableIngestSources(
  preferredFromKinds: readonly KindIngestSource[],
): KindIngestSource[] {
  const platform = new Set(getPlatformIngestCapabilities());
  return preferredFromKinds.filter(source => platform.has(source));
}

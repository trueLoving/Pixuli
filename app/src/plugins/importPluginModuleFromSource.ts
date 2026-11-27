/**
 * 将插件入口源码以 ESM 动态 import（优先 Blob URL；无 createObjectURL 时用 data URL）。
 * Mobile WebView 无法像 Desktop 一样用自定义协议直接 import 沙箱文件，故读文本后加载。
 * 约定：单文件入口（与 Desktop fixture 一致），不依赖相对路径子模块。
 */
function toModuleUrl(source: string): { url: string; revoke?: () => void } {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([source], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    return {
      url,
      revoke: () => URL.revokeObjectURL(url),
    };
  }
  return {
    url: `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`,
  };
}

export async function importPluginModuleFromSource(
  source: string,
): Promise<unknown> {
  const { url, revoke } = toModuleUrl(source);
  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    if (revoke) {
      // 延后 revoke，避免部分引擎在 link 阶段仍引用 URL
      setTimeout(revoke, 60_000);
    }
  }
}

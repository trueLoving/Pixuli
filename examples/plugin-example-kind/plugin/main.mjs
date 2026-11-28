/**
 * Pixuli 外部 Kind 示例入口（Desktop + Mobile 共用同一文件）。
 *
 * 约束（与 Loader PoC 对齐）：
 * - 单文件 ESM；导出 createRuntimePlugin
 * - 零依赖、无相对路径 import（Mobile 以 Blob 源码加载）
 * - 不判断 Capacitor / Electron；平台能力由 App 适配器提供
 */

const KIND_MANIFEST = {
  id: 'ext.example-kind',
  name: 'Example Kind',
  version: '0.1.0',
  kind: 'other',
  ingest: {
    accept: {
      'application/octet-stream': ['.example'],
      'text/plain': ['.example'],
    },
    preferredSources: ['file'],
  },
  capabilities: {
    preview: false,
    thumbnail: false,
    actions: [],
  },
};

function matchExample(input) {
  const name = String(input?.name ?? '');
  return /\.example$/i.test(name);
}

export function createRuntimePlugin() {
  let kinds = null;

  return {
    manifest: {
      id: KIND_MANIFEST.id,
      name: KIND_MANIFEST.name,
      version: KIND_MANIFEST.version,
      origin: 'external',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      api.kinds.register(KIND_MANIFEST, () => ({
        manifest: KIND_MANIFEST,
        match: matchExample,
      }));
    },
    onunload() {
      kinds?.unregister(KIND_MANIFEST.id);
      kinds = null;
    },
  };
}

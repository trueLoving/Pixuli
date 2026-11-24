import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import type { RuntimePlugin } from '@pixuli/core/plugin-runtime';
import {
  pixuliGiteeManifest,
  registerPixuliGiteeProvider,
} from '@/storage/registerGiteeProvider';

/** Pixuli 特化 Gitee（无 Host 代理）；适配器留在 app */
export function createPixuliGiteeRuntimePlugin(): RuntimePlugin {
  let storage: StoragePluginRegistry | null = null;
  return {
    manifest: {
      id: pixuliGiteeManifest.id,
      name: pixuliGiteeManifest.name,
      version: pixuliGiteeManifest.version,
      origin: 'builtin',
      capabilities: ['storage'],
    },
    onload(api) {
      storage = api.storage;
      registerPixuliGiteeProvider(api.storage);
    },
    onunload() {
      storage?.unregister(pixuliGiteeManifest.id);
      storage = null;
    },
  };
}

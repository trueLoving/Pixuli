import type { StoragePluginManifest } from '@pixuli/core/plugins';
import { githubManifest } from '@pixuli/provider-github/manifest';
import { giteeManifest } from '@pixuli/provider-gitee/manifest';

/** Vite dev Host bootstrap：仅 manifest，不加载 Provider 实现 */
export const storageHostManifests: StoragePluginManifest[] = [
  githubManifest,
  giteeManifest,
];

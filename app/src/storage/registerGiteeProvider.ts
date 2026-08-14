import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type { StoragePluginRegistry } from '@pixuli/core/plugins';
import { GiteeStorageProvider } from '@pixuli/provider-gitee';
import { giteeManifest } from '@pixuli/provider-gitee/manifest';

/** Pixuli 应用内 Gitee 插件：无 Host 图片代理，直连 raw URL（本地工作区 + 远端同步） */
export const pixuliGiteeManifest =
  giteeManifest satisfies StoragePluginManifest;

export function registerPixuliGiteeProvider(
  registry: StoragePluginRegistry,
): void {
  registry.register(pixuliGiteeManifest, ctx => new GiteeStorageProvider(ctx));
}

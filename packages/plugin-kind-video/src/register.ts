import type { KindPluginRegistry } from '@pixuli/core/kinds';
import { createVideoKindHandler } from './VideoKindHandler';
import { videoKindManifest } from './manifest';

export function registerVideoKind(registry: KindPluginRegistry): void {
  registry.register(videoKindManifest, createVideoKindHandler);
}

export { videoKindManifest };

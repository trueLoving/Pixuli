import type { KindPluginRegistry } from '@pixuli/core/kinds';
import { createImageKindHandler } from './ImageKindHandler';
import { imageKindManifest } from './manifest';

export function registerImageKind(registry: KindPluginRegistry): void {
  registry.register(imageKindManifest, createImageKindHandler);
}

export { imageKindManifest };

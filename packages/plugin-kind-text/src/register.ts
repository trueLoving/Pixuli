import type { KindPluginRegistry } from '@pixuli/core/kinds';
import { createTextKindHandler } from './TextKindHandler';
import { textKindManifest } from './manifest';

export function registerTextKind(registry: KindPluginRegistry): void {
  registry.register(textKindManifest, createTextKindHandler);
}

export { textKindManifest };

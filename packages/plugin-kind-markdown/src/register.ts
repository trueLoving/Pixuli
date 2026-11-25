import type { KindPluginRegistry } from '@pixuli/core/kinds';
import { createMarkdownKindHandler } from './MarkdownKindHandler';
import { markdownKindManifest } from './manifest';

export function registerMarkdownKind(registry: KindPluginRegistry): void {
  registry.register(markdownKindManifest, createMarkdownKindHandler);
}

export { markdownKindManifest };

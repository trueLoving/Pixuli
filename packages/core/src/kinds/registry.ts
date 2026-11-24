import type {
  KindHandler,
  KindHandlerFactory,
  KindMatchInput,
  KindPluginManifest,
  KindPluginRegistry,
} from './types';
import { KindPluginAlreadyRegisteredError } from './types';

export class DefaultKindPluginRegistry implements KindPluginRegistry {
  private readonly factories = new Map<string, KindHandlerFactory>();
  private readonly manifests = new Map<string, KindPluginManifest>();
  private readonly order: string[] = [];

  register(manifest: KindPluginManifest, factory: KindHandlerFactory): void {
    if (this.factories.has(manifest.id)) {
      throw new KindPluginAlreadyRegisteredError(manifest.id);
    }
    this.manifests.set(manifest.id, manifest);
    this.factories.set(manifest.id, factory);
    this.order.push(manifest.id);
  }

  unregister(id: string): boolean {
    const had = this.factories.has(id);
    this.factories.delete(id);
    this.manifests.delete(id);
    const idx = this.order.indexOf(id);
    if (idx >= 0) this.order.splice(idx, 1);
    return had;
  }

  get(id: string): KindHandler | undefined {
    const factory = this.factories.get(id);
    return factory ? factory() : undefined;
  }

  getManifest(id: string): KindPluginManifest | undefined {
    return this.manifests.get(id);
  }

  listManifests(): KindPluginManifest[] {
    return this.order
      .map(id => this.manifests.get(id))
      .filter((m): m is KindPluginManifest => m != null);
  }

  matchHandler(input: KindMatchInput): KindHandler | undefined {
    for (const id of this.order) {
      const factory = this.factories.get(id);
      if (!factory) continue;
      const handler = factory();
      if (handler.match(input)) return handler;
    }
    return undefined;
  }
}

export function createKindPluginRegistry(): KindPluginRegistry {
  return new DefaultKindPluginRegistry();
}

export { KindPluginAlreadyRegisteredError } from './types';

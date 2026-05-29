import type {
  ProviderContext,
  StoragePluginManifest,
  StoragePluginRegistry,
  StorageProvider,
  StorageProviderFactory,
} from './types';

export class DefaultStoragePluginRegistry implements StoragePluginRegistry {
  private readonly factories = new Map<string, StorageProviderFactory>();
  private readonly manifests = new Map<string, StoragePluginManifest>();

  register(
    manifest: StoragePluginManifest,
    factory: StorageProviderFactory,
  ): void {
    this.manifests.set(manifest.id, manifest);
    this.factories.set(manifest.id, factory);
  }

  get(id: string): StorageProviderFactory | undefined {
    return this.factories.get(id);
  }

  listManifests(): StoragePluginManifest[] {
    return [...this.manifests.values()];
  }

  create(id: string, ctx: ProviderContext): StorageProvider {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Storage plugin not registered: ${id}`);
    }
    return factory(ctx);
  }
}

export function createStoragePluginRegistry(): StoragePluginRegistry {
  return new DefaultStoragePluginRegistry();
}

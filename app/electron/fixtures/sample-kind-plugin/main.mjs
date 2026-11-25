/** Fixture external Kind plugin — zero deps; host injects registries via onload. */

const MANIFEST = {
  id: 'ext.sample-kind',
  name: 'Sample Kind',
  version: '0.1.0',
  kind: 'other',
  capabilities: {
    preview: false,
    thumbnail: false,
    actions: [],
  },
};

export function createRuntimePlugin() {
  let kinds = null;
  return {
    manifest: {
      id: MANIFEST.id,
      name: MANIFEST.name,
      version: MANIFEST.version,
      origin: 'external',
      capabilities: ['kind'],
    },
    onload(api) {
      kinds = api.kinds;
      api.kinds.register(MANIFEST, () => ({
        manifest: MANIFEST,
        match(input) {
          return /\.sample$/i.test(input.name ?? '');
        },
      }));
    },
    onunload() {
      kinds?.unregister(MANIFEST.id);
      kinds = null;
    },
  };
}

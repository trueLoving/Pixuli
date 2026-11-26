import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { registerImageKind, imageKindManifest } from '../register';

describe('registerImageKind', () => {
  it('registers matchable image handler', () => {
    const registry = createKindPluginRegistry();
    registerImageKind(registry);
    expect(registry.getManifest(imageKindManifest.id)?.kind).toBe('image');
    expect(
      registry.matchHandler({ name: 'a.jpg', mimeType: 'image/jpeg' })?.manifest
        .id,
    ).toBe('kind.image');
  });
});

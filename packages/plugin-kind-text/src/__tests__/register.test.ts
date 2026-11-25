import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { registerTextKind, textKindManifest } from '../register';

describe('registerTextKind', () => {
  it('registers handler that matches plain text files', () => {
    const reg = createKindPluginRegistry();
    registerTextKind(reg);
    expect(reg.getManifest(textKindManifest.id)?.id).toBe('kind.text');
    expect(reg.matchHandler({ name: 'notes.txt' })?.manifest.kind).toBe('text');
    expect(
      reg.matchHandler({ name: 'x.bin', mimeType: 'text/plain' })?.manifest
        .kind,
    ).toBe('text');
  });
});

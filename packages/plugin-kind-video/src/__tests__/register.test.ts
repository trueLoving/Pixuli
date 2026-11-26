import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { registerVideoKind, videoKindManifest } from '../register';

describe('registerVideoKind', () => {
  it('registers handler that matches video files', () => {
    const reg = createKindPluginRegistry();
    registerVideoKind(reg);
    expect(reg.getManifest(videoKindManifest.id)?.id).toBe('kind.video');
    expect(reg.matchHandler({ name: 'clip.mp4' })?.manifest.kind).toBe('video');
    expect(
      reg.matchHandler({ name: 'x.bin', mimeType: 'video/webm' })?.manifest
        .kind,
    ).toBe('video');
  });
});

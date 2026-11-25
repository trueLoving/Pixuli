import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { registerMarkdownKind, markdownKindManifest } from '../register';

describe('registerMarkdownKind', () => {
  it('registers handler that matches markdown files', () => {
    const reg = createKindPluginRegistry();
    registerMarkdownKind(reg);
    expect(reg.getManifest(markdownKindManifest.id)?.id).toBe('kind.markdown');
    expect(reg.matchHandler({ name: 'readme.md' })?.manifest.kind).toBe(
      'markdown',
    );
    expect(
      reg.matchHandler({ name: 'x.bin', mimeType: 'text/markdown' })?.manifest
        .kind,
    ).toBe('markdown');
  });
});

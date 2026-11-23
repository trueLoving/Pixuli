import { describe, expect, it } from 'vitest';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { registerPdfKind, pdfKindManifest } from '../register';

describe('registerPdfKind', () => {
  it('registers and matches pdf files', () => {
    const reg = createKindPluginRegistry();
    registerPdfKind(reg);
    expect(reg.getManifest(pdfKindManifest.id)?.kind).toBe('pdf');
    expect(reg.matchHandler({ name: 'notes.PDF' })?.manifest.id).toBe(
      'kind.pdf',
    );
    expect(reg.matchHandler({ name: 'a.txt' })).toBeUndefined();
  });
});

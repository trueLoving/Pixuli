import { describe, expect, it } from 'vitest';
import {
  createKindPluginRegistry,
  KindPluginAlreadyRegisteredError,
} from '../index';
import type { KindHandler, KindPluginManifest } from '../types';

const pdfManifest: KindPluginManifest = {
  id: 'kind.pdf',
  name: 'PDF',
  version: '0.1.0',
  kind: 'pdf',
  capabilities: { preview: true, thumbnail: true, actions: [] },
};

function makePdfHandler(): KindHandler {
  return {
    manifest: pdfManifest,
    match: ({ name, mimeType }) =>
      name.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf',
  };
}

describe('KindPluginRegistry', () => {
  it('registers and matches by extension', () => {
    const reg = createKindPluginRegistry();
    reg.register(pdfManifest, makePdfHandler);
    expect(reg.matchHandler({ name: 'a.PDF' })?.manifest.id).toBe('kind.pdf');
    expect(reg.matchHandler({ name: 'a.txt' })).toBeUndefined();
  });

  it('rejects duplicate id', () => {
    const reg = createKindPluginRegistry();
    reg.register(pdfManifest, makePdfHandler);
    expect(() => reg.register(pdfManifest, makePdfHandler)).toThrow(
      KindPluginAlreadyRegisteredError,
    );
  });
});

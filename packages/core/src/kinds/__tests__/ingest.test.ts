import { describe, expect, it } from 'vitest';
import {
  collectPreferredIngestSources,
  formatIngestAcceptTypesLabel,
  ingestAcceptToInputAttr,
  mergeKindIngestAccept,
} from '../ingest';
import type { KindPluginManifest } from '../types';

const image: KindPluginManifest = {
  id: 'kind.image',
  name: 'Image',
  version: '0.1.0',
  kind: 'image',
  ingest: {
    accept: { 'image/*': ['.jpg', '.png'] },
    preferredSources: ['file', 'gallery', 'camera'],
  },
  capabilities: { preview: true, thumbnail: true, actions: [] },
};

const pdf: KindPluginManifest = {
  id: 'kind.pdf',
  name: 'PDF',
  version: '0.1.0',
  kind: 'pdf',
  ingest: {
    accept: { 'application/pdf': ['.pdf'] },
  },
  capabilities: { preview: true, thumbnail: true, actions: [] },
};

const previewOnly: KindPluginManifest = {
  id: 'kind.orphan',
  name: 'Orphan',
  version: '0.1.0',
  kind: 'other',
  capabilities: { preview: true, thumbnail: false, actions: [] },
};

describe('kind ingest helpers', () => {
  it('mergeKindIngestAccept unions mime maps', () => {
    expect(mergeKindIngestAccept([image, pdf])).toEqual({
      'image/*': ['.jpg', '.png'],
      'application/pdf': ['.pdf'],
    });
  });

  it('mergeKindIngestAccept returns undefined without ingest', () => {
    expect(mergeKindIngestAccept([previewOnly])).toBeUndefined();
  });

  it('collectPreferredIngestSources unions and always includes file', () => {
    expect(collectPreferredIngestSources([image, pdf]).sort()).toEqual([
      'camera',
      'file',
      'gallery',
    ]);
  });

  it('ingestAcceptToInputAttr flattens mime and extensions', () => {
    expect(
      ingestAcceptToInputAttr({
        'image/*': ['.jpg'],
        'application/pdf': ['.pdf'],
      }),
    ).toBe('image/*,.jpg,application/pdf,.pdf');
  });

  it('formatIngestAcceptTypesLabel lists unique uppercase extensions', () => {
    expect(
      formatIngestAcceptTypesLabel({
        'image/*': ['.jpg', '.png', '.JPG'],
        'application/pdf': ['.pdf'],
      }),
    ).toBe('JPG · PDF · PNG');
  });
});

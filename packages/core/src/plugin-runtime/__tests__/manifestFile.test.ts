import { describe, expect, it } from 'vitest';
import { parseDiskPluginManifest } from '../manifestFile';

describe('parseDiskPluginManifest', () => {
  it('parses a valid manifest', () => {
    expect(
      parseDiskPluginManifest({
        id: 'ext.sample',
        name: 'Sample',
        version: '0.1.0',
        main: 'main.mjs',
        capabilities: ['kind'],
        minAppVersion: '1.0.0',
      }),
    ).toEqual({
      id: 'ext.sample',
      name: 'Sample',
      version: '0.1.0',
      main: 'main.mjs',
      capabilities: ['kind'],
      minAppVersion: '1.0.0',
    });
  });

  it('rejects invalid shapes', () => {
    expect(() => parseDiskPluginManifest(null)).toThrow(/object/);
    expect(() =>
      parseDiskPluginManifest({
        id: '',
        name: 'A',
        version: '1',
        main: 'main.mjs',
        capabilities: ['kind'],
      }),
    ).toThrow(/id/);
    expect(() =>
      parseDiskPluginManifest({
        id: 'x',
        name: 'A',
        version: '1',
        main: 'main.mjs',
        capabilities: ['network'],
      }),
    ).toThrow(/capabilities/);
  });
});

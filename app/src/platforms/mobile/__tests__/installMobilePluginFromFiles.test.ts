import { describe, expect, it } from 'vitest';
import { mapDirectoryFilesToPluginPaths } from '../installMobilePluginFromFiles';

function fileWithPath(name: string, relative: string): File {
  const file = new File(['{}'], name, { type: 'application/json' });
  Object.defineProperty(file, 'webkitRelativePath', {
    value: relative,
  });
  return file;
}

describe('mapDirectoryFilesToPluginPaths', () => {
  it('strips shared top-level folder', () => {
    const map = mapDirectoryFilesToPluginPaths([
      fileWithPath('manifest.json', 'sample/manifest.json'),
      fileWithPath('main.mjs', 'sample/main.mjs'),
    ]);
    expect([...map.keys()].sort()).toEqual(['main.mjs', 'manifest.json']);
  });

  it('keeps paths when already flat', () => {
    const map = mapDirectoryFilesToPluginPaths([
      fileWithPath('manifest.json', 'manifest.json'),
    ]);
    expect(map.has('manifest.json')).toBe(true);
  });
});

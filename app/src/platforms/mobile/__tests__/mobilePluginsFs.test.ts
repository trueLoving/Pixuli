import { beforeEach, describe, expect, it, vi } from 'vitest';

const mkdir = vi.fn();
const readdir = vi.fn();
const stat = vi.fn();
const readFile = vi.fn();

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { mkdir, readdir, stat, readFile },
}));

describe('mobilePluginsFs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ensureMobilePluginsRoot mkdir plugins under Data', async () => {
    const { ensureMobilePluginsRoot } = await import('../mobilePluginsFs');
    mkdir.mockResolvedValue(undefined);
    await expect(ensureMobilePluginsRoot()).resolves.toBe('plugins');
    expect(mkdir).toHaveBeenCalledWith({
      path: 'plugins',
      directory: 'DATA',
      recursive: true,
    });
  });

  it('createMobilePluginsFs discovers directory entries and reads utf8', async () => {
    const { createMobilePluginsFs } = await import('../mobilePluginsFs');
    const fs = createMobilePluginsFs();

    readdir.mockResolvedValue({
      files: [
        { name: 'sample-kind-plugin', type: 'directory' },
        { name: 'readme.txt', type: 'file' },
      ],
    });
    stat.mockImplementation(async ({ path }: { path: string }) => ({
      type: path.endsWith('sample-kind-plugin') ? 'directory' : 'file',
    }));
    readFile.mockResolvedValue({
      data: JSON.stringify({
        id: 'ext.sample-kind',
        name: 'Sample',
        version: '0.1.0',
        main: 'main.mjs',
        capabilities: ['kind'],
      }),
    });

    await expect(fs.readdir('plugins')).resolves.toEqual([
      'sample-kind-plugin',
      'readme.txt',
    ]);
    await expect(fs.isDirectory('plugins/sample-kind-plugin')).resolves.toBe(
      true,
    );
    await expect(fs.isDirectory('plugins/readme.txt')).resolves.toBe(false);
    const text = await fs.readText('plugins/sample-kind-plugin/manifest.json');
    expect(JSON.parse(text).id).toBe('ext.sample-kind');
    expect(readFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'plugins/sample-kind-plugin/manifest.json',
        directory: 'DATA',
        encoding: 'utf8',
      }),
    );
  });
});

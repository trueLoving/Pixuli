import { beforeEach, describe, expect, it, vi } from 'vitest';

const rmdir = vi.fn();
const mkdir = vi.fn();

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { rmdir, mkdir },
}));

describe('uninstallMobilePlugin', () => {
  beforeEach(() => {
    vi.resetModules();
    rmdir.mockReset();
    mkdir.mockReset();
    mkdir.mockResolvedValue(undefined);
    rmdir.mockResolvedValue(undefined);
  });

  it('removes plugin directory under plugins root', async () => {
    const { uninstallMobilePlugin } = await import('../uninstallMobilePlugin');
    const result = await uninstallMobilePlugin('ext.example-kind');
    expect(result).toEqual({ ok: true, pluginId: 'ext.example-kind' });
    expect(rmdir).toHaveBeenCalledWith({
      path: 'plugins/ext.example-kind',
      directory: 'DATA',
      recursive: true,
    });
  });

  it('treats missing directory as success', async () => {
    rmdir.mockRejectedValueOnce(new Error('Directory does not exist'));
    const { uninstallMobilePlugin } = await import('../uninstallMobilePlugin');
    await expect(uninstallMobilePlugin('ext.missing')).resolves.toEqual({
      ok: true,
      pluginId: 'ext.missing',
    });
  });
});

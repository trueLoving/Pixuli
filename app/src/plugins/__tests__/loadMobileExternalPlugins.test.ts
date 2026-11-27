import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyPluginUiHost,
  createPluginRuntime,
} from '@pixuli/core/plugin-runtime';
import { createKindPluginRegistry } from '@pixuli/core/kinds';
import { createStoragePluginRegistry } from '@pixuli/core/plugins';

const isNativeMobile = vi.fn(() => false);
const ensureMobilePluginsRoot = vi.fn(async () => 'plugins');
const createMobilePluginsFs = vi.fn();
const loadExternalPluginsFromDisk = vi.fn(async () => [
  { id: 'ext.sample-kind', ok: true },
]);

vi.mock('@/platforms/platform', () => ({
  isNativeMobile: () => isNativeMobile(),
}));

vi.mock('@/platforms/mobile/mobilePluginsFs', () => ({
  ensureMobilePluginsRoot: () => ensureMobilePluginsRoot(),
  createMobilePluginsFs: () => createMobilePluginsFs(),
}));

vi.mock('../externalLoader', async importOriginal => {
  const actual = await importOriginal<typeof import('../externalLoader')>();
  return {
    ...actual,
    loadExternalPluginsFromDisk: (
      ...args: Parameters<typeof actual.loadExternalPluginsFromDisk>
    ) => loadExternalPluginsFromDisk(...args),
  };
});

describe('loadMobileExternalPlugins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNativeMobile.mockReturnValue(false);
  });

  it('skips when not native mobile', async () => {
    const { loadMobileExternalPlugins } = await import(
      '../loadMobileExternalPlugins'
    );
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds: createKindPluginRegistry(),
      ui: createEmptyPluginUiHost(),
    });
    await expect(loadMobileExternalPlugins(runtime)).resolves.toEqual([]);
    expect(ensureMobilePluginsRoot).not.toHaveBeenCalled();
  });

  it('loads from Directory.Data/plugins when native mobile', async () => {
    isNativeMobile.mockReturnValue(true);
    const fakeFs = {
      join: (...parts: string[]) => parts.join('/'),
      toImportUrl: (p: string) => p,
      readdir: async () => [],
      isDirectory: async () => false,
      readText: async () => '',
    };
    createMobilePluginsFs.mockReturnValue(fakeFs);

    const { loadMobileExternalPlugins } = await import(
      '../loadMobileExternalPlugins'
    );
    const runtime = createPluginRuntime({
      storage: createStoragePluginRegistry(),
      kinds: createKindPluginRegistry(),
      ui: createEmptyPluginUiHost(),
    });

    await expect(loadMobileExternalPlugins(runtime)).resolves.toEqual([
      { id: 'ext.sample-kind', ok: true },
    ]);
    expect(ensureMobilePluginsRoot).toHaveBeenCalled();
    expect(loadExternalPluginsFromDisk).toHaveBeenCalledWith(
      runtime,
      'plugins',
      fakeFs,
      expect.any(Function),
    );
  });
});

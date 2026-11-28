import { beforeEach, describe, expect, it, vi } from 'vitest';

const isDesktop = vi.fn(() => false);
const isNativeMobile = vi.fn(() => false);

vi.mock('@/platforms/platform', () => ({
  isDesktop: () => isDesktop(),
  isNativeMobile: () => isNativeMobile(),
}));

describe('pluginManagement', () => {
  beforeEach(() => {
    vi.resetModules();
    isDesktop.mockReturnValue(false);
    isNativeMobile.mockReturnValue(false);
  });

  it('lists only builtin plugins on web and disallows offline install', async () => {
    const { listManagedPluginsForPlatform, canInstallOfflinePlugins } =
      await import('../pluginManagement');
    expect(canInstallOfflinePlugins()).toBe(false);
    const rows = listManagedPluginsForPlatform();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.origin === 'builtin')).toBe(true);
  });

  it('allows offline install on native mobile', async () => {
    isNativeMobile.mockReturnValue(true);
    const { canInstallOfflinePlugins, canUninstallOfflinePlugins } =
      await import('../pluginManagement');
    expect(canInstallOfflinePlugins()).toBe(true);
    expect(canUninstallOfflinePlugins()).toBe(true);
  });

  it('disallows offline uninstall on web', async () => {
    const { canUninstallOfflinePlugins } = await import('../pluginManagement');
    expect(canUninstallOfflinePlugins()).toBe(false);
  });
});

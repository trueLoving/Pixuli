import type { PixuliPackageJson } from './versionInfo';
import type { ViteModeFlags } from './modes';

export function createDevServerOptions(
  flags: ViteModeFlags,
  pkg: PixuliPackageJson,
) {
  const { isDesktop, isWeb, isAndroidDev, androidDevPort } = flags;

  if (isDesktop && process.env.VSCODE_DEBUG) {
    const url = new URL(
      pkg.debug?.env?.VITE_DEV_SERVER_URL || 'http://localhost:5173',
    );
    return {
      host: url.hostname,
      port: +url.port,
    };
  }

  if (isWeb) {
    return {
      open: !isAndroidDev,
      host: isAndroidDev ? '0.0.0.0' : undefined,
      port: isAndroidDev ? androidDevPort : 5500,
      strictPort: isAndroidDev,
    };
  }

  return {};
}

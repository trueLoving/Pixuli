import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import type { ViteModeFlags } from '../modes';
import type { PixuliPackageJson } from '../versionInfo';
import { PIXULI_ROOT } from '../paths';
import { createElectronPlugins } from './electron';
import { createPwaPlugin } from './pwa';

export interface CreatePixuliPluginsOptions {
  flags: ViteModeFlags;
  pkg: PixuliPackageJson;
  sourcemap: boolean | 'inline' | undefined;
}

export function createPixuliPlugins({
  flags,
  pkg,
  sourcemap,
}: CreatePixuliPluginsOptions): PluginOption[] {
  const { isWeb, isDesktop, isServe, isBuild, isCapacitorNativeBuild } = flags;
  const plugins: PluginOption[] = [react()];

  if (isDesktop) {
    plugins.push(
      ...createElectronPlugins({
        pkg,
        sourcemap,
        isBuild,
      }),
    );
  }

  if (isWeb && !isCapacitorNativeBuild) {
    plugins.push(createPwaPlugin(isServe));
  }

  return plugins;
}

export function createResolveAlias(
  flags: ViteModeFlags,
): Record<string, string> {
  const { isDesktop, isCapacitorNativeBuild } = flags;
  const resolveAlias: Record<string, string> = {
    '@': path.join(PIXULI_ROOT, 'src'),
    '@platforms': path.resolve(PIXULI_ROOT, 'src/platforms'),
    '@packages': path.resolve(PIXULI_ROOT, '../../packages'),
    '@platforms/web': path.resolve(PIXULI_ROOT, 'src/platforms/web'),
    '@platforms/desktop': path.resolve(PIXULI_ROOT, 'src/platforms/desktop'),
  };

  if (isDesktop || isCapacitorNativeBuild) {
    resolveAlias['virtual:pwa-register/react'] = path.resolve(
      PIXULI_ROOT,
      'src/features/pwa/pwaRegisterStub.ts',
    );
  }

  return resolveAlias;
}

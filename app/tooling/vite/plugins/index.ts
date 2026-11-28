import path from 'node:path';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import type { ViteModeFlags } from '../modes';
import type { PixuliPackageJson } from '../versionInfo';
import { PIXULI_ROOT } from '../paths';
import { createElectronPlugins } from './electron';

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
  const { isDesktop, isBuild } = flags;
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

  return plugins;
}

export function createResolveAlias(
  _flags: ViteModeFlags,
): Record<string, string> {
  return {
    '@': path.join(PIXULI_ROOT, 'src'),
    '@platforms': path.resolve(PIXULI_ROOT, 'src/platforms'),
    '@packages': path.resolve(PIXULI_ROOT, '../packages'),
    '@platforms/web': path.resolve(PIXULI_ROOT, 'src/platforms/web'),
    '@platforms/desktop': path.resolve(PIXULI_ROOT, 'src/platforms/desktop'),
  };
}

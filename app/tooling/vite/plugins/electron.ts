import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';
import type { PixuliPackageJson } from '../versionInfo';

export interface ElectronPluginOptions {
  pkg: PixuliPackageJson;
  sourcemap: boolean | 'inline' | undefined;
  isBuild: boolean;
}

export function createElectronPlugins({
  pkg,
  sourcemap,
  isBuild,
}: ElectronPluginOptions) {
  return [
    electron({
      main: {
        entry: 'electron/main/index.ts',
        onstart(args) {
          if (process.env.VSCODE_DEBUG) {
            console.log('[startup] Electron App');
          } else {
            args.startup();
          }
        },
        vite: {
          build: {
            sourcemap,
            minify: isBuild,
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: Object.keys(
                'dependencies' in pkg ? pkg.dependencies : {},
              ),
            },
          },
        },
      },
      preload: {
        input: 'electron/preload/index.ts',
        vite: {
          build: {
            target: 'esnext',
            sourcemap: sourcemap ? 'inline' : undefined,
            minify: isBuild,
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: Object.keys(
                'dependencies' in pkg ? pkg.dependencies : {},
              ),
              output: {
                format: 'es',
                entryFileNames: 'index.mjs',
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
      renderer: {},
    }),
    renderer(),
  ];
}

import { rmSync } from 'node:fs';
import { loadEnv, type UserConfigExport } from 'vite';
import { createBuildOptions } from './build';
import { resolveViteModeFlags } from './modes';
import { MONOREPO_ROOT } from './paths';
import { createPixuliPlugins, createResolveAlias } from './plugins';
import { createDevServerOptions } from './server';
import { createVersionInfo, type PixuliPackageJson } from './versionInfo';

export function createPixuliViteConfig(
  pkg: PixuliPackageJson,
): UserConfigExport {
  const versionInfo = createVersionInfo(pkg);

  return ({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const flags = resolveViteModeFlags(mode, env, command);
    const sourcemap = flags.isServe || !!process.env.VSCODE_DEBUG;

    if (flags.isDesktop) {
      rmSync('dist-electron', { recursive: true, force: true });
    }

    return {
      base: flags.isCapacitorNativeBuild ? './' : '/',
      resolve: {
        alias: createResolveAlias(flags),
        conditions: ['development', 'import', 'module', 'browser', 'default'],
      },
      ssr: {
        resolve: {
          conditions: ['development', 'import', 'module', 'node', 'default'],
        },
        noExternal: [
          '@pixuli/core',
          '@pixuli/provider-gitee',
          '@pixuli/provider-github',
        ],
      },
      plugins: createPixuliPlugins({ flags, pkg, sourcemap }),
      optimizeDeps: {
        exclude: [
          '@pixuli/core',
          '@pixuli/provider-gitee',
          '@pixuli/provider-github',
        ],
      },
      build: createBuildOptions(flags),
      server: {
        fs: { allow: [MONOREPO_ROOT] },
        ...createDevServerOptions(flags, pkg),
      },
      clearScreen: false,
      define: {
        __VERSION_INFO__: JSON.stringify(versionInfo),
        __IS_WEB__: JSON.stringify(flags.isWeb),
        __IS_DESKTOP__: JSON.stringify(flags.isDesktop),
      },
    };
  };
}

import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';
import { VitePWA } from 'vite-plugin-pwa';
import { storageHostVitePlugin } from './plugins/storageHostVitePlugin';
import pkg from './package.json';
import { resolveViteModeFlags } from './vite/modes';
import { createVersionInfo } from './vite/versionInfo';

const versionInfo = createVersionInfo(pkg);

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const flags = resolveViteModeFlags(mode, env, command);
  const {
    isWeb,
    isDesktop,
    isServe,
    isBuild,
    isAndroidDev,
    isCapacitorNativeBuild,
    androidDevPort,
  } = flags;

  if (isDesktop) {
    rmSync('dist-electron', { recursive: true, force: true });
  }

  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  const plugins: any[] = [react()];

  if (isServe && (isWeb || isDesktop)) {
    plugins.push(storageHostVitePlugin());
  }

  if (isDesktop) {
    plugins.push(
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
    );
  }

  if (isWeb && !isCapacitorNativeBuild) {
    plugins.push(
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.ico',
          'icon.ico',
          'pwa/icon-192x192.png',
          'pwa/icon-512x512.png',
        ],
        manifest: {
          name: 'Pixuli - 智能图片管理',
          short_name: 'Pixuli',
          description: '基于 GitHub/Gitee 的智能图片管理 Web 应用',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/pwa/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          shortcuts: [
            {
              name: '上传图片',
              short_name: '上传',
              description: '快速上传新图片',
              url: '/?action=upload',
              icons: [{ src: '/pwa/icon-192x192.png', sizes: '192x192' }],
            },
          ],
          categories: ['productivity', 'utilities'],
        },
        workbox: {
          globPatterns: isServe ? [] : ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/raw\.(githubusercontent|gitee)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pixuli-image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: true },
      }),
    );
  }

  const resolveAlias: Record<string, string> = {
    '@': path.join(__dirname, 'src'),
    '@platforms': path.resolve(__dirname, 'src/platforms'),
    '@packages': path.resolve(__dirname, '../../packages'),
    '@platforms/web': path.resolve(__dirname, 'src/platforms/web'),
    '@platforms/desktop': path.resolve(__dirname, 'src/platforms/desktop'),
  };
  if (isDesktop || isCapacitorNativeBuild) {
    resolveAlias['virtual:pwa-register/react'] = path.resolve(
      __dirname,
      'src/features/pwa/pwaRegisterStub.ts',
    );
  }

  const monorepoRoot = path.resolve(__dirname, '../..');

  return {
    base: isCapacitorNativeBuild ? './' : '/',
    resolve: {
      alias: resolveAlias,
      conditions: ['development', 'import', 'module', 'browser', 'default'],
    },
    ssr: {
      resolve: {
        conditions: ['import', 'module', 'node', 'default'],
      },
      noExternal: [],
    },
    plugins,
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: id => {
            if (isWeb) {
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/scheduler/') ||
                (id.includes('react') &&
                  !id.includes('react-hot-toast') &&
                  !id.includes('react-dropzone') &&
                  !id.includes('react-image-crop') &&
                  !id.includes('react-i18next'))
              ) {
                return 'react';
              }
            } else if (id.includes('react') || id.includes('react-dom')) {
              if (
                !id.includes('react-hot-toast') &&
                !id.includes('react-dropzone') &&
                !id.includes('react-image-crop') &&
                !id.includes('react-i18next')
              ) {
                return 'react';
              }
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (
              id.includes('react-hot-toast') ||
              id.includes('react-dropzone') ||
              id.includes('react-image-crop')
            ) {
              return 'ui';
            }
            if (id.includes('zustand')) {
              return 'state';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            if (id.includes('octokit')) {
              return 'github';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      fs: { allow: [monorepoRoot] },
      ...(isDesktop && process.env.VSCODE_DEBUG
        ? (() => {
            const url = new URL(
              pkg.debug?.env?.VITE_DEV_SERVER_URL || 'http://localhost:5173',
            );
            return {
              host: url.hostname,
              port: +url.port,
            };
          })()
        : isWeb
          ? {
              open: !isAndroidDev,
              host: isAndroidDev ? '0.0.0.0' : undefined,
              port: isAndroidDev ? androidDevPort : 5500,
              strictPort: isAndroidDev,
            }
          : {}),
    },
    clearScreen: false,
    define: {
      __VERSION_INFO__: JSON.stringify(versionInfo),
      __IS_WEB__: JSON.stringify(isWeb),
      __IS_DESKTOP__: JSON.stringify(isDesktop),
    },
  };
});

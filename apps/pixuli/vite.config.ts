import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';
import { VitePWA } from 'vite-plugin-pwa';
import { storageHostVitePlugin } from './plugins/storageHostVitePlugin';
import pkg from './package.json';
import fs from 'fs';
import { execSync } from 'child_process';

// 读取依赖的真实版本
function getRealVersion(packageName: string, isDevDependency = false): string {
  try {
    const packagePath = path.resolve(
      __dirname,
      'node_modules',
      packageName,
      'package.json',
    );
    const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageInfo.version;
  } catch (error) {
    // 如果无法读取真实版本，回退到package.json中的版本
    const source = isDevDependency ? pkg.devDependencies : pkg.dependencies;
    return source?.[packageName] || 'unknown';
  }
}

// 获取Git信息
function getGitInfo() {
  try {
    // 获取当前分支
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
    // 获取当前commit hash
    const commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
    }).trim();
    return { branch, commit };
  } catch (error) {
    console.warn('无法获取Git信息:', error);
    return { branch: 'unknown', commit: 'unknown' };
  }
}

// 获取Git信息
const gitInfo = getGitInfo();

// 生成版本信息
const versionInfo = {
  version: pkg.version,
  name: pkg.name,
  description: pkg.description || '',
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
  frameworks: {
    react: getRealVersion('react'),
    'react-dom': getRealVersion('react-dom'),
    vite: getRealVersion('vite', true),
    typescript: getRealVersion('typescript', true),
    tailwindcss: getRealVersion('tailwindcss', true),
    electron: getRealVersion('electron', true),
  },
  dependencies: {
    'lucide-react': getRealVersion('lucide-react'),
    'react-i18next': getRealVersion('react-i18next'),
    zustand: getRealVersion('zustand'),
    octokit: getRealVersion('octokit'),
    'react-dropzone': getRealVersion('react-dropzone'),
    'react-hot-toast': getRealVersion('react-hot-toast'),
    'react-image-crop': getRealVersion('react-image-crop'),
  },
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  git: {
    commit: gitInfo.commit,
    branch: gitInfo.branch,
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isWeb = mode === 'web';
  const isDesktop = mode === 'desktop' || (!mode && !env.ELECTRON);

  // 仅在 Desktop 模式下清理 dist-electron
  if (isDesktop) {
    rmSync('dist-electron', { recursive: true, force: true });
  }

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;
  const isAndroidDev = isServe && isWeb && !!process.env.CAPACITOR_ANDROID_DEV;
  const androidDevPort = Number(process.env.CAPACITOR_DEV_PORT || 5500);
  // 离线 APK：相对资源路径 + 禁用 PWA/SW（Capacitor WebView 易白屏）
  const isCapacitorNativeBuild =
    isWeb && isBuild && !!process.env.CAPACITOR_NATIVE;

  const plugins: any[] = [react()];

  // Web / 桌面 dev：扫描 manifest 挂载插件 Host 集成（REF-411 / REF-416）
  if (isServe && (isWeb || isDesktop)) {
    plugins.push(storageHostVitePlugin());
  }

  // 根据模式添加 Electron 插件（仅 Desktop 模式）
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
                  // sandbox: false + nodeIntegration: false → ESM preload 可用 import / top-level await
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

  // PWA：Web 浏览器；Capacitor 离线包不生成 SW（见 isCapacitorNativeBuild）
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
          // 开发时 dev-dist 可能为空，不预缓存以免触发 glob 警告；生产构建正常预缓存
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
    '@packages': path.resolve(__dirname, '../../packages'),
    '@platforms/web': path.resolve(__dirname, 'src/platforms/web'),
    '@platforms/desktop': path.resolve(__dirname, 'src/platforms/desktop'),
  };
  // Desktop / Capacitor 离线包无 PWA 插件，virtual:pwa-register 走 no-op
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
      // Renderer dev 走 development → 源码（REF-416）
      conditions: ['development', 'import', 'module', 'browser', 'default'],
    },
    ssr: {
      // SSR / configureServer 走 import → dist，不启用 development
      resolve: {
        conditions: ['import', 'module', 'node', 'default'],
      },
      // workspace 包走 tsup dist + package exports；勿 noExternal 回退源码
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
            // 在 Web 模式下，确保 React 核心（包括 scheduler）不被分割
            // React 19 的调度器必须与 React 核心在同一 chunk
            if (isWeb) {
              // React 核心 - 包括所有 React 相关模块（react, react-dom, scheduler）
              // 确保它们都在同一个 chunk 中，避免调度器加载顺序问题
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
            } else {
              // Desktop 模式：保持原有逻辑
              if (id.includes('react') || id.includes('react-dom')) {
                if (
                  !id.includes('react-hot-toast') &&
                  !id.includes('react-dropzone') &&
                  !id.includes('react-image-crop') &&
                  !id.includes('react-i18next')
                ) {
                  return 'react';
                }
              }
            }
            // UI组件库
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
            // 状态管理和工具
            if (id.includes('zustand')) {
              return 'state';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            // GitHub API
            if (id.includes('octokit')) {
              return 'github';
            }
            // 其他第三方库
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
      // 注入版本信息到全局变量
      __VERSION_INFO__: JSON.stringify(versionInfo),
      __IS_WEB__: JSON.stringify(isWeb),
      __IS_DESKTOP__: JSON.stringify(isDesktop),
    },
  };
});

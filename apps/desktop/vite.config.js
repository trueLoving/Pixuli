import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';
import fs from 'fs';
import { execSync } from 'child_process';
// 读取依赖的真实版本
function getRealVersion(packageName, isDevDependency) {
  if (isDevDependency === void 0) {
    isDevDependency = false;
  }
  try {
    var packagePath = path.resolve(
      __dirname,
      'node_modules',
      packageName,
      'package.json',
    );
    var packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageInfo.version;
  } catch (error) {
    // 如果无法读取真实版本，回退到package.json中的版本
    var source = isDevDependency ? pkg.devDependencies : pkg.dependencies;
    return (
      (source === null || source === void 0 ? void 0 : source[packageName]) ||
      'unknown'
    );
  }
}
// 获取Git信息
function getGitInfo() {
  try {
    // 获取当前分支
    var branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();
    // 获取当前commit hash
    var commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
    }).trim();
    return { branch: branch, commit: commit };
  } catch (error) {
    console.warn('无法获取Git信息:', error);
    return { branch: 'unknown', commit: 'unknown' };
  }
}
// 获取Git信息
var gitInfo = getGitInfo();
// 生成版本信息
var versionInfo = {
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
    'pixuli-wasm': getRealVersion('pixuli-wasm'),
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
export default defineConfig(function (_a) {
  var command = _a.command,
    mode = _a.mode;
  var env = loadEnv(mode, process.cwd(), '');
  var isWeb = mode === 'web';
  var isDesktop = mode === 'desktop' || (!mode && !env.ELECTRON);
  // 仅在 Desktop 模式下清理 dist-electron
  if (isDesktop) {
    rmSync('dist-electron', { recursive: true, force: true });
  }
  var isServe = command === 'serve';
  var isBuild = command === 'build';
  var sourcemap = isServe || !!process.env.VSCODE_DEBUG;
  var plugins = [react()];
  // 根据模式添加 Electron 插件（仅 Desktop 模式）
  if (isDesktop) {
    plugins.push(
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart: function (args) {
            if (process.env.VSCODE_DEBUG) {
              console.log('[startup] Electron App');
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap: sourcemap,
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
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(
                  'dependencies' in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        renderer: {},
      }),
      renderer(),
    );
  }
  // 根据模式添加 PWA 插件（仅 Web 模式）
  if (isWeb) {
    plugins.push(
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.ico', 'icon-192x192.png', 'icon-512x512.png'],
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
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icon-512x512.png',
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
              icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
            },
          ],
          categories: ['productivity', 'utilities'],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: undefined,
        },
      }),
    );
  }
  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@packages': path.resolve(__dirname, '../../packages'),
      },
    },
    plugins: plugins,
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        external: ['pixuli-wasm'],
        output: {
          manualChunks: function (id) {
            // React核心
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
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
            if (id.includes('i18next')) {
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
    server:
      isDesktop && process.env.VSCODE_DEBUG
        ? (function () {
            var _a, _b;
            var url = new URL(
              ((_b =
                (_a = pkg.debug) === null || _a === void 0
                  ? void 0
                  : _a.env) === null || _b === void 0
                ? void 0
                : _b.VITE_DEV_SERVER_URL) || 'http://localhost:5173',
            );
            return {
              host: url.hostname,
              port: +url.port,
            };
          })()
        : isWeb
          ? {
              open: true,
              port: 5500,
              proxy: {
                '/api/gitee-proxy': {
                  target: 'https://gitee.com',
                  changeOrigin: true,
                  secure: true,
                  rewrite: function (path) {
                    return path.replace(/^\/api\/gitee-proxy/, '');
                  },
                  configure: function (proxy, _options) {
                    proxy.on('proxyReq', function (proxyReq, _req, _res) {
                      proxyReq.setHeader('Referer', 'https://gitee.com/');
                      proxyReq.setHeader('Origin', 'https://gitee.com');
                    });
                    proxy.on('proxyRes', function (proxyRes, _req, _res) {
                      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
                      proxyRes.headers['Access-Control-Allow-Methods'] =
                        'GET, HEAD, OPTIONS';
                      proxyRes.headers['Access-Control-Allow-Headers'] = '*';
                    });
                  },
                },
              },
            }
          : undefined,
    clearScreen: false,
    define: {
      // 注入版本信息到全局变量
      __VERSION_INFO__: JSON.stringify(versionInfo),
      __IS_WEB__: JSON.stringify(isWeb),
      __IS_DESKTOP__: JSON.stringify(isDesktop),
    },
  };
});

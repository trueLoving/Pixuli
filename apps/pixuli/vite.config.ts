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

  const plugins: any[] = [react()];

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
        includeAssets: [
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
        // Service Worker 已移除，仅保留 manifest 配置
      }),
    );
  }

  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@packages': path.resolve(__dirname, '../../packages'),
        '@platforms/web': path.resolve(__dirname, 'src/platforms/web'),
        '@platforms/desktop': path.resolve(__dirname, 'src/platforms/desktop'),
      },
    },
    plugins,
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        external: ['pixuli-wasm'],
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
    server:
      isDesktop && process.env.VSCODE_DEBUG
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
              open: true,
              port: 5500,
              proxy: {
                '/api/gitee-proxy': {
                  target: 'https://gitee.com',
                  changeOrigin: true,
                  secure: true,
                  rewrite: path => path.replace(/^\/api\/gitee-proxy/, ''),
                  configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, _req, _res) => {
                      proxyReq.setHeader('Referer', 'https://gitee.com/');
                      proxyReq.setHeader('Origin', 'https://gitee.com');
                    });
                    proxy.on('proxyRes', (proxyRes, _req, _res) => {
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

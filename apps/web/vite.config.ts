import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// 读取 package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8')
);

// 读取依赖的真实版本
function getRealVersion(packageName: string, isDevDependency = false): string {
  try {
    const packagePath = path.resolve(
      __dirname,
      'node_modules',
      packageName,
      'package.json'
    );
    const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageInfo.version;
  } catch (error) {
    // 如果无法读取真实版本，回退到package.json中的版本
    const source = isDevDependency
      ? packageJson.devDependencies
      : packageJson.dependencies;
    return source[packageName] || 'unknown';
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
  version: packageJson.version,
  name: packageJson.name,
  description: packageJson.description,
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
  frameworks: {
    react: getRealVersion('react'),
    vite: getRealVersion('vite', true),
    typescript: getRealVersion('typescript', true),
    tailwindcss: getRealVersion('tailwindcss', true),
  },
  dependencies: {
    'lucide-react': getRealVersion('lucide-react'),
    'react-i18next': getRealVersion('react-i18next'),
    zustand: getRealVersion('zustand'),
    octokit: getRealVersion('octokit'),
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Pixuli Web - 智能图片管理',
        short_name: 'Pixuli',
        description: '基于 GitHub 的智能图片管理 Web 应用',
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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'github-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@packages': path.resolve(__dirname, '../../packages'),
    },
  },
  server: {
    port: 5500,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 代码分包策略
        manualChunks: id => {
          // React核心 - 单独分包
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react';
          }
          // 图标库 - 单独分包
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // 状态管理 - 单独分包
          if (id.includes('zustand')) {
            return 'state';
          }
          // 国际化 - 单独分包
          if (
            id.includes('i18next') ||
            id.includes('react-i18next') ||
            id.includes('i18next-browser-languagedetector')
          ) {
            return 'i18n';
          }
          // GitHub API - 单独分包
          if (id.includes('octokit')) {
            return 'github';
          }
          // Pixuli UI共享组件 - 单独分包
          if (id.includes('pixuli-ui')) {
            return 'ui';
          }
          // 其他第三方库 - 统一分包
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 优化输出文件名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  define: {
    // 注入版本信息到全局变量
    __VERSION_INFO__: JSON.stringify(versionInfo),
  },
});

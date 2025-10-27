import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';
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
      'package.json'
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
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@packages': path.resolve(__dirname, '../../packages'),
      },
    },
    plugins: [
      react(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: 'electron/main/index.ts',
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ '[startup] Electron App'
              );
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
                  'dependencies' in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(
                  'dependencies' in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
      renderer(),
    ],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        external: ['pixuli-wasm'],
        output: {
          manualChunks: id => {
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
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
          return {
            host: url.hostname,
            port: +url.port,
          };
        })()
      : undefined,
    clearScreen: false,
    define: {
      // 注入版本信息到全局变量
      __VERSION_INFO__: JSON.stringify(versionInfo),
    },
  };
});

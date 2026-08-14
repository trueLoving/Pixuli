import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const preloadDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../preload',
);

/** vite-plugin-electron 在 type:module 下产出 index.mjs，兼容旧版 index.js */
export function resolvePreloadScript(): string {
  for (const name of ['index.mjs', 'index.js', 'index.cjs']) {
    const candidate = path.join(preloadDir, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(preloadDir, 'index.mjs');
}

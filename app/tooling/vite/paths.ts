import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolingViteDir = path.dirname(fileURLToPath(import.meta.url));

/** `app` 包根目录 */
export const PIXULI_ROOT = path.resolve(toolingViteDir, '../..');

/** Monorepo 仓库根目录 */
export const MONOREPO_ROOT = path.resolve(PIXULI_ROOT, '..');

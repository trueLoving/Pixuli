import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolingScriptsDir = path.dirname(fileURLToPath(import.meta.url));

/** `app` 包根目录 */
export const PIXULI_ROOT = path.resolve(toolingScriptsDir, '../..');

/**
 * Vite 已运行时，重新 cap run android Live Reload（Capacitor 7）。
 */
import { spawn } from 'node:child_process';
import { buildCapLiveReloadArgs } from './cap-live-reload-args.mjs';
import { PIXULI_ROOT } from './paths.mjs';

const port = Number(process.env.CAPACITOR_DEV_PORT || 5500);
const extraCapArgs = process.argv.slice(2);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: PIXULI_ROOT,
      stdio: 'inherit',
      shell: true,
    });
    child.on('exit', code =>
      code === 0 ? resolve() : reject(new Error(`exit ${code}`)),
    );
  });
}

const { capArgs, mode } = buildCapLiveReloadArgs({
  port,
  extraArgs: extraCapArgs,
});
console.log(`[run:android] ${mode}`);

await run('pnpm', capArgs);

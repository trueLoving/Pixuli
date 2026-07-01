/**
 * Android 模拟器 / 真机联调：Vite dev server + Capacitor 7 Live Reload。
 *
 * Capacitor 7 使用 `cap run android -l --port --host|--forwardPorts`，
 * 不再支持旧版 `--external`（与 Expo 不同，需自启 Vite）。
 */
import { spawn, execSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { buildCapLiveReloadArgs, listAdbDevices } from './cap-live-reload-args.mjs';
import { PIXULI_ROOT } from './paths.mjs';

const port = Number(process.env.CAPACITOR_DEV_PORT || 5500);
const extraCapArgs = process.argv.slice(2);

function log(msg) {
  console.log(`[dev:android] ${msg}`);
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function waitForPort(targetPort, host = '127.0.0.1', timeoutMs = 120_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`等待 Vite ${host}:${targetPort} 超时`));
        return;
      }
      const socket = createConnection({ port: targetPort, host });
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        setTimeout(tryConnect, 400);
      });
    };
    tryConnect();
  });
}

function startVite() {
  return spawn(
    'pnpm',
    ['exec', 'vite', '--mode', 'web', '--host', '0.0.0.0', '--port', String(port)],
    {
      cwd: PIXULI_ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, CAPACITOR_ANDROID_DEV: '1' },
    },
  );
}

async function main() {
  log('构建 workspace 包…');
  execSync('pnpm build:packages', { cwd: PIXULI_ROOT, stdio: 'inherit' });

  const devices = listAdbDevices();
  const { capArgs, mode } = buildCapLiveReloadArgs({
    port,
    extraArgs: extraCapArgs,
  });
  log(`Live Reload：${mode}`);

  if (devices.length === 0) {
    log('提示：先启动 Android 模拟器，或连接真机并开启 USB 调试（adb devices）');
  }

  log(`启动 Vite（0.0.0.0:${port}）…`);
  const vite = startVite();

  const cleanup = signal => {
    if (!vite.killed) vite.kill(signal);
  };
  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  try {
    await waitForPort(port);
    log('Vite 就绪，cap run android（含 sync + 安装 + Live Reload）…');
    await run('pnpm', capArgs, { cwd: PIXULI_ROOT });
  } finally {
    cleanup('SIGTERM');
  }
}

main().catch(err => {
  console.error('[dev:android]', err.message || err);
  process.exit(1);
});

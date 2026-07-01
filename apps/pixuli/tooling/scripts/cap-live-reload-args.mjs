/**
 * Capacitor 7 `cap run android -l` 参数（已移除旧版 --external）。
 * @see `pnpm exec cap run android --help`
 */
import { execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';

export function getLanIpv4() {
  const nets = networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

export function listAdbDevices() {
  try {
    const out = execSync('adb devices', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out
      .split('\n')
      .slice(1)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('*'))
      .map(line => {
        const [id, state] = line.split(/\s+/);
        return { id, state };
      })
      .filter(d => d.state === 'device');
  } catch {
    return [];
  }
}

/**
 * @param {object} options
 * @param {number} options.port
 * @param {string[]} [options.extraArgs]
 * @returns {{ capArgs: string[], mode: string }}
 */
export function buildCapLiveReloadArgs({ port, extraArgs = [] }) {
  const devices = listAdbDevices();
  const override = process.env.CAPACITOR_SERVER_URL?.trim();

  const capArgs = ['exec', 'cap', 'run', 'android', '-l', '--port', String(port)];

  if (override) {
    const url = new URL(override);
    capArgs.push('--host', url.hostname);
    if (url.port) {
      capArgs[capArgs.indexOf('--port') + 1] = url.port;
    }
    return {
      capArgs: [...capArgs, ...extraArgs],
      mode: `CAPACITOR_SERVER_URL → ${override}`,
    };
  }

  const emulator = devices.find(d => d.id.startsWith('emulator-'));
  if (emulator || devices.length === 0) {
    capArgs.push('--forwardPorts', `${port}:${port}`);
    const hint = emulator ? emulator.id : '未连接设备，按模拟器处理';
    return {
      capArgs: [...capArgs, ...extraArgs],
      mode: `模拟器 ${hint}：adb reverse ${port} → localhost Live Reload`,
    };
  }

  const lan = getLanIpv4();
  capArgs.push('--host', lan);
  return {
    capArgs: [...capArgs, ...extraArgs],
    mode: `真机 ${devices[0].id} → http://${lan}:${port}`,
  };
}

import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Android 壳配置（REF-509 #118）。
 * webDir 与 `vite build --mode web` 输出一致。
 *
 * 开发：设置 CAPACITOR_SERVER_URL（如 http://192.168.x.x:5500）后 `cap sync android`。
 * 生产：不设置该变量，打包 dist 静态资源。
 */
const devServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.pixuli.app',
  appName: 'Pixuli',
  webDir: 'dist',
  server: devServerUrl
    ? {
        url: devServerUrl,
        cleartext: devServerUrl.startsWith('http://'),
      }
    : {
        androidScheme: 'https',
      },
  android: {
    allowMixedContent: true,
  },
};

export default config;

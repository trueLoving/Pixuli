import { VitePWA } from 'vite-plugin-pwa';
import zhBrand from '../../../src/i18n/locales/zh-CN/brand.json';

export function createPwaPlugin(isServe: boolean) {
  const brand = zhBrand.brand;
  return VitePWA({
    registerType: 'prompt',
    injectRegister: 'auto',
    includeAssets: [
      'favicon.ico',
      'icon.ico',
      'pwa/icon-192x192.png',
      'pwa/icon-512x512.png',
    ],
    manifest: {
      name: brand.pwaName,
      short_name: brand.name,
      description: brand.pwaDescription,
      theme_color: '#7c6cf0',
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
          name: brand.pwaShortcutAdd,
          short_name: brand.pwaShortcutAddShort,
          description: brand.pwaShortcutAddDescription,
          url: '/?action=upload',
          icons: [{ src: '/pwa/icon-192x192.png', sizes: '192x192' }],
        },
      ],
      categories: ['productivity', 'utilities'],
    },
    workbox: {
      globPatterns: isServe ? [] : ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/raw\.(githubusercontent|gitee)\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'pixuli-image-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    devOptions: { enabled: true },
  });
}

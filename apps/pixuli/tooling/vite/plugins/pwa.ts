import { VitePWA } from 'vite-plugin-pwa';

export function createPwaPlugin(isServe: boolean) {
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
      name: 'Pixuli - 智能图片管理',
      short_name: 'Pixuli',
      description: '基于 GitHub/Gitee 的智能图片管理 Web 应用',
      theme_color: '#2563eb',
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
          name: '上传图片',
          short_name: '上传',
          description: '快速上传新图片',
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

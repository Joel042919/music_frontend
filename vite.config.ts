import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Offline Music Player',
        short_name: 'MusicPWA',
        description: 'Reproductor de música Offline-First',
        theme_color: '#000000',
        background_color: '#121212',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}'],
        // Aumentar límite por si los assets son grandes
        maximumFileSizeToCacheInBytes: 5000000, 
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8787\/stream\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'music-pwa-media',
              plugins: [
                {
                  // Esto evita que Workbox guarde automáticamente la respuesta en caché
                  // si no estaba ya descargada. Solo leemos del caché, y si no está, 
                  // la descarga pasa de largo para no gastar espacio innecesario
                  cacheWillUpdate: async () => null,
                }
              ]
            }
          }
        ]
      }
    })
  ],
})

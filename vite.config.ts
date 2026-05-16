import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      /**
       * Inline registration avoids `workbox-window` dynamic import; if that chunk fails to load,
       * Chrome never gets a SW and will not offer install / add-to-home-screen as a PWA.
       */
      injectRegister: 'inline',
      includeAssets: [
        'favicon.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'fonts/line-seed-sans.css',
        'fonts/line-seed-sans/*.woff2',
        'templates/checksheet-logo.png',
        'templates/checklist-before-concrete-placement.html',
        'templates/cst-strength-report.html',
        'templates/cst-report-logo-1.png',
        'templates/cst-report-logo-2.png',
        'templates/cst-report-logo-3.png',
      ],
      /** เธเธดเธ” SW เนเธ dev โ€” เธเธฑเธ CSS/JS เธเนเธฒเธเธซเธฅเธฑเธ HMR เธเธฑเธ */
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Concrete Works',
        short_name: 'Concrete Works',
        description: 'เธฃเธฐเธเธเธเธฑเธ”เธเธฒเธฃเธเธณเธเธญเธเธญเธเธเธฃเธตเธ•',
        theme_color: '#1d4ed8',
        background_color: '#000000',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'th',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/.*\.supabase\.co\/rest\/v1\/(Status|Client|Location|Concrete%20Works|Structure|Mixed%20Code|ABC%20Code|WBS%20Code|Jobs)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'master-data-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/Request/,
            handler: 'NetworkFirst',
            options: { cacheName: 'requests-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    /** เน€เธเธดเธ”เธเธฒเธเธกเธทเธญเธ–เธทเธญเนเธ Wiโ€‘Fi เนเธ”เน (http://<IP>:<port>) โ€” เธ•เธดเธ”เธ•เธฑเนเธ PWA เธเธฃเธดเธเนเธเน https เธเธ production */
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
})

import { readFileSync } from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const appVersion = JSON.parse(readFileSync('./package.json', 'utf-8')).version as string

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      /**
       * Script registration lets us probe for new SWs on focus/visibility so deploys apply without
       * requiring users to close the tab. See `src/register-pwa.ts`.
       */
      injectRegister: 'script',
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
        'templates/cst-filter-schedule.html',
        'templates/concrete-summary.html',
        'templates/cst-report-logo-1.png',
        'templates/cst-report-logo-2.png',
        'templates/cst-report-logo-3.png',
      ],
      /** เปิด SW ใน dev — จำเป็นสำหรับ Web Push (ปิดแล้ว push จะ error "push service not available") */
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Concrete Works',
        short_name: 'Concrete Works',
        description: 'เธฃเธฐเธเธเธเธฑเธ”เธเธฒเธฃเธเธณเธเธญเธเธญเธเธเธฃเธตเธ•',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      'react',
      'react-dom',
      'react-router-dom',
    ],
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

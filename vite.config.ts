import os from 'node:os'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function lanIPv4List(): string[] {
  const nets = os.networkInterfaces()
  const out: string[] = []
  for (const list of Object.values(nets)) {
    for (const net of list ?? []) {
      const v4 = net.family === 'IPv4' || String(net.family) === '4'
      if (v4 && !net.internal) out.push(net.address)
    }
  }
  return [...new Set(out)]
}

export default defineConfig(async () => {
  const lanIps = lanIPv4List()

  return {
    plugins: [
      basicSsl({
        name: 'concrete-works-dev',
        /** Include LAN IPs in dev cert SANs so Android can open https://192.168.x.x after trusting the cert. */
        domains: lanIps,
      }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        /**
         * Inline registration avoids `workbox-window` dynamic import; if that chunk fails to load,
         * Chrome never gets a SW and will not offer install / add-to-home-screen as a PWA.
         */
        injectRegister: 'inline',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'Concrete Works',
          short_name: 'ConcreteWks',
          description: 'ระบบจัดการคำขอคอนกรีต',
          theme_color: '#1d4ed8',
          background_color: '#ffffff',
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
      /** Expose on LAN so phones can open the dev server. */
      host: true,
    },
    preview: {
      host: true,
    },
  }
})

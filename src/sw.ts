/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

registerRoute(
  ({ url }) =>
    /^https:\/\/.*\.supabase\.co\/rest\/v1\/(Status|Client|Location|Concrete%20Works|Structure|Mixed%20Code|ABC%20Code|WBS%20Code|Jobs)/.test(
      url.href,
    ),
  new StaleWhileRevalidate({
    cacheName: 'master-data-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 })],
  }),
)

registerRoute(
  ({ url }) => /^https:\/\/.*\.supabase\.co\/rest\/v1\/Request/.test(url.href),
  new NetworkOnly(),
)

interface PushPayload {
  title?: string
  body?: string
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  const fallback: Required<PushPayload> = {
    title: 'ระบบแจ้งเตือนอัตโนมัติ',
    body: 'มีการแจ้งเตือนใหม่',
    url: '/',
  }

  let payload = fallback
  try {
    if (event.data) {
      const parsed = event.data.json() as PushPayload
      payload = { ...fallback, ...parsed }
    }
  } catch {
    payload = { ...fallback, body: event.data?.text() ?? fallback.body }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.url },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string | undefined) ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          void client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(
        targetUrl.startsWith('http') ? targetUrl : new URL(targetUrl, self.location.origin).href,
      )
    }),
  )
})

import { registerSW } from 'virtual:pwa-register'

function scheduleServiceWorkerUpdateChecks(registration: ServiceWorkerRegistration) {
  const probe = () => {
    void registration.update().catch(() => {})
  }

  probe()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') probe()
  })
  window.addEventListener('focus', probe)
  window.setInterval(probe, 60_000)
}

/**
 * After deploy, browsers often skip SW update checks until the tab is recycled.
 * Probing on visibility/focus plus a modest interval makes new builds take effect quickly.
 */
export function setupPwaUpdates(): void {
  let reloadSW: (reloadPage?: boolean) => Promise<void>

  reloadSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void reloadSW(true)
    },
    onNeedReload() {
      void reloadSW(true)
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) scheduleServiceWorkerUpdateChecks(registration)
    },
  })
}

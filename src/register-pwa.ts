import { registerSW } from 'virtual:pwa-register'
import { isAuthCallbackUrl } from '@/lib/authSession'

/** registration จาก vite-plugin-pwa (ใช้ร่วมกับ push) */
let pwaRegistration: ServiceWorkerRegistration | undefined
let pendingPwaReload = false
let reloadSwFn: ((reloadPage?: boolean) => Promise<void>) | undefined

export function getPwaServiceWorkerRegistration(): ServiceWorkerRegistration | undefined {
  return pwaRegistration
}

function tryApplyPwaReload() {
  if (!reloadSwFn) return
  if (isAuthCallbackUrl()) {
    pendingPwaReload = true
    return
  }
  pendingPwaReload = false
  void reloadSwFn(true)
}

function scheduleServiceWorkerUpdateChecks(registration: ServiceWorkerRegistration) {
  const probe = () => {
    void registration.update().catch(() => {})
  }

  probe()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      probe()
      if (pendingPwaReload) tryApplyPwaReload()
    }
  })
  window.addEventListener('focus', probe)
  window.setInterval(probe, 60_000)
}

/**
 * After deploy, browsers often skip SW update checks until the tab is recycled.
 * Probing on visibility/focus plus a modest interval makes new builds take effect quickly.
 * Reload is deferred during OAuth callback so Google sign-in is not interrupted.
 */
export function setupPwaUpdates(): void {
  reloadSwFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      tryApplyPwaReload()
    },
    onNeedReload() {
      tryApplyPwaReload()
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        pwaRegistration = registration
        scheduleServiceWorkerUpdateChecks(registration)
      }
    },
  })
}

import { useEffect } from 'react'
import { dispatchVisibilityResync } from '@/lib/dataSyncEvents'
import { probeBackendReachable } from '@/lib/connectivity'
import { flushOfflineMutationQueue } from '@/lib/offline/flush'
import { refreshPendingMutationCount } from '@/lib/offline/queue'
import { useConnectivityStore } from '@/stores/connectivityStore'

async function refreshBackendStatus(): Promise<boolean> {
  const reachable = await probeBackendReachable()
  useConnectivityStore.getState().setBackendReachable(reachable)
  return reachable
}

async function onBackOnline(): Promise<void> {
  const store = useConnectivityStore.getState()
  store.setDeviceOnline(true)
  store.setPhase('syncing')

  const ok = await refreshBackendStatus()
  if (ok) {
    await flushOfflineMutationQueue()
    dispatchVisibilityResync()
  }
  store.setPhase(ok ? 'online' : 'degraded')
}

/** ตรวจเน็ต + Supabase, ส่งคิวออฟไลน์, ซิงค์ข้อมูล */
export function useConnectivity(): void {
  useEffect(() => {
    void refreshPendingMutationCount()
  }, [])

  useEffect(() => {
    const store = useConnectivityStore.getState()
    store.setDeviceOnline(navigator.onLine)
    if (!navigator.onLine) {
      store.setPhase('offline')
      store.setBackendReachable(null)
      return
    }

    let cancelled = false
    void (async () => {
      const ok = await refreshBackendStatus()
      if (cancelled) return
      if (ok) await flushOfflineMutationQueue()
      store.setPhase(ok ? 'online' : 'degraded')
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onOffline = () => {
      const store = useConnectivityStore.getState()
      store.setDeviceOnline(false)
      store.setBackendReachable(null)
      store.setPhase('offline')
    }

    const handleOnline = () => {
      void onBackOnline()
    }

    window.addEventListener('offline', onOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const { phase, deviceOnline } = useConnectivityStore.getState()
      if (phase !== 'degraded' || !deviceOnline) return
      void (async () => {
        const ok = await refreshBackendStatus()
        if (ok) {
          await flushOfflineMutationQueue()
          dispatchVisibilityResync()
          useConnectivityStore.getState().setPhase('online')
        }
      })()
    }, 30_000)

    return () => window.clearInterval(id)
  }, [])
}

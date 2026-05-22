import { create } from 'zustand'

/** สถานะการเชื่อมต่อที่แสดงใน UI */
export type ConnectivityPhase = 'online' | 'offline' | 'degraded' | 'syncing'

export type ConnectivityState = {
  deviceOnline: boolean
  backendReachable: boolean | null
  phase: ConnectivityPhase
  pendingMutationCount: number
  usingOfflineCache: boolean
  flushingQueue: boolean
  setDeviceOnline: (online: boolean) => void
  setBackendReachable: (reachable: boolean | null) => void
  setPhase: (phase: ConnectivityPhase) => void
  setPendingMutationCount: (n: number) => void
  setUsingOfflineCache: (v: boolean) => void
  setFlushingQueue: (v: boolean) => void
}

function derivePhase(
  deviceOnline: boolean,
  backendReachable: boolean | null,
  explicit: ConnectivityPhase | null,
): ConnectivityPhase {
  if (explicit === 'syncing') return 'syncing'
  if (!deviceOnline) return 'offline'
  if (backendReachable === false) return 'degraded'
  return 'online'
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  deviceOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  backendReachable: null,
  phase: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online',
  pendingMutationCount: 0,
  usingOfflineCache: false,
  flushingQueue: false,

  setDeviceOnline: (deviceOnline) => {
    const { backendReachable, phase } = get()
    const next =
      phase === 'syncing' ? 'syncing' : derivePhase(deviceOnline, backendReachable, null)
    set({ deviceOnline, phase: next })
  },

  setBackendReachable: (backendReachable) => {
    const { deviceOnline, phase } = get()
    const next =
      phase === 'syncing' ? 'syncing' : derivePhase(deviceOnline, backendReachable, null)
    set({ backendReachable, phase: next })
  },

  setPhase: (phase) => {
    const { deviceOnline, backendReachable } = get()
    if (phase === 'syncing') {
      set({ phase: 'syncing' })
      return
    }
    set({
      phase:
        phase === 'online' || phase === 'offline' || phase === 'degraded'
          ? phase
          : derivePhase(deviceOnline, backendReachable, null),
    })
  },

  setPendingMutationCount: (pendingMutationCount) => set({ pendingMutationCount }),
  setUsingOfflineCache: (usingOfflineCache) => set({ usingOfflineCache }),
  setFlushingQueue: (flushingQueue) => set({ flushingQueue }),
}))

export function isFullyOnline(): boolean {
  return useConnectivityStore.getState().phase === 'online'
}

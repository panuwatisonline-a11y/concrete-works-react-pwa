import { create } from 'zustand'

export type PullRefreshHandler = () => void | Promise<void>

interface PullRefreshState {
  handler: PullRefreshHandler | null
  setHandler: (handler: PullRefreshHandler | null) => void
}

export const usePullRefreshStore = create<PullRefreshState>((set) => ({
  handler: null,
  setHandler: (handler) => set({ handler }),
}))

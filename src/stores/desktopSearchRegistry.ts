import { create } from 'zustand'

export interface DesktopSearchActive {
  id: string
  placeholder: string
  ariaLabel: string
  showRequestFilterButton: boolean
  getSearch: () => string
  setSearch: (v: string) => void
}

interface DesktopSearchRegistryState {
  active: DesktopSearchActive | null
  searchRevision: number
  setActive: (next: DesktopSearchActive | null) => void
  bumpSearch: () => void
}

export const useDesktopSearchRegistry = create<DesktopSearchRegistryState>((set, get) => ({
  active: null,
  searchRevision: 0,
  setActive: (next) => set({ active: next }),
  bumpSearch: () => set({ searchRevision: get().searchRevision + 1 }),
}))

export function unregisterDesktopSearchBar(id: string) {
  useDesktopSearchRegistry.setState((state) => {
    if (state.active?.id !== id) return state
    return { active: null, searchRevision: state.searchRevision + 1 }
  })
}

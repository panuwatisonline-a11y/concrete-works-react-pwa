import { create } from 'zustand'
import type { RequestFilter } from '@/types/app.types'

interface FilterState {
  filter: RequestFilter
  setFilter: (filter: Partial<RequestFilter>) => void
  resetFilter: () => void
  /** Shared sheet/dialog for search & filters (header, sidebar, desktop bar). */
  requestFiltersOpen: boolean
  setRequestFiltersOpen: (open: boolean) => void
}

const defaultFilter: RequestFilter = {
  status_ids: [],
  casting_date_from: null,
  casting_date_to: null,
  client_id: null,
  location_id: null,
  concrete_work_id: null,
  search: '',
}

export const useFilterStore = create<FilterState>((set) => ({
  filter: { ...defaultFilter },
  setFilter: (partial) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),
  resetFilter: () => set({ filter: { ...defaultFilter } }),
  requestFiltersOpen: false,
  setRequestFiltersOpen: (open) => set({ requestFiltersOpen: open }),
}))

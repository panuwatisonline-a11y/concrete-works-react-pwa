import { create } from 'zustand'

/** Super Admin: filter reads by job; 'all' = no filter. Inserts require a concrete job id. */
export type SuperAdminJobFilter = number | 'all'

interface JobFilterState {
  /** Active filter for super_admin queries; ignored for other roles. */
  superAdminJobFilter: SuperAdminJobFilter
  setSuperAdminJobFilter: (value: SuperAdminJobFilter) => void
}

export const useJobFilterStore = create<JobFilterState>((set) => ({
  superAdminJobFilter: 'all',
  setSuperAdminJobFilter: (value) => set({ superAdminJobFilter: value }),
}))

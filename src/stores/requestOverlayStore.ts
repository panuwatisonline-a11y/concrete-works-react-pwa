import { create } from 'zustand'
import type { RequestWithRelations } from '@/types/app.types'
import { useFilterStore } from '@/stores/filterStore'

export type WorkflowFeedTarget = {
  request: RequestWithRelations
  modal: string
}

interface RequestOverlayState {
  workflow: WorkflowFeedTarget | null
  workflowHostReady: boolean
  openWorkflow: (request: RequestWithRelations, modal: string) => void
  closeWorkflow: () => void
  openRequestFilters: () => void
  /** ปิด dialog / workflow ทั้งหมด — ใช้เมื่อสลับ mobile ↔ desktop */
  closeAllOverlays: () => void
}

export const useRequestOverlayStore = create<RequestOverlayState>((set) => ({
  workflow: null,
  workflowHostReady: false,
  openWorkflow: (request, modal) => {
    useFilterStore.getState().setRequestFiltersOpen(false)
    set({ workflowHostReady: true, workflow: { request, modal } })
  },
  closeWorkflow: () => set({ workflow: null }),
  openRequestFilters: () => {
    set({ workflow: null })
    useFilterStore.getState().setRequestFiltersOpen(true)
  },
  closeAllOverlays: () => {
    useFilterStore.getState().setRequestFiltersOpen(false)
    set({ workflow: null })
  },
}))

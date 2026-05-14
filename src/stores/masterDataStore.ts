import { create } from 'zustand'
import type {
  StatusItem, ClientItem, LocationItem, ConcreteWork, Structure,
  MixedCode, AbcCode, AbcCodeSegment, WbsCode, WbsSegment, Job,
} from '@/types/app.types'

interface MasterDataState {
  statuses: StatusItem[]
  clients: ClientItem[]
  locations: LocationItem[]
  concreteWorks: ConcreteWork[]
  structures: Structure[]
  mixcodes: MixedCode[]
  abcCodes: AbcCode[]
  abcCode1: AbcCodeSegment[]
  abcCode2: AbcCodeSegment[]
  abcCode3: AbcCodeSegment[]
  abcCode4: AbcCodeSegment[]
  wbsCodes: WbsCode[]
  wbs1: WbsSegment[]
  wbs2: WbsSegment[]
  wbs3: WbsSegment[]
  wbs4: WbsSegment[]
  wbs5: WbsSegment[]
  wbs6: WbsSegment[]
  wbs7: WbsSegment[]
  jobs: Job[]
  isLoaded: boolean
  setAll: (data: Partial<MasterDataState>) => void
  setLoaded: (loaded: boolean) => void
}

export const useMasterDataStore = create<MasterDataState>((set) => ({
  statuses: [],
  clients: [],
  locations: [],
  concreteWorks: [],
  structures: [],
  mixcodes: [],
  abcCodes: [],
  abcCode1: [],
  abcCode2: [],
  abcCode3: [],
  abcCode4: [],
  wbsCodes: [],
  wbs1: [],
  wbs2: [],
  wbs3: [],
  wbs4: [],
  wbs5: [],
  wbs6: [],
  wbs7: [],
  jobs: [],
  isLoaded: false,
  setAll: (data) => set((state) => ({ ...state, ...data })),
  setLoaded: (isLoaded) => set({ isLoaded }),
}))

/** Supabase row types for CST — synced from remote schema (May 2026) */

export type CompressionMachineRow = {
  id: number
  machine: string | null
  serial: string | null
  k1: number | null
  k2: number | null
  cal_date: string | null
  file: string | null
  k: string | null
  k_display: string | null
}

export type CompressionMachineInsert = {
  id?: number
  machine?: string | null
  serial?: string | null
  k1?: number | null
  k2?: number | null
  cal_date?: string | null
  file?: string | null
}

export type CompressionMachineUpdate = CompressionMachineInsert

type CstSampleFields = {
  [K in `sample${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: string | null
}

type CstWeightFields = {
  [K in `wt${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: number | null
}

type CstKnFields = {
  [K in `kn${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: number | null
}

type CstHeightFields = {
  [K in `height${1 | 2 | 3 | 4 | 5 | 6}`]: number | null
}

type CstDiameterFields = {
  [K in `diameter${1 | 2 | 3 | 4 | 5 | 6}`]: number | null
}

export type CstRow = {
  id: string
  ref: string | null
  file: string | null
  report_no: string | null
  test_date: string | null
  age: number | null
  sample_type: string | null
  machine_id: number | null
  created_at: string | null
  updated_at: string | null
} & CstSampleFields &
  CstWeightFields &
  CstKnFields &
  CstHeightFields &
  CstDiameterFields

export type CstInsert = {
  id?: string
  ref?: string | null
  file?: string | null
  report_no?: string | null
  test_date?: string | null
  age?: number | null
  sample_type?: string | null
  machine_id?: number | null
  created_at?: string | null
  updated_at?: string | null
} & Partial<CstSampleFields> &
  Partial<CstWeightFields> &
  Partial<CstKnFields> &
  Partial<CstHeightFields> &
  Partial<CstDiameterFields>

export type CstUpdate = CstInsert

type CstViewComputedFields = {
  [K in `adj${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: number | null
} & {
  [K in `density${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: number | null
} & {
  [K in `ksc${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`]: number | null
}

/** Row shape of view `CST_View` (joins Request_View + Compression Machine + calculations) */
export type CstViewRow = {
  id: string | null
  request_id: string | null
  file: string | null
  report_no: string | null
  test_date: string | null
  age: number | null
  sample_type: string | null
  machine_id: number | null
  machine_name: string | null
  machine_serial: string | null
  machine_k_formula: string | null
  k_display: string | null
  machine_cal_date: string | null
  k1: number | null
  k2: number | null
  full_wbs: string | null
  full_abc: string | null
  client_name: string | null
  full_location: string | null
  concrete_work: string | null
  structure_name: string | null
  structure_no: string | null
  mixcode: string | null
  supplier: string | null
  design_strength: number | null
  strength_type: string | null
  slump: string | null
  request_date: string | null
  casting_date: string | null
  volume_confirm: number | null
  section: number | null
  created_at: string | null
  updated_at: string | null
} & CstSampleFields &
  CstWeightFields &
  CstKnFields &
  CstHeightFields &
  CstDiameterFields &
  CstViewComputedFields

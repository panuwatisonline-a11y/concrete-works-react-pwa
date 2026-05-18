export type UserRole = 'admin' | 'manager' | 'user'
export type UserStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  employee_id: string | null
  fname: string | null
  lname: string | null
  phone: string | null
  role: UserRole
  status: UserStatus
  client_id: number | null
  client_name: string | null
  job_id: number | null
  avatar_url?: string | null
  created_at: string
}

export interface StatusItem {
  id: number
  status_name: string
  description: string | null
}

export interface ClientItem {
  id: number
  client_name: string
}

export interface LocationItem {
  id: number
  location1: string
  location2: string | null
  location3: string | null
  full_location: string | null
  description: string | null
}

export interface ConcreteWork {
  id: number
  concrete_work: string
  structure_list: string | null
}

export interface Structure {
  id: number
  structure_name: string
}

export interface MixedCode {
  id: number
  mixcode: string
  supplier: string | null
  strength: number | null
  strength_type: string | null
  sample_type: string | null
  slump: string | null
  qty: number | null
  structure_list: string | null
}

export interface AbcCodeSegment {
  id: number
  code_name: string
  description: string | null
}

export interface AbcCode {
  id: number
  abc_code1: number | null
  abc_code2: number | null
  abc_code3: number | null
  abc_code4: number | null
  full_abc: string | null
  description: string | null
}

export interface WbsSegment {
  id: number
  code_name: string
  description: string | null
}

export interface WbsCode {
  id: number
  wbs1: number | null
  wbs2: number | null
  wbs3: number | null
  wbs4: number | null
  wbs5: number | null
  wbs6: number | null
  wbs7: number | null
  full_wbs: string | null
  description: string | null
}

export interface Job {
  id: number
  job_name: string
}

/** เครื่องอัดคอนกรีต — ตาราง `Compression Machine` */
export interface CompressionMachine {
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

/** บันทึกผล CST (Compressive Strength Test) — ตาราง `CST` */
export type { CstRow as CstRecord } from './database.cst.types'

/** ผล CST พร้อมคำนวณจาก view `CST_View` — alias ของ database type */
export type { CstViewRow } from './database.cst.types'

/** อายุตัวอย่างมาตรฐานสำหรับ CST (วัน) */
export const CST_TEST_AGES = [1, 3, 7, 14, 28] as const
export type CstTestAge = (typeof CST_TEST_AGES)[number]

export interface Request {
  id: string
  status_id: number
  client_id: number | null
  location_id: number | null
  concrete_work_id: number | null
  structure_id: number | null
  structure_no: string | null
  mixcode_id: number | null
  abc_code_id: number | null
  wbs_code_id: number | null
  request_date: string | null
  request_time: string | null
  casting_date: string | null
  volume_request: number | null
  volume_dwg: number | null
  volume_actual: number | null
  volume_confirm: number | null
  volume_loss: number | null
  pct_loss: number | null
  sample_qty: number | null
  strength: number | null
  before_image: string | null
  after_image: string | null
  eslip_url: string | null
  checksheet_url: string | null
  remarks: string | null
  booked_by: string | null
  inspected_by: string | null
  approved_by: string | null
  rejected_by: string | null
  postponed_by: string | null
  cancelled_by: string | null
  confirmed_by: string | null
  booked_at: string | null
  inspected_at: string | null
  approved_at: string | null
  rejected_at: string | null
  postponed_at: string | null
  cancelled_at: string | null
  confirmed_at: string | null
  postpone_date: string | null
  postpone_time: string | null
  reason_postpone: string | null
  reason_reject: string | null
  reason_cancel: string | null
  /** สรุปการจอง: true=สำเร็จ, false=ไม่สำเร็จ, null/undefined=ยังไม่เช็ค */
  booking_ok?: boolean | null
}

export interface RequestLog {
  id: number
  request_id: string
  status_id: number | null
  action: string
  action_by: string | null
  note: string | null
  postpone_date: string | null
  postpone_time: string | null
  created_at: string
}

export interface RequestWithRelations extends Request {
  status?: StatusItem
  client?: ClientItem
  location?: LocationItem
  concrete_work?: ConcreteWork
  structure?: Structure
  mixcode?: MixedCode
  abc_code?: AbcCode
  wbs_code?: WbsCode
  booked_by_profile?: Profile
  inspected_by_profile?: Profile
  approved_by_profile?: Profile
}

export interface RequestLogWithProfile extends RequestLog {
  profile?: Profile
}

export interface RequestFilter {
  status_ids: number[]
  casting_date_from: string | null
  casting_date_to: string | null
  client_id: number | null
  location_id: number | null
  concrete_work_id: number | null
  search: string
}

/** Status chips — tuned for dark UI */
export const STATUS_COLORS: Record<number, string> = {
  1: 'border border-[rgba(163,163,163,0.35)] bg-[rgba(163,163,163,0.12)] text-[#d4d4d4]',
  2: 'border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.12)] text-[#fbbf24]',
  3: 'border border-[var(--pour-accent-ring)] bg-[var(--pour-accent-muted)] text-[color:var(--pour-accent)]',
  4: 'border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.12)] text-[#22d3ee]',
  5: 'border border-[rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.14)] text-[#fb923c]',
  6: 'border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[#f87171]',
  7: 'border border-dashed border-[color:var(--pour-line)] bg-[color:var(--glass-bg-muted)] text-pour-muted',
  8: 'border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]',
}

export const STATUS_LABELS: Record<number, string> = {
  1: 'รอตรวจสอบ',
  2: 'รอ อนุมัติ',
  3: 'อนุมัติแล้ว',
  4: 'สั่งเทแล้ว',
  5: 'เลื่อนวัน',
  6: 'Reject',
  7: 'Cancel',
  8: 'Complete',
}

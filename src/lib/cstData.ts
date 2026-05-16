import { supabase } from '@/lib/supabase'
import { activeCastingDateIso } from '@/lib/activeCastingDate'
import {
  CST_REPORT_NO_CASTING_FROM,
  cstReportNoFromSuffix,
  cstReportNoSuffix,
  suggestCstReportNo,
} from '@/lib/cstReportNo'
import type { CompressionMachine, CstRecord } from '@/types/app.types'
import type { CstViewRow } from '@/types/database.cst.types'

export async function fetchCompressionMachines(): Promise<CompressionMachine[]> {
  const { data, error } = await supabase
    .from('Compression Machine')
    .select('id, machine, serial, k1, k2, cal_date, file, k, k_display')
    .order('machine')

  if (error) throw error
  return (data ?? []) as CompressionMachine[]
}

const CST_REF_CHUNK = 180

/** อายุตัวอย่าง CST ที่บันทึกแล้ว แยกตาม request id */
export async function fetchCstAgesByRequestIds(
  requestIds: string[],
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>()
  if (!requestIds.length) return map

  for (let i = 0; i < requestIds.length; i += CST_REF_CHUNK) {
    const chunk = requestIds.slice(i, i + CST_REF_CHUNK)
    const { data, error } = await supabase.from('CST').select('ref, age').in('ref', chunk)
    if (error) throw error
    for (const row of data ?? []) {
      const ref = (row as { ref?: string | null }).ref
      const age = (row as { age?: number | null }).age
      if (!ref || age == null || Number.isNaN(age)) continue
      const list = map.get(ref) ?? []
      if (!list.includes(age)) list.push(age)
      map.set(ref, list)
    }
  }

  for (const [id, ages] of map) {
    map.set(
      id,
      ages.sort((a, b) => a - b),
    )
  }
  return map
}

/** รายการ CST ของคำขอเท (ทุกอายุ) */
export async function fetchCstByRequestId(requestId: string): Promise<CstRecord[]> {
  const { data, error } = await supabase
    .from('CST')
    .select('*')
    .eq('ref', requestId)
    .order('age')

  if (error) throw error
  return (data ?? []) as CstRecord[]
}

/** CST หนึ่งรายการตามอายุตัวอย่าง */
export async function fetchCstByRequestAndAge(
  requestId: string,
  age: number,
): Promise<CstRecord | null> {
  const { data, error } = await supabase
    .from('CST')
    .select('*')
    .eq('ref', requestId)
    .eq('age', age)
    .maybeSingle()

  if (error) throw error
  return (data as CstRecord | null) ?? null
}

/** ผล CST พร้อมคำนวณ (ksc, density, adj) จาก `CST_View` */
export async function fetchCstViewByRequestId(requestId: string): Promise<CstViewRow[]> {
  const { data, error } = await supabase
    .from('CST_View')
    .select('*')
    .eq('request_id', requestId)
    .order('age')

  if (error) throw error
  return (data ?? []) as CstViewRow[]
}

export async function fetchCstViewById(cstId: string): Promise<CstViewRow | null> {
  const { data, error } = await supabase.from('CST_View').select('*').eq('id', cstId).maybeSingle()

  if (error) throw error
  return (data as CstViewRow | null) ?? null
}

export async function fetchCstViewByRequestAndAge(
  requestId: string,
  age: number,
): Promise<CstViewRow | null> {
  const { data, error } = await supabase
    .from('CST_View')
    .select('*')
    .eq('request_id', requestId)
    .eq('age', age)
    .maybeSingle()

  if (error) throw error
  return (data as CstViewRow | null) ?? null
}

export async function upsertCstRecord(
  values: Record<string, unknown>,
  existingId?: string,
): Promise<CstRecord> {
  if (existingId) {
    const { data, error } = await supabase
      .from('CST')
      .update(values)
      .eq('id', existingId)
      .select('*')
      .single()
    if (error) throw error
    return data as CstRecord
  }

  const { data, error } = await supabase
    .from('CST')
    .insert({ ...values, created_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  return data as CstRecord
}

/** ลบบันทึกผล CST ตาม id */
export async function deleteCstRecord(id: string): Promise<void> {
  const { error } = await supabase.from('CST').delete().eq('id', id)
  if (error) throw error
}

/** จำนวนคำขอเท (ref) ที่มี CST และ Active Casting Date >= 2026-01-01 */
export async function countCstUniqueRefsSinceCastingEpoch(): Promise<number> {
  const { data: cstRows, error } = await supabase.from('CST').select('ref')
  if (error) throw error

  const refIds = [
    ...new Set(
      (cstRows ?? [])
        .map((r) => (r as { ref?: string | null }).ref)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  if (!refIds.length) return 0

  const { data: requests, error: reqErr } = await supabase
    .from('Request')
    .select('id, casting_date, postpone_date')
    .in('id', refIds)

  if (reqErr) throw reqErr

  let count = 0
  for (const req of requests ?? []) {
    const active = activeCastingDateIso(req as { casting_date?: string | null; postpone_date?: string | null })
    if (active && active >= CST_REPORT_NO_CASTING_FROM) count++
  }
  return count
}

/**
 * เลขที่รายงาน CST สำหรับคำขอเท + อายุทดสอบ:
 * - มี CST อายุอื่นแล้ว → ใช้ suffix 6 หลักเดิม แต่ R ตามอายุ (R1, R3, R7, …)
 * - ยังไม่มี → LAB-R{age}-CST- + ลำดับจากจำนวน ref ตั้งแต่ 2026-01-01
 */
export async function resolveCstReportNoForRequest(requestId: string, age: number): Promise<string> {
  const existing = await fetchCstByRequestId(requestId)
  for (const row of existing) {
    const suffix = cstReportNoSuffix(row.report_no)
    if (suffix) return cstReportNoFromSuffix(suffix, age)
  }
  const count = await countCstUniqueRefsSinceCastingEpoch()
  return suggestCstReportNo([], count, age)
}

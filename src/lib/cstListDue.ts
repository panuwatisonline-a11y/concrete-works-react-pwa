import { defaultCstTestDateIso } from '@/lib/cstForm'
import { CST_TEST_AGES, type CstTestAge, type RequestWithRelations } from '@/types/app.types'

/** ป้ายกลุ่มอายุ CST สำหรับ Filter / พิมพ์ */
export const CST_AGE_GROUP_LABELS_TH: Record<CstTestAge, string> = {
  1: '1 วัน',
  3: '3 วัน',
  7: '7 วัน',
  14: '14 วัน',
  28: '28 วัน',
}

/** วันที่ท้องถิ่น YYYY-MM-DD */
export function todayIsoLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** อายุ CST ที่ยังไม่บันทึกและวันทดสอบตรงกับวันนี้ */
export function cstAgesDueToday(
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>,
  savedAges: number[],
): CstTestAge[] {
  const today = todayIsoLocal()
  return CST_TEST_AGES.filter((age) => {
    if (savedAges.includes(age)) return false
    return defaultCstTestDateIso(request, age) === today
  })
}

export function isCstDueToday(
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>,
  savedAges: number[],
): boolean {
  return cstAgesDueToday(request, savedAges).length > 0
}

/** รายการที่วันทดสอบตามอายุ CST ตรงกับ testDateIso */
export function cstRequestsForAgeOnTestDate(
  requests: RequestWithRelations[],
  testDateIso: string,
  age: CstTestAge,
): RequestWithRelations[] {
  return requests.filter((r) => defaultCstTestDateIso(r, age) === testDateIso)
}

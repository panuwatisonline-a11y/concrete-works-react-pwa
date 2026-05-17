import { CST_AGE_GROUP_LABELS_TH } from '@/lib/cstListDue'
import type { CstFilterPrintPayload, CstFilterPrintRow } from '@/lib/cstFilterPrint'
import { CST_TEST_AGES, type CstTestAge } from '@/types/app.types'

export const CST_FILTER_SAMPLE_TEST_DATE_ISO = '2026-05-17'

export const CST_FILTER_SAMPLE_TARGET_ROWS = 80

const SAMPLE_ROWS_PER_AGE: Record<CstTestAge, number> = {
  1: 16,
  3: 16,
  7: 16,
  14: 16,
  28: 16,
}

export const CST_FILTER_SAMPLE_ROW_COUNT = Object.values(SAMPLE_ROWS_PER_AGE).reduce(
  (sum, n) => sum + n,
  0,
)

const WORKS = [
  'Overpass',
  'Bridge',
  'Tunnel',
  'Building',
  'Road',
  'Retaining wall',
  'Viaduct',
  'Station',
] as const

const STRUCTURES = [
  'Pier',
  'Deck',
  'Slab',
  'Footing',
  'Column',
  'Beam',
  'Pavement',
  'Wall',
  'Abutment',
  'Pile cap',
] as const

const LOCATIONS = [
  'Mainline KM 12+500 — ฝั่งขาออก',
  'Span 3 — ชั้นบน',
  'Section A — หลุมทาง A1',
  'Location1 - Location2 - Location3',
  'Tower B — ชั้น 8',
  'เลียบคลองบางบ่อ กม. 5+200',
  'Ramp ขึ้น-ลง ทิศเหนือ ช่วง R-02',
  'Box culvert ทางลอด ช่วง BC-07',
  'Foundation แนวรั้วทิศตะวันออก',
  'Slab on grade โซนคลังวัสดุ',
] as const

const MIX_CODES = [
  'A12345 · CPAC · 300 ksc.',
  'B240 · SCG · 240 ksc.',
  'C350 · CPAC · 350 ksc.',
  'A280 · TPI · 280 ksc.',
  'M300 · ท้องถิ่น · 300 ksc.',
  'D400 · CPAC · 400 ksc.',
  'E320 · SCG · 320 ksc.',
] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatCastingDateFromTest(testDateIso: string, age: CstTestAge): string {
  const d = new Date(`${testDateIso}T12:00:00`)
  d.setDate(d.getDate() - age)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function buildSampleRowsForAge(
  testDateIso: string,
  age: CstTestAge,
  count: number,
): CstFilterPrintRow[] {
  const castingDate = formatCastingDateFromTest(testDateIso, age)
  const rows: CstFilterPrintRow[] = []

  for (let i = 0; i < count; i += 1) {
    const work = WORKS[i % WORKS.length]
    const structure = STRUCTURES[(i + age) % STRUCTURES.length]
    const location = LOCATIONS[(i * 2 + age) % LOCATIONS.length]
    const mixCode = MIX_CODES[(i + age * 3) % MIX_CODES.length]
    const seq = String(i + 1).padStart(2, '0')
    const volume = (8 + ((i * 7 + age * 11) % 180) + (i % 10) * 0.25).toFixed(2)

    rows.push({
      castingDate,
      concreteWork: work,
      structure,
      location,
      structureNo: `${structure.slice(0, 1).toUpperCase()}-${age}-${seq}`,
      mixCode,
      volume,
    })
  }

  return rows
}

function buildCstFilterScheduleSample(testDateIso: string): CstFilterPrintPayload {
  return {
    testDateIso,
    groups: CST_TEST_AGES.map((age) => ({
      age,
      ageLabel: CST_AGE_GROUP_LABELS_TH[age],
      rows: buildSampleRowsForAge(testDateIso, age, SAMPLE_ROWS_PER_AGE[age]),
    })),
  }
}

export const CST_FILTER_SCHEDULE_SAMPLE: CstFilterPrintPayload = buildCstFilterScheduleSample(
  CST_FILTER_SAMPLE_TEST_DATE_ISO,
)

export function normalizeCstFilterSamplePayload(payload: CstFilterPrintPayload): CstFilterPrintPayload {
  const byAge = new Map(payload.groups.map((g) => [g.age, g]))
  return {
    testDateIso: payload.testDateIso,
    groups: CST_TEST_AGES.map((age) => {
      const existing = byAge.get(age)
      return (
        existing ?? {
          age,
          ageLabel: CST_AGE_GROUP_LABELS_TH[age],
          rows: [],
        }
      )
    }),
  }
}

export const CST_FILTER_SCHEDULE_SAMPLE_NORMALIZED = normalizeCstFilterSamplePayload(
  CST_FILTER_SCHEDULE_SAMPLE,
)

import { activeCastingDateIso } from '@/lib/activeCastingDate'
import {
  combineCstFilledReports,
  cstStrengthReportDataFromRequest,
  extractCstA4PageHtml,
  fillCstStrengthReportTemplate,
  injectCstMultiPageStyles,
  loadCstStrengthReportTemplate,
} from '@/lib/cstStrengthReportTemplate'
import {
  compressionMachineReportFields,
  cstViewRowToReportData,
  defaultCstTestDateIso,
} from '@/lib/cstForm'
import { fetchCompressionMachineById, fetchCstViewByRequestAndAge } from '@/lib/cstData'
import { injectPreviewScreenStyles } from '@/lib/localPrintChecklist'
import { supabase } from '@/lib/supabase'
import { formatDate, shortId } from '@/lib/utils'
import {
  CST_TEST_AGES,
  type CompressionMachine,
  type CstTestAge,
  type RequestWithRelations,
} from '@/types/app.types'

const CST_AGE_SET = new Set<number>(CST_TEST_AGES)

/** เรียงตามลำดับมาตรฐาน 1→28 และตัดอายุที่ไม่รองรับ */
export function normalizeCstTestAges(ages: Iterable<number>): CstTestAge[] {
  const seen = new Set<number>()
  for (const age of ages) {
    if (CST_AGE_SET.has(age)) seen.add(age)
  }
  return CST_TEST_AGES.filter((a) => seen.has(a))
}

export function parseCstAgesFromSearchParams(
  ageParam: string | null | undefined,
  agesParam: string | null | undefined,
): CstTestAge[] {
  if (agesParam?.trim()) {
    const nums = agesParam
      .split(/[,;\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
    return normalizeCstTestAges(nums)
  }
  const single = Number(ageParam?.trim() ?? '')
  if (Number.isFinite(single)) return normalizeCstTestAges([single])
  return []
}

export const CST_PREVIEW_PATH = '/print/cst'

const REQUEST_FOR_CST_PRINT_SELECT = `
  *,
  client:Client(id, client_name),
  location:Location(id, full_location, location1, location2, location3),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type, sample_type, supplier)
`

let templateCache: string | null = null

export function warmCstReportTemplateCache(): void {
  if (templateCache) return
  void loadCstStrengthReportTemplate().then((raw) => {
    templateCache = raw
  })
}

export async function fetchRequestForCstPrint(requestId: string): Promise<RequestWithRelations> {
  const { data, error } = await supabase
    .from('Request')
    .select(REQUEST_FOR_CST_PRINT_SELECT)
    .eq('id', requestId)
    .single()
  if (error) throw error
  if (!data) throw new Error('ไม่พบคำขอ')
  return data as RequestWithRelations
}

export async function buildCstReportHtml(
  request: RequestWithRelations,
  age: number,
): Promise<{ html: string; title: string }> {
  const view = await fetchCstViewByRequestAndAge(request.id, age)
  if (!view) throw new Error('ยังไม่มีผล CST — บันทึกก่อนพิมพ์รายงาน')

  const raw = templateCache ?? (await loadCstStrengthReportTemplate())
  templateCache = raw
  const data = cstViewRowToReportData(view, request)
  const filled = fillCstStrengthReportTemplate(raw, data)
  const label = view.report_no?.trim() || `+${age}d`

  return {
    html: injectPreviewScreenStyles(filled),
    title: `CST · ${shortId(request.id)} · ${label}`,
  }
}

export async function loadCstPreviewForRequest(
  requestId: string,
  age: number,
): Promise<{ html: string; title: string }> {
  const [req] = await Promise.all([
    fetchRequestForCstPrint(requestId),
    loadCstStrengthReportTemplate().then((raw) => {
      templateCache = raw
    }),
  ])
  return buildCstReportHtml(req, age)
}

function fillCstBlankReportData(
  request: RequestWithRelations,
  age: number,
  machine?: CompressionMachine | null,
) {
  const machineFields = machine ? compressionMachineReportFields(machine) : null
  const castingIso = activeCastingDateIso(request)
  const testDateIso = defaultCstTestDateIso(request, age)
  const data = cstStrengthReportDataFromRequest(request, {
    castingDateFormatted: castingIso ? formatDate(`${castingIso}T12:00:00`) : undefined,
    testDateFormatted: formatDate(`${testDateIso}T12:00:00`),
    age: String(age),
    testMachine: machineFields?.testMachine ?? '',
    serialNo: machineFields?.serialNo ?? '',
    factor: machineFields?.factor ?? '',
  })
  data.reportNumber = ''
  if (!machine) {
    data.testMachine = ''
    data.serialNo = ''
    data.factor = ''
  }
  return data
}

/** แบบฟอร์มว่างสำหรับแล็บ — ข้อมูลงาน (+ เครื่องกดถ้าเลือก) ยกเว้นเลขรายงานและผลทดสอบ */
export async function buildCstBlankReportHtml(
  request: RequestWithRelations,
  ages: number[],
  machine?: CompressionMachine | null,
): Promise<{ html: string; title: string }> {
  const normalized = normalizeCstTestAges(ages)
  if (!normalized.length) throw new Error('เลือกอายุตัวอย่างอย่างน้อย 1 รายการ')

  const raw = templateCache ?? (await loadCstStrengthReportTemplate())
  templateCache = raw

  const pageFragments: string[] = []
  let shellFilled: string | null = null

  for (const age of normalized) {
    const filled = fillCstStrengthReportTemplate(raw, fillCstBlankReportData(request, age, machine))
    if (!shellFilled) shellFilled = filled
    pageFragments.push(extractCstA4PageHtml(filled))
  }

  const combined =
    normalized.length === 1
      ? shellFilled!
      : combineCstFilledReports(pageFragments, shellFilled!)

  const styleInject =
    normalized.length > 1
      ? injectCstMultiPageStyles(injectPreviewScreenStyles(combined))
      : injectPreviewScreenStyles(combined)

  const ageLabel = normalized.map((a) => `+${a}d`).join(', ')
  return {
    html: styleInject,
    title: `CST Blank · ${shortId(request.id)} · ${ageLabel}`,
  }
}

export async function loadCstBlankPreviewForRequest(
  requestId: string,
  ages: number[],
  machineId?: number | null,
): Promise<{ html: string; title: string }> {
  const hasMachine = machineId != null && Number.isFinite(machineId) && machineId > 0
  const [req, machine] = await Promise.all([
    fetchRequestForCstPrint(requestId),
    hasMachine ? fetchCompressionMachineById(machineId) : Promise.resolve(null),
    loadCstStrengthReportTemplate().then((raw) => {
      templateCache = raw
    }),
  ])
  return buildCstBlankReportHtml(req, ages, machine)
}

function cstPreviewUrl(
  requestId: string,
  ages: CstTestAge[],
  blank: boolean,
  machineId?: number,
): string {
  const params = new URLSearchParams({ requestId })
  if (ages.length === 1) {
    params.set('age', String(ages[0]))
  } else {
    params.set('ages', ages.join(','))
  }
  if (blank) {
    params.set('blank', '1')
    if (machineId != null) params.set('machineId', String(machineId))
  }
  return `${window.location.origin}${CST_PREVIEW_PATH}?${params.toString()}`
}

export function openCstPrintPreview(requestId: string, age: number): void {
  const url = cstPreviewUrl(requestId, normalizeCstTestAges([age]), false)
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

export function openCstBlankPrintPreview(
  requestId: string,
  ages: number[],
  machineId?: number | null,
): void {
  const normalized = normalizeCstTestAges(ages)
  if (!normalized.length) throw new Error('เลือกอายุตัวอย่างอย่างน้อย 1 รายการ')
  const mid =
    machineId != null && Number.isFinite(machineId) && machineId > 0 ? machineId : undefined
  const url = cstPreviewUrl(requestId, normalized, true, mid)
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

/** เปิดแท็บพรีวิวรายงาน CST จากเทมเพลต `public/templates/cst-strength-report.html` */
export function localPrintCstReport(request: RequestWithRelations, age: number): void {
  openCstPrintPreview(request.id, age)
}

/** เปิดแท็บพิมพ์แบบฟอร์ม CST ว่าง — รองรับหลายอายุต่อกันหลายหน้า */
export function localPrintCstBlankReport(
  request: RequestWithRelations,
  ages: number | number[],
  machineId?: number | null,
): void {
  const list = Array.isArray(ages) ? ages : [ages]
  openCstBlankPrintPreview(request.id, list, machineId)
}

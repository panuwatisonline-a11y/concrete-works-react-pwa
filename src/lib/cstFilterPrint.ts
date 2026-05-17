import { format } from 'date-fns'
import { CST_FILTER_SCHEDULE_SAMPLE_NORMALIZED } from '@/lib/cstFilterSampleData'
import { fetchAllCstListRequests } from '@/lib/cstListData'
import { CST_AGE_GROUP_LABELS_TH, cstRequestsForAgeOnTestDate } from '@/lib/cstListDue'
import { cstMixCodeLabel, getCstListRowFields } from '@/lib/cstListRow'
import { injectCstFilterDocumentStyles } from '@/lib/localPrintChecklist'
import { formatDate } from '@/lib/utils'
import { CST_TEST_AGES, type CstTestAge, type RequestWithRelations } from '@/types/app.types'

export const CST_FILTER_SCHEDULE_TEMPLATE_PATH = '/templates/cst-filter-schedule.html'
export const CST_FILTER_PREVIEW_PATH = '/print/cst-filter'

export type CstFilterPrintRow = {
  castingDate: string
  concreteWork: string
  structure: string
  location: string
  structureNo: string
  mixCode: string
  volume: string
}

export type CstFilterPrintGroup = {
  age: CstTestAge
  ageLabel: string
  rows: CstFilterPrintRow[]
}

export type CstFilterPrintPayload = {
  testDateIso: string
  groups: CstFilterPrintGroup[]
}

type CstFilterTemplateFillData = {
  documentTitle: string
  testDateDisplay: string
  printedAt: string
  totalCount: string
  sectionsHtml: string
  pageLabel: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cell(value: string): string {
  const t = value.trim()
  return escapeHtml(t || '-')
}

function requestToPrintRow(r: RequestWithRelations): CstFilterPrintRow {
  const f = getCstListRowFields(r)
  return {
    castingDate: f.castingDate,
    concreteWork: f.concrete ?? '-',
    structure: f.structure ?? '-',
    location: f.location ?? '-',
    structureNo: f.structureNo ?? '-',
    mixCode: cstMixCodeLabel(f.mix),
    volume: f.volume,
  }
}

export function normalizeCstFilterPrintGroups(groups: CstFilterPrintGroup[]): CstFilterPrintGroup[] {
  const byAge = new Map(groups.map((g) => [g.age, g]))
  return CST_TEST_AGES.map((age) => {
    const existing = byAge.get(age)
    return (
      existing ?? {
        age,
        ageLabel: CST_AGE_GROUP_LABELS_TH[age],
        rows: [],
      }
    )
  })
}

export function buildCstFilterPrintPayload(
  requests: RequestWithRelations[],
  testDateIso: string,
): CstFilterPrintPayload {
  const groups: CstFilterPrintGroup[] = CST_TEST_AGES.map((age) => {
    const list = cstRequestsForAgeOnTestDate(requests, testDateIso, age)
    return {
      age,
      ageLabel: CST_AGE_GROUP_LABELS_TH[age],
      rows: list.map(requestToPrintRow),
    }
  })
  return { testDateIso, groups }
}

function buildDataRowHtml(row: CstFilterPrintRow): string {
  return `<tr>
  <td class="col-date">${cell(row.castingDate)}</td>
  <td class="col-work">${cell(row.concreteWork)}</td>
  <td class="col-structure">${cell(row.structure)}</td>
  <td class="col-location">${cell(row.location)}</td>
  <td class="col-no">${cell(row.structureNo)}</td>
  <td class="col-mix">${cell(row.mixCode)}</td>
  <td class="col-vol">${cell(row.volume)}</td>
</tr>`
}

const SCHEDULE_TABLE_HEAD = `<table class="schedule-table">
  <thead>
    <tr>
      <th class="col-date">Casting date</th>
      <th class="col-work">Concrete Work</th>
      <th class="col-structure">Structure</th>
      <th class="col-location">Location</th>
      <th class="col-no">Structure No.</th>
      <th class="col-mix">Mix Code</th>
      <th class="col-vol">Volume</th>
    </tr>
  </thead>
  <tbody>`

export function buildUnifiedScheduleTableHtml(groups: CstFilterPrintGroup[]): string {
  const normalized = normalizeCstFilterPrintGroups(groups)
  const bodyLines: string[] = []

  for (const group of normalized) {
    bodyLines.push(`<tr class="group-age-row">
  <td colspan="7">${escapeHtml(group.ageLabel)} · ${group.rows.length} รายการ</td>
</tr>`)
    if (group.rows.length) {
      for (const row of group.rows) {
        bodyLines.push(buildDataRowHtml(row))
      }
    } else {
      bodyLines.push(`<tr class="group-empty-row">
  <td colspan="7">ไม่มีรายการ</td>
</tr>`)
    }
  }

  return `${SCHEDULE_TABLE_HEAD}
${bodyLines.join('\n')}
  </tbody>
</table>`
}

function fillCstFilterScheduleTemplate(html: string, data: CstFilterTemplateFillData): string {
  let out = html
  for (const [key, value] of Object.entries(data)) {
    out = out.split(`{{${key}}}`).join(value)
  }
  return out
}

let templateCache: string | null = null

export async function loadCstFilterScheduleTemplate(): Promise<string> {
  if (templateCache) return templateCache
  const res = await fetch(CST_FILTER_SCHEDULE_TEMPLATE_PATH)
  if (!res.ok) throw new Error(`โหลดเทมเพลตรายการ CST ไม่สำเร็จ: ${res.status}`)
  templateCache = await res.text()
  return templateCache
}

export function warmCstFilterScheduleTemplateCache(): void {
  if (templateCache) return
  void loadCstFilterScheduleTemplate()
}

function buildTemplateFillMeta(payload: CstFilterPrintPayload) {
  const normalized = normalizeCstFilterPrintGroups(payload.groups)
  const testDateDisplay =
    payload.testDateIso && formatDate(`${payload.testDateIso}T12:00:00`) !== '-'
      ? formatDate(`${payload.testDateIso}T12:00:00`)
      : payload.testDateIso
  return {
    documentTitle: `CST Schedule · ${testDateDisplay}`,
    testDateDisplay: escapeHtml(testDateDisplay),
    printedAt: escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm')),
    totalCount: String(normalized.reduce((sum, g) => sum + g.rows.length, 0)),
    groups: normalized,
  }
}

export async function buildCstFilterScheduleHtml(
  payload: CstFilterPrintPayload,
): Promise<{ html: string; title: string }> {
  const raw = templateCache ?? (await loadCstFilterScheduleTemplate())
  templateCache = raw
  const meta = buildTemplateFillMeta(payload)
  const filled = fillCstFilterScheduleTemplate(raw, {
    documentTitle: meta.documentTitle,
    testDateDisplay: meta.testDateDisplay,
    printedAt: meta.printedAt,
    totalCount: meta.totalCount,
    sectionsHtml: buildUnifiedScheduleTableHtml(meta.groups),
    pageLabel: '',
  })

  return {
    html: injectCstFilterDocumentStyles(filled),
    title: meta.documentTitle,
  }
}

export async function loadCstFilterPreviewForSchedule(
  testDateIso: string,
  search = '',
): Promise<{ html: string; title: string }> {
  const [requests] = await Promise.all([
    fetchAllCstListRequests({
      search,
      castingDateFrom: null,
      castingDateTo: null,
    }),
    loadCstFilterScheduleTemplate().then((raw) => {
      templateCache = raw
    }),
  ])
  const payload = buildCstFilterPrintPayload(requests, testDateIso)
  return buildCstFilterScheduleHtml(payload)
}

export function openCstFilterPrintPreview(testDateIso: string, search = ''): void {
  const params = new URLSearchParams({ testDate: testDateIso })
  if (search.trim()) params.set('search', search.trim())
  const url = `${window.location.origin}${CST_FILTER_PREVIEW_PATH}?${params.toString()}`
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

export function localPrintCstFilterSchedule(testDateIso: string, search = ''): void {
  openCstFilterPrintPreview(testDateIso, search)
}

export async function buildCstFilterSchedulePreviewSample(): Promise<{
  html: string
  title: string
}> {
  return buildCstFilterScheduleHtml(CST_FILTER_SCHEDULE_SAMPLE_NORMALIZED)
}

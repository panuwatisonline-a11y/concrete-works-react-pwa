import { format } from 'date-fns'
import {
  fetchConcreteSummaryRequests,
  fetchCstViewsByRequestIds,
  indexCstViewsByRequestAndAge,
} from '@/lib/concreteSummaryData'
import {
  buildConcreteSummaryRowFields,
  collectStructureOptionsFromRequests,
  concreteSummaryMatchesSearch,
  requestMatchesStructureFilter,
  sortConcreteSummaryRequests,
  toConcreteSummaryPrintRow,
  type ConcreteSummaryPrintRow,
} from '@/lib/concreteSummaryRow'
import {
  CST_REPORT_ORG_LINE,
  CST_REPORT_PROJECT_TITLE_TH,
} from '@/lib/cstReportBranding'
import { injectConcreteSummaryDocumentStyles } from '@/lib/localPrintChecklist'
import { formatDate } from '@/lib/utils'
export const CONCRETE_SUMMARY_TEMPLATE_PATH = '/templates/concrete-summary.html'
export const CONCRETE_SUMMARY_PREVIEW_PATH = '/print/concrete-summary'

const ALL_STRUCTURES = 'all'

export type ConcreteSummaryPrintQuery = {
  dateFrom: string
  dateTo: string
  structureId: string
  search: string
}

export type ConcreteSummaryPrintPayload = {
  dateFrom: string
  dateTo: string
  structureDisplay: string
  rows: ConcreteSummaryPrintRow[]
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
  return escapeHtml(value.trim() || '-')
}

function formatDateRangeLabel(dateFrom: string, dateTo: string): string {
  const a = dateFrom.trim() ? formatDate(`${dateFrom.trim()}T12:00:00`) : '—'
  const b = dateTo.trim() ? formatDate(`${dateTo.trim()}T12:00:00`) : '—'
  if (!dateFrom.trim() && !dateTo.trim()) return 'ทุกวันเท'
  if (dateFrom.trim() && dateTo.trim()) return `${a} – ${b}`
  if (dateFrom.trim()) return `ตั้งแต่ ${a}`
  return `ถึง ${b}`
}

const SUMMARY_TABLE_HEAD = `<table class="summary-table">
  <thead>
    <tr>
      <th class="col-item">Item</th>
      <th class="col-date">Casting Date</th>
      <th class="col-work">Concrete Works</th>
      <th class="col-structure">Structure</th>
      <th class="col-location">Location</th>
      <th class="col-no">Structure No.</th>
      <th class="col-supplier">Supplier</th>
      <th class="col-slump">Slump</th>
      <th class="col-mix">Mix Code</th>
      <th class="col-req">Req. Strength</th>
      <th class="col-avg">Avg 1 Day</th>
      <th class="col-avg">Avg 7 Days</th>
      <th class="col-avg">Avg 14 Days</th>
      <th class="col-avg">Avg 28 Days</th>
      <th class="col-result">Result</th>
    </tr>
  </thead>
  <tbody>`

function buildDataRowHtml(row: ConcreteSummaryPrintRow): string {
  return `<tr>
  <td class="col-item">${cell(String(row.item))}</td>
  <td class="col-date">${cell(row.castingDate)}</td>
  <td class="col-work">${cell(row.concreteWorks)}</td>
  <td class="col-structure">${cell(row.structure)}</td>
  <td class="col-location">${cell(row.location)}</td>
  <td class="col-no">${cell(row.structureNo)}</td>
  <td class="col-supplier">${cell(row.supplier)}</td>
  <td class="col-slump">${cell(row.slump)}</td>
  <td class="col-mix">${cell(row.mixCode)}</td>
  <td class="col-req">${cell(row.reqStrength)}</td>
  <td class="col-avg">${cell(row.avg1)}</td>
  <td class="col-avg">${cell(row.avg7)}</td>
  <td class="col-avg">${cell(row.avg14)}</td>
  <td class="col-avg">${cell(row.avg28)}</td>
  <td class="col-result">${cell(row.result)}</td>
</tr>`
}

export function buildConcreteSummaryTableHtml(rows: ConcreteSummaryPrintRow[]): string {
  if (!rows.length) {
    return `${SUMMARY_TABLE_HEAD}
    <tr class="empty-row"><td colspan="15">ไม่มีรายการ</td></tr>
  </tbody>
</table>`
  }
  return `${SUMMARY_TABLE_HEAD}
${rows.map(buildDataRowHtml).join('\n')}
  </tbody>
</table>`
}

type TemplateFillData = {
  documentTitle: string
  cstOrgLine: string
  cstProjectTitle: string
  dateRangeDisplay: string
  structureDisplay: string
  printedAt: string
  totalCount: string
  tableHtml: string
  pageLabel: string
}

function fillTemplate(html: string, data: TemplateFillData): string {
  let out = html
  for (const [key, value] of Object.entries(data)) {
    out = out.split(`{{${key}}}`).join(value)
  }
  return out
}

let templateCache: string | null = null

export async function loadConcreteSummaryTemplate(): Promise<string> {
  if (templateCache) return templateCache
  const res = await fetch(CONCRETE_SUMMARY_TEMPLATE_PATH)
  if (!res.ok) throw new Error(`โหลดเทมเพลต Concrete Summary ไม่สำเร็จ: ${res.status}`)
  templateCache = await res.text()
  return templateCache
}

export function warmConcreteSummaryTemplateCache(): void {
  if (templateCache) return
  void loadConcreteSummaryTemplate()
}

export async function loadConcreteSummaryPrintPayload(
  query: ConcreteSummaryPrintQuery,
): Promise<ConcreteSummaryPrintPayload> {
  const dateFrom = query.dateFrom.trim()
  const dateTo = query.dateTo.trim()
  const structureId = query.structureId.trim() || ALL_STRUCTURES
  const searchQ = query.search.trim().toLowerCase()

  const requests = await fetchConcreteSummaryRequests({
    castingDateFrom: dateFrom || null,
    castingDateTo: dateTo || null,
    structureId: null,
  })
  const cstByRequest = indexCstViewsByRequestAndAge(
    await fetchCstViewsByRequestIds(requests.map((r) => r.id)),
  )

  const structureOptions = collectStructureOptionsFromRequests(requests)
  const structureDisplay =
    structureId === ALL_STRUCTURES
      ? 'ทุกโครงสร้าง'
      : (structureOptions.find((s) => String(s.id) === structureId)?.name ?? '—')

  const byStructure = requests.filter((r) =>
    requestMatchesStructureFilter(r, structureId, ALL_STRUCTURES),
  )

  const matched = byStructure.filter((r) =>
    concreteSummaryMatchesSearch(r, cstByRequest.get(r.id), searchQ),
  )
  const rows = sortConcreteSummaryRequests(matched).map((r, i) => {
    const fields = buildConcreteSummaryRowFields(r, cstByRequest.get(r.id))
    return toConcreteSummaryPrintRow(i + 1, fields)
  })

  return {
    dateFrom,
    dateTo,
    structureDisplay,
    rows,
  }
}

export async function buildConcreteSummaryHtml(
  payload: ConcreteSummaryPrintPayload,
): Promise<{ html: string; title: string }> {
  const raw = templateCache ?? (await loadConcreteSummaryTemplate())
  templateCache = raw

  const dateRangeDisplay = formatDateRangeLabel(payload.dateFrom, payload.dateTo)
  const documentTitle = `Concrete Summary · ${dateRangeDisplay}`

  const filled = fillTemplate(raw, {
    documentTitle,
    cstOrgLine: escapeHtml(CST_REPORT_ORG_LINE),
    cstProjectTitle: escapeHtml(CST_REPORT_PROJECT_TITLE_TH),
    dateRangeDisplay: escapeHtml(dateRangeDisplay),
    structureDisplay: escapeHtml(payload.structureDisplay),
    printedAt: escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm')),
    totalCount: String(payload.rows.length),
    tableHtml: buildConcreteSummaryTableHtml(payload.rows),
    pageLabel: '',
  })

  return {
    html: injectConcreteSummaryDocumentStyles(filled),
    title: documentTitle,
  }
}

export async function loadConcreteSummaryPreview(
  query: ConcreteSummaryPrintQuery,
): Promise<{ html: string; title: string }> {
  await loadConcreteSummaryTemplate()
  const payload = await loadConcreteSummaryPrintPayload(query)
  return buildConcreteSummaryHtml(payload)
}

export function openConcreteSummaryPrintPreview(query: ConcreteSummaryPrintQuery): void {
  const params = new URLSearchParams()
  if (query.dateFrom.trim()) params.set('from', query.dateFrom.trim())
  if (query.dateTo.trim()) params.set('to', query.dateTo.trim())
  if (query.structureId.trim() && query.structureId.trim() !== ALL_STRUCTURES) {
    params.set('structure', query.structureId.trim())
  }
  if (query.search.trim()) params.set('search', query.search.trim())

  const qs = params.toString()
  const url = `${window.location.origin}${CONCRETE_SUMMARY_PREVIEW_PATH}${qs ? `?${qs}` : ''}`
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

export function localPrintConcreteSummary(query: ConcreteSummaryPrintQuery): void {
  openConcreteSummaryPrintPreview(query)
}

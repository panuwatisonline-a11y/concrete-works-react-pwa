import { format } from 'date-fns'
import { fetchBookingSummaryForDate } from '@/lib/bookingSummaryData'
import {
  bookingSummaryMatchesSearch,
  bookingSummaryMatchesSupplierFilter,
  bookingSummarySupplierFilterLabel,
  toBookingSummaryPrintRow,
  type BookingSummaryPrintRow,
} from '@/lib/bookingSummaryRow'
import {
  CST_REPORT_ORG_LINE,
  CST_REPORT_PROJECT_TITLE_TH,
} from '@/lib/cstReportBranding'
import { injectBookingSummaryDocumentStyles } from '@/lib/localPrintChecklist'
import { formatDate } from '@/lib/utils'

export const BOOKING_SUMMARY_TEMPLATE_PATH = '/templates/booking-summary.html'
export const BOOKING_SUMMARY_PREVIEW_PATH = '/print/booking-summary'

export type BookingSummaryPrintQuery = {
  castingDateIso: string
  supplier: string
  search: string
}

export type BookingSummaryPrintPayload = {
  castingDateIso: string
  supplierDisplay: string
  rows: BookingSummaryPrintRow[]
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

const SUMMARY_TABLE_HEAD = `<table class="summary-table">
  <thead>
    <tr>
      <th class="col-item">Item</th>
      <th class="col-time">Time</th>
      <th class="col-booker">Request by</th>
      <th class="col-phone">Phone</th>
      <th class="col-work">Concrete Work</th>
      <th class="col-location">Location</th>
      <th class="col-structure">Structure</th>
      <th class="col-no">Structure No.</th>
      <th class="col-mix">Mix code</th>
      <th class="col-strength">Strength</th>
      <th class="col-slump">Slump</th>
      <th class="col-volume">Volume</th>
      <th class="col-supplier">Supplier</th>
      <th class="col-remark">Remark</th>
      <th class="col-ok">Accept/No</th>
    </tr>
  </thead>
  <tbody>`

function buildDataRowHtml(row: BookingSummaryPrintRow): string {
  return `<tr>
  <td class="col-item">${cell(String(row.item))}</td>
  <td class="col-time">${cell(row.time)}</td>
  <td class="col-booker">${cell(row.booker)}</td>
  <td class="col-phone">${cell(row.bookerPhone)}</td>
  <td class="col-work">${cell(row.concrete)}</td>
  <td class="col-location">${cell(row.location)}</td>
  <td class="col-structure">${cell(row.structure)}</td>
  <td class="col-no">${cell(row.structureNo)}</td>
  <td class="col-mix">${cell(row.mixcode)}</td>
  <td class="col-strength">${cell(row.strength)}</td>
  <td class="col-slump">${cell(row.slump)}</td>
  <td class="col-volume">${cell(row.volume)}</td>
  <td class="col-supplier">${cell(row.supplier)}</td>
  <td class="col-remark">${cell(row.remark)}</td>
  <td class="col-ok">${cell(row.acceptNo)}</td>
</tr>`
}

export function buildBookingSummaryTableHtml(rows: BookingSummaryPrintRow[]): string {
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
  castingDateDisplay: string
  supplierDisplay: string
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

export async function loadBookingSummaryTemplate(): Promise<string> {
  if (templateCache) return templateCache
  const res = await fetch(BOOKING_SUMMARY_TEMPLATE_PATH)
  if (!res.ok) throw new Error(`โหลดเทมเพลตสรุปการจองไม่สำเร็จ: ${res.status}`)
  templateCache = await res.text()
  return templateCache
}

export function warmBookingSummaryTemplateCache(): void {
  if (templateCache) return
  void loadBookingSummaryTemplate()
}

export async function loadBookingSummaryPrintPayload(
  query: BookingSummaryPrintQuery,
  opts?: { clientId?: number | null },
): Promise<BookingSummaryPrintPayload> {
  const castingDateIso = query.castingDateIso.trim()
  const supplier = query.supplier.trim()
  const searchQ = query.search.trim().toLowerCase()

  const requests = castingDateIso
    ? await fetchBookingSummaryForDate({ castingDateIso, clientId: opts?.clientId ?? null })
    : []

  const matched = requests.filter(
    (r) =>
      bookingSummaryMatchesSearch(r, searchQ) &&
      bookingSummaryMatchesSupplierFilter(r, supplier),
  )

  const rows = matched.map((r, i) => toBookingSummaryPrintRow(i + 1, r))

  return {
    castingDateIso,
    supplierDisplay: bookingSummarySupplierFilterLabel(supplier),
    rows,
  }
}

export async function buildBookingSummaryHtml(
  payload: BookingSummaryPrintPayload,
): Promise<{ html: string; title: string }> {
  const raw = templateCache ?? (await loadBookingSummaryTemplate())
  templateCache = raw

  const castingDateDisplay =
    payload.castingDateIso && formatDate(`${payload.castingDateIso}T12:00:00`) !== '-'
      ? formatDate(`${payload.castingDateIso}T12:00:00`)
      : payload.castingDateIso || '—'

  const documentTitle = `สรุปรายการจองคอนกรีต · ${castingDateDisplay}`

  const filled = fillTemplate(raw, {
    documentTitle,
    cstOrgLine: escapeHtml(CST_REPORT_ORG_LINE),
    cstProjectTitle: escapeHtml(CST_REPORT_PROJECT_TITLE_TH),
    castingDateDisplay: escapeHtml(castingDateDisplay),
    supplierDisplay: escapeHtml(payload.supplierDisplay),
    printedAt: escapeHtml(format(new Date(), 'dd/MM/yyyy HH:mm')),
    totalCount: String(payload.rows.length),
    tableHtml: buildBookingSummaryTableHtml(payload.rows),
    pageLabel: '',
  })

  return {
    html: injectBookingSummaryDocumentStyles(filled),
    title: documentTitle,
  }
}

export async function loadBookingSummaryPreview(
  query: BookingSummaryPrintQuery,
  opts?: { clientId?: number | null },
): Promise<{ html: string; title: string }> {
  await loadBookingSummaryTemplate()
  const payload = await loadBookingSummaryPrintPayload(query, opts)
  return buildBookingSummaryHtml(payload)
}

export function openBookingSummaryPrintPreview(query: BookingSummaryPrintQuery): void {
  const params = new URLSearchParams()
  if (query.castingDateIso.trim()) params.set('date', query.castingDateIso.trim())
  if (query.supplier.trim()) params.set('supplier', query.supplier.trim())
  if (query.search.trim()) params.set('search', query.search.trim())

  const qs = params.toString()
  const url = `${window.location.origin}${BOOKING_SUMMARY_PREVIEW_PATH}${qs ? `?${qs}` : ''}`
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

export function localPrintBookingSummary(query: BookingSummaryPrintQuery): void {
  openBookingSummaryPrintPreview(query)
}

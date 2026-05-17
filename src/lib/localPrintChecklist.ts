/** ความสูง A4 ที่ 96dpi — ใช้คำนวณย่อทั้งหน้าตอนพิมพ์ checklist */
export const A4_PRINT_HEIGHT_PX = Math.round((297 * 96) / 25.4)

const CHECKLIST_PRINT_FIT_FIX = `<style id="cw-checklist-print-fit-fix">
@media print {
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  .a4-page[data-print-doc="checklist"] {
    min-height: 0 !important;
    height: auto !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
</style>`

/** CSS สำหรับพรีวิวบนจอ — ใช้ได้ทั้ง checklist และ CST */
export function injectPreviewScreenStyles(html: string): string {
  const fix = `<style id="cw-preview-screen-fix">
@media screen {
  html, body {
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    height: auto !important;
    min-height: 100%;
  }
  body {
    background: #fff !important;
    padding: 0 !important;
  }
  .a4-page {
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 2px 16px rgba(15, 23, 42, 0.1);
  }
}
</style>`

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${fix}</head>`)
  }
  return fix + html
}

/** CSS พิมพ์เฉพาะ checklist — อย่าใส่ใน CST (ทำลาย flex footer) */
export function injectChecklistPrintStyles(html: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${CHECKLIST_PRINT_FIT_FIX}</head>`)
  }
  return CHECKLIST_PRINT_FIT_FIX + html
}

export function injectChecklistDocumentStyles(html: string): string {
  return injectChecklistPrintStyles(injectPreviewScreenStyles(html))
}

const CST_FILTER_PRINT_STYLES = `<style id="cw-cst-filter-print-fix">
@media print {
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  .a4-page[data-print-doc="cst-filter"] {
    min-height: 0 !important;
    height: auto !important;
  }
  .schedule-table thead {
    display: table-header-group;
  }
  .schedule-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>`

export function injectCstFilterDocumentStyles(html: string): string {
  const withScreen = injectPreviewScreenStyles(html)
  if (/<\/head>/i.test(withScreen)) {
    return withScreen.replace(/<\/head>/i, `${CST_FILTER_PRINT_STYLES}</head>`)
  }
  return CST_FILTER_PRINT_STYLES + withScreen
}

const CONCRETE_SUMMARY_PRINT_STYLES = `<style id="cw-concrete-summary-print-fix">
@media print {
  html, body {
    height: auto !important;
    overflow: visible !important;
  }
  .a4-page[data-print-doc="concrete-summary"] {
    min-height: 0 !important;
    height: auto !important;
  }
  .summary-table thead {
    display: table-header-group;
  }
  .summary-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>`

export function injectConcreteSummaryDocumentStyles(html: string): string {
  const withScreen = injectPreviewScreenStyles(html)
  if (/<\/head>/i.test(withScreen)) {
    return withScreen.replace(/<\/head>/i, `${CONCRETE_SUMMARY_PRINT_STYLES}</head>`)
  }
  return CONCRETE_SUMMARY_PRINT_STYLES + withScreen
}

/** A4 แนวนอน @ 96dpi */
export const A4_LANDSCAPE_WIDTH_PX = Math.round((297 * 96) / 25.4)
export const A4_LANDSCAPE_HEIGHT_PX = Math.round((210 * 96) / 25.4)

export function isChecklistPrintDocument(doc: Document): boolean {
  if (doc.querySelector('[data-print-doc="checklist"]')) return true
  if (doc.querySelector('[data-print-doc="cst"]')) return false
  return doc.querySelector('table.chk') != null
}

/** ย่อทั้งหน้า checklist ให้พอดี 1 แผ่น A4 */
export function applyChecklistPrintFit(doc: Document): () => void {
  if (!isChecklistPrintDocument(doc)) return () => {}

  const paper = doc.querySelector('.a4-page') as HTMLElement | null
  if (!paper) return () => {}

  const prevZoom = paper.style.zoom
  const contentH = Math.max(
    paper.scrollHeight,
    paper.offsetHeight,
    Math.ceil(paper.getBoundingClientRect().height),
  )
  const reservePx = Math.round((5 * 96) / 25.4)
  const targetH = A4_PRINT_HEIGHT_PX - reservePx
  const scale = contentH > 0 ? Math.min(1, targetH / contentH) : 1

  if (scale < 0.995) {
    paper.style.zoom = String(scale)
  }

  return () => {
    paper.style.zoom = prevZoom
  }
}

export function printIframeDocument(
  iframe: HTMLIFrameElement,
  options?: { fitSinglePage?: boolean },
): void {
  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  if (!win || !doc) return

  const shouldFit = options?.fitSinglePage ?? isChecklistPrintDocument(doc)
  const reset = shouldFit ? applyChecklistPrintFit(doc) : () => {}
  const onAfter = () => {
    reset()
    win.removeEventListener('afterprint', onAfter)
  }
  win.addEventListener('afterprint', onAfter)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => win.print())
  })
}

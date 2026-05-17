import { useCallback, useEffect, useRef, useState } from 'react'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { ChevronDown } from 'lucide-react'
import {
  CHECKLIST_TEMPLATE_STATIC_DEFAULTS,
  fillChecklistBeforePourTemplate,
  loadChecklistBeforePourTemplate,
  type ChecklistBeforePourTemplateData,
} from '@/lib/checklistBeforePourTemplate'
import {
  defaultCstStrengthReportTemplateData,
  fillCstStrengthReportTemplate,
  loadCstStrengthReportTemplate,
  type CstStrengthReportTemplateData,
  CST_REPORT_TEMPLATE_STATIC_DEFAULTS,
} from '@/lib/cstStrengthReportTemplate'
import { Button } from '@/components/ui/button'
import { injectPreviewScreenStyles } from '@/lib/localPrintChecklist'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const CHECKLIST_SAMPLE: ChecklistBeforePourTemplateData = {
  pageCurrent: '1',
  pageTotal: '1',
  clientName:
    'บริษัท สยามไทยคอนกรีต จำกัด — โครงการก่อสร้างทางหลวงหมายเลข 7 สายบางนา–ตราด ช่วงกม. 12+500 ถึง 15+200',
  locationText: 'บริเวณเสาสะพาน P12–P15 ฝั่งขาออก ใกล้ทางแยกบางบ่อ',
  structureNo: 'C-12',
  requestDate: '15/05/2026',
  structureName: 'Deck ชั้น 2',
  concreteGrade: '350 ksc',
  remarks: 'ตัวอย่างหมายเหตุการตรวจก่อนเท',
  inspectorName: 'สมชาย ใจดี',
  witnessName: '',
  contractorName: 'SINO-THAI',
  consultantName: 'CSCS',
  ...CHECKLIST_TEMPLATE_STATIC_DEFAULTS,
}

/** ข้อมูลตัวอย่าง CST — สอดคล้อง layout รายงานจริง (หัวรายงาน + ตารางผล) */
const CST_SAMPLE: CstStrengthReportTemplateData = {
  ...defaultCstStrengthReportTemplateData(),
  castingDate: '20/05/2026',
  testDate: '21/05/2026',
  age: '1',
  ageLabel: '1 Day',
  strengthUnit: 'ksc',
  reportNumber: 'LAB-R1-CST-000001',
  concreteWork: 'Overpass',
  structureName: 'Footing',
  locationText: 'Location1 - Location2 - Location3',
  structureNo: 'A1',
  mixcode: 'A12345',
  strength: '300 ksc.',
  slump: '5 - 10 cm.',
  volume: '20.50',
  supplier: 'CPAC',
  sampleType: 'Cylinder 15x30 cm.',
  testMachine: 'CST-1',
  serialNo: 'A1234',
  factor: 'x1.0111+3.2563',
  s1: 'A1',
  w1: '8.42',
  d1: '2401.00',
  f1: '412.50',
  adj1: '420.80',
  ksc1: '358.00',
  s2: 'A2',
  w2: '8.39',
  d2: '2398.00',
  f2: '408.10',
  adj2: '416.30',
  ksc2: '352.00',
  s3: 'A3',
  w3: '8.44',
  d3: '2405.00',
  f3: '415.00',
  adj3: '423.30',
  ksc3: '361.00',
  avg1: '357.00',
  remark1: '',
  s4: 'A4',
  w4: '8.40',
  d4: '2399.00',
  f4: '410.20',
  adj4: '418.40',
  ksc4: '354.00',
  s5: 'A5',
  w5: '8.41',
  d5: '2400.00',
  f5: '411.00',
  adj5: '419.20',
  ksc5: '356.00',
  s6: 'A6',
  w6: '8.38',
  d6: '2397.00',
  f6: '407.50',
  adj6: '415.70',
  ksc6: '351.00',
  avg2: '353.67',
  remark2: '',
  s7: 'A7',
  w7: '8.43',
  d7: '2403.00',
  f7: '413.80',
  adj7: '422.10',
  ksc7: '359.00',
  s8: 'A8',
  w8: '8.40',
  d8: '2400.00',
  f8: '409.50',
  adj8: '417.70',
  ksc8: '353.00',
  s9: 'A9',
  w9: '8.42',
  d9: '2402.00',
  f9: '412.00',
  adj9: '420.20',
  ksc9: '357.00',
  avg3: '356.33',
  remark3: '',
  s10: 'A10',
  w10: '8.39',
  d10: '2398.00',
  f10: '408.80',
  adj10: '417.00',
  ksc10: '352.00',
  s11: 'A11',
  w11: '8.41',
  d11: '2401.00',
  f11: '411.50',
  adj11: '419.70',
  ksc11: '355.00',
  s12: 'A12',
  w12: '8.40',
  d12: '2399.00',
  f12: '409.90',
  adj12: '418.10',
  ksc12: '353.00',
  avg4: '353.33',
  remark4: '',
  s13: 'A13',
  w13: '8.44',
  d13: '2404.00',
  f13: '414.20',
  adj13: '422.50',
  ksc13: '360.00',
  s14: 'A14',
  w14: '8.39',
  d14: '2398.00',
  f14: '408.30',
  adj14: '416.50',
  ksc14: '351.00',
  s15: 'A15',
  w15: '8.42',
  d15: '2402.00',
  f15: '412.70',
  adj15: '421.00',
  ksc15: '358.00',
  avg5: '356.33',
  remark5: '',
  ...CST_REPORT_TEMPLATE_STATIC_DEFAULTS,
}

/** ความกว้าง A4 ที่ 96dpi — อ้างอิงจากขนาดกระดาษในเทมเพลต */
const PREVIEW_PAPER_WIDTH_PX = Math.round((210 * 96) / 25.4)
/** กว้างกว่าแผ่นเล็กน้อย — ใช้เป็นฐานคำนวณ scale ให้ตรงกับเทมเพลต */
const PREVIEW_IFRAME_WIDTH_PX = PREVIEW_PAPER_WIDTH_PX + 28
/** ระยะรอบเนื้อหาหลัง scale — กันขอบตัด/กรอบทับขอบกระดาษ (พิกเซลจอ) */
const PREVIEW_SCALE_SAFE_INSET_PX = 6

function AutoHeightIframe({
  title,
  srcDoc,
  className,
}: {
  title: string
  srcDoc: string
  className?: string
}) {
  const slotRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLIFrameElement>(null)
  const lastHeightRef = useRef(0)
  const slotWidthForRoRef = useRef(0)
  const syncRafRef = useRef<number | null>(null)
  const [heightPx, setHeightPx] = useState(Math.round((297 * 96) / 25.4))
  const [scale, setScale] = useState(1)

  const measureHeight = useCallback(() => {
    const el = ref.current
    const doc = el?.contentDocument
    if (!doc?.body) return
    const paper = doc.querySelector('.a4-page') as HTMLElement | null
    const h = paper
      ? Math.max(
          paper.scrollHeight,
          paper.offsetHeight,
          Math.ceil(paper.getBoundingClientRect().height),
        )
      : Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
        )
    if (h <= 0) return
    /** กัน doc/iframe วัดผิดแล้วดันความสูงหลายหมื่นพิกเซล (ไม่เกี่ยวกับ /admin โดยตรง แต่กันพรีวิวเทมเพลตลามเพจ) */
    const raw = Math.ceil(h) + 12
    const next = Math.min(raw, 10_000)
    if (Math.abs(next - lastHeightRef.current) < 2) return
    lastHeightRef.current = next
    setHeightPx(next)
  }, [])

  const applyScale = useCallback(() => {
    const slot = slotRef.current
    if (!slot) return
    const cs = getComputedStyle(slot)
    const n = (v: string) => parseFloat(v) || 0
    const hPad = n(cs.paddingLeft) + n(cs.paddingRight)
    // Reserve room for the safe-inset border on both sides so scaledW never overflows the slot
    const avail = Math.max(80, slot.clientWidth - hPad - 2 * PREVIEW_SCALE_SAFE_INSET_PX)
    const s = Math.min(1, avail / PREVIEW_IFRAME_WIDTH_PX)
    setScale((prev) => (Math.abs(prev - s) < 1e-6 ? prev : s))
  }, [])

  const scheduleSync = useCallback(() => {
    if (syncRafRef.current != null) return
    syncRafRef.current = window.requestAnimationFrame(() => {
      syncRafRef.current = null
      measureHeight()
      applyScale()
    })
  }, [measureHeight, applyScale])

  useEffect(() => {
    lastHeightRef.current = 0
    slotWidthForRoRef.current = 0
  }, [srcDoc])

  useEffect(() => {
    const run = () => {
      scheduleSync()
    }
    const onOrientation = () => {
      scheduleSync()
      window.setTimeout(scheduleSync, 120)
    }
    window.addEventListener('resize', run)
    window.addEventListener('orientationchange', onOrientation)
    const vv = window.visualViewport
    vv?.addEventListener('resize', run)

    const slot = slotRef.current
    window.requestAnimationFrame(run)

    let ro: ResizeObserver | null = null
    if (slot && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? 0
        const prev = slotWidthForRoRef.current
        if (prev !== 0 && Math.abs(w - prev) < 0.5) return
        slotWidthForRoRef.current = w
        scheduleSync()
      })
      ro.observe(slot)
    }

    return () => {
      window.removeEventListener('resize', run)
      window.removeEventListener('orientationchange', onOrientation)
      vv?.removeEventListener('resize', run)
      ro?.disconnect()
      if (syncRafRef.current != null) {
        window.cancelAnimationFrame(syncRafRef.current)
        syncRafRef.current = null
      }
    }
  }, [scheduleSync, srcDoc])

  const innerW = Math.ceil(PREVIEW_IFRAME_WIDTH_PX * scale)
  const innerH = Math.ceil(heightPx * scale)
  const scaledW = innerW + 2 * PREVIEW_SCALE_SAFE_INSET_PX
  const scaledH = innerH + 2 * PREVIEW_SCALE_SAFE_INSET_PX

  return (
    <div
      ref={slotRef}
      className={cn(
        'w-full max-w-full overflow-x-hidden rounded-2xl bg-slate-100/95 p-3 ring-1 ring-slate-200/90',
        className,
      )}
    >
      <div className="flex w-full justify-center">
        <div
          className="relative overflow-hidden rounded-none bg-slate-200/40 shadow-inner"
          style={{ width: scaledW, height: scaledH }}
        >
          <iframe
            ref={ref}
            title={title}
            srcDoc={srcDoc}
            width={PREVIEW_IFRAME_WIDTH_PX}
            scrolling="no"
            onLoad={() => {
              scheduleSync()
              window.requestAnimationFrame(() => {
                scheduleSync()
              })
              window.setTimeout(() => {
                scheduleSync()
              }, 250)
            }}
            className="m-0 block border-0 p-0"
            style={{
              position: 'absolute',
              left: PREVIEW_SCALE_SAFE_INSET_PX,
              top: PREVIEW_SCALE_SAFE_INSET_PX,
              width: PREVIEW_IFRAME_WIDTH_PX,
              height: heightPx,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

function CollapsiblePreviewBlock(props: {
  id: string
  title: string
  description: string
  open: boolean
  onToggle: () => void
  loading: boolean
  error: string | null
  html: string | null
  iframeTitle: string
  onReload: () => void
}) {
  const { id, title, description, open, onToggle, loading, error, html, iframeTitle, onReload } = props
  const panelId = `${id}-panel`

  return (
    <div className="rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] shadow-sm">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-[color:var(--pour-surface-tint)]"
      >
        <span className="font-semibold text-[color:var(--pour-ink-0)]">{title}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-pour-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="border-t border-[color:var(--glass-border-subtle)] p-3" role="region" aria-labelledby={`${id}-trigger`}>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-pour-muted">{description}</p>
            <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => void onReload()} disabled={loading}>
              โหลดใหม่
            </Button>
          </div>

          {loading ? (
            <div
              className={cn(
                'flex min-h-[320px] items-center justify-center rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)]',
                theme.shell,
              )}
            >
              <div className={cn('h-9 w-9 rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)] animate-spin')} aria-hidden />
              <span className="sr-only">กำลังโหลด</span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">โหลดเทมเพลตไม่สำเร็จ</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}

          {html && !loading ? (
            <AutoHeightIframe title={iframeTitle} srcDoc={html} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function FormTemplatesPreviewPage() {
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [cstOpen, setCstOpen] = useState(true)

  const [checklistHtml, setChecklistHtml] = useState<string | null>(null)
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [checklistError, setChecklistError] = useState<string | null>(null)

  const [cstHtml, setCstHtml] = useState<string | null>(null)
  const [cstLoading, setCstLoading] = useState(true)
  const [cstError, setCstError] = useState<string | null>(null)

  const loadChecklist = useCallback(async () => {
    setChecklistLoading(true)
    setChecklistError(null)
    try {
      const raw = await loadChecklistBeforePourTemplate()
      setChecklistHtml(fillChecklistBeforePourTemplate(raw, CHECKLIST_SAMPLE))
    } catch (e) {
      setChecklistError(e instanceof Error ? e.message : String(e))
      setChecklistHtml(null)
    } finally {
      setChecklistLoading(false)
    }
  }, [])

  const loadCst = useCallback(async () => {
    setCstLoading(true)
    setCstError(null)
    try {
      const raw = await loadCstStrengthReportTemplate()
      setCstHtml(injectPreviewScreenStyles(fillCstStrengthReportTemplate(raw, CST_SAMPLE)))
    } catch (e) {
      setCstError(e instanceof Error ? e.message : String(e))
      setCstHtml(null)
    } finally {
      setCstLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadChecklist()
    void loadCst()
  }, [loadChecklist, loadCst])

  usePullToRefreshOnLoad(async () => {
    await Promise.all([loadChecklist(), loadCst()])
  })

  return (
    <div className="mx-auto max-w-5xl px-2 pb-6 sm:px-3 pour-desktop:px-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold tracking-tight text-[color:var(--pour-ink-0)] pour-desktop:text-xl">ตัวอย่างแบบฟอร์ม</h1>
        <p className="mt-1 text-sm text-pour-muted">
          รวมฟอร์มจาก <code className="rounded bg-[color:var(--pour-accent-muted)] px-1 py-0.5 text-xs">public/templates/</code> — กดหัวข้อเพื่อยุบหรือขยายแต่ละรายการ
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <CollapsiblePreviewBlock
          id="checklist"
          title="Check List ก่อนเทคอนกรีต"
          description="ข้อมูลตัวอย่าง — ใช้ดู layout ก่อนเทคอนกรีต"
          open={checklistOpen}
          onToggle={() => setChecklistOpen((o) => !o)}
          loading={checklistLoading}
          error={checklistError}
          html={checklistHtml}
          iframeTitle="ตัวอย่าง Check List Before Concrete Placement"
          onReload={loadChecklist}
        />
        <CollapsiblePreviewBlock
          id="cst"
          title="รายงาน Compressive Strength Test (CST)"
          description="ข้อมูลตัวอย่างจากรายงาน CST จริง — หัวรายงาน ตารางผล และลายเซ็น"
          open={cstOpen}
          onToggle={() => setCstOpen((o) => !o)}
          loading={cstLoading}
          error={cstError}
          html={cstHtml}
          iframeTitle="ตัวอย่าง Compressive Strength Test Report"
          onReload={loadCst}
        />
      </div>
    </div>
  )
}

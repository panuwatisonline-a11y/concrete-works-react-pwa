import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** ความกว้าง A4 ที่ 96dpi */
const PREVIEW_PAPER_WIDTH_PX = Math.round((210 * 96) / 25.4)
const PREVIEW_IFRAME_WIDTH_PX = PREVIEW_PAPER_WIDTH_PX + 28
const PREVIEW_SCALE_SAFE_INSET_PX = 6

type DocumentPreviewIframeProps = {
  title: string
  srcDoc: string
  className?: string
}

export function DocumentPreviewIframe({ title, srcDoc, className }: DocumentPreviewIframeProps) {
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
    const toolbar = doc.getElementById('cw-print-toolbar')
    const paperH = paper
      ? Math.max(paper.scrollHeight, paper.offsetHeight, Math.ceil(paper.getBoundingClientRect().height))
      : 0
    const toolbarH = toolbar?.offsetHeight ?? 0
    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, doc.body.offsetHeight)
    const h = Math.max(paperH + toolbarH, bodyH)

    if (h <= 0) return
    const raw = Math.ceil(h) + 16
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
    const run = () => scheduleSync()
    const onOrientation = () => {
      scheduleSync()
      window.setTimeout(scheduleSync, 120)
    }
    window.addEventListener('resize', run)
    window.addEventListener('orientationchange', onOrientation)
    const vv = window.visualViewport
    vv?.addEventListener('resize', run)

    window.requestAnimationFrame(run)

    let ro: ResizeObserver | null = null
    const slot = slotRef.current
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
        'mx-auto w-full max-w-full overflow-x-hidden p-2 sm:p-3',
        className,
      )}
    >
      <div className="flex w-full justify-center">
        <div
          className="relative overflow-hidden rounded-sm bg-slate-300/30 shadow-md"
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
              window.requestAnimationFrame(scheduleSync)
              window.setTimeout(scheduleSync, 250)
              window.setTimeout(scheduleSync, 800)
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
            sandbox="allow-same-origin allow-modals"
          />
        </div>
      </div>
    </div>
  )
}

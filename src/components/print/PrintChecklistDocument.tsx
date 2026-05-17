import { useCallback, useEffect, useRef, useState } from 'react'
import {
  A4_LANDSCAPE_HEIGHT_PX,
  A4_LANDSCAPE_WIDTH_PX,
  A4_PRINT_HEIGHT_PX,
  printIframeDocument,
} from '@/lib/localPrintChecklist'

const A4_PORTRAIT_WIDTH_PX = Math.round((210 * 96) / 25.4)
const A4_PORTRAIT_HEIGHT_PX = A4_PRINT_HEIGHT_PX

type PrintChecklistDocumentProps = {
  srcDoc: string
  title: string
  /** checklist: ย่อทั้งหน้าให้พอดี 1 แผ่น — CST: คง layout flex + footer ล่าง */
  fitSinglePage?: boolean
  /** ค่าเริ่มต้น portrait A4 */
  paperWidthPx?: number
  paperHeightPx?: number
}

export function PrintChecklistDocument({
  srcDoc,
  title,
  fitSinglePage,
  paperWidthPx = A4_PORTRAIT_WIDTH_PX,
  paperHeightPx = A4_PORTRAIT_HEIGHT_PX,
}: PrintChecklistDocumentProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [docHeight, setDocHeight] = useState(paperHeightPx)
  const [scale, setScale] = useState(1)

  const syncLayout = useCallback(() => {
    const scroll = scrollRef.current
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!scroll || !doc?.body) return

    const pages = doc.querySelectorAll('.a4-page')
    let paperH = 0
    if (pages.length > 0) {
      const gap = pages.length > 1 ? 14 * (pages.length - 1) : 0
      paperH =
        gap +
        Array.from(pages).reduce((sum, node) => {
          const el = node as HTMLElement
          return (
            sum +
            Math.max(el.scrollHeight, el.offsetHeight, Math.ceil(el.getBoundingClientRect().height))
          )
        }, 0)
    }
    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
    const h = Math.max(paperH, bodyH, paperHeightPx)
    setDocHeight(Math.ceil(h) + 8)

    const pad = 24
    const avail = Math.max(200, scroll.clientWidth - pad)
    setScale(Math.min(1, avail / paperWidthPx))
  }, [paperWidthPx, paperHeightPx])

  useEffect(() => {
    const run = () => syncLayout()
    window.addEventListener('resize', run)
    const vv = window.visualViewport
    vv?.addEventListener('resize', run)
    return () => {
      window.removeEventListener('resize', run)
      vv?.removeEventListener('resize', run)
    }
  }, [syncLayout])

  useEffect(() => {
    setDocHeight(paperHeightPx)
    setScale(1)
  }, [srcDoc, paperHeightPx])

  const scaledW = Math.ceil(paperWidthPx * scale)
  const scaledH = Math.ceil(docHeight * scale)

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-200">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-center border-b border-slate-700/80 bg-slate-800 px-4 py-3 shadow-md">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
          onClick={() => {
            const iframe = iframeRef.current
            if (iframe) printIframeDocument(iframe, { fitSinglePage })
          }}
        >
          พิมพ์
        </button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-y-contain p-3"
      >
        <div className="mx-auto" style={{ width: scaledW, height: scaledH }}>
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={srcDoc}
            onLoad={() => {
              syncLayout()
              requestAnimationFrame(syncLayout)
              window.setTimeout(syncLayout, 200)
              window.setTimeout(syncLayout, 700)
            }}
            className="m-0 block border-0 bg-white"
            style={{
              width: paperWidthPx,
              height: docHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    </div>
  )
}

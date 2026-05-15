import { useCallback, useEffect, useRef, useState } from 'react'

const A4_WIDTH_PX = Math.round((210 * 96) / 25.4)
const A4_HEIGHT_PX = Math.round((297 * 96) / 25.4)

type PrintChecklistDocumentProps = {
  srcDoc: string
  title: string
}

export function PrintChecklistDocument({ srcDoc, title }: PrintChecklistDocumentProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [docHeight, setDocHeight] = useState(A4_HEIGHT_PX)
  const [scale, setScale] = useState(1)

  const syncLayout = useCallback(() => {
    const scroll = scrollRef.current
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!scroll || !doc?.body) return

    const paper = doc.querySelector('.a4-page') as HTMLElement | null
    const paperH = paper
      ? Math.max(paper.scrollHeight, paper.offsetHeight, Math.ceil(paper.getBoundingClientRect().height))
      : 0
    const bodyH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
    const h = Math.max(paperH, bodyH, A4_HEIGHT_PX)
    setDocHeight(Math.ceil(h) + 8)

    const pad = 24
    const avail = Math.max(200, scroll.clientWidth - pad)
    setScale(Math.min(1, avail / A4_WIDTH_PX))
  }, [])

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
    setDocHeight(A4_HEIGHT_PX)
    setScale(1)
  }, [srcDoc])

  const scaledW = Math.ceil(A4_WIDTH_PX * scale)
  const scaledH = Math.ceil(docHeight * scale)

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-200">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-center border-b border-slate-700/80 bg-slate-800 px-4 py-3 shadow-md">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
          onClick={() => iframeRef.current?.contentWindow?.print()}
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
              width: A4_WIDTH_PX,
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

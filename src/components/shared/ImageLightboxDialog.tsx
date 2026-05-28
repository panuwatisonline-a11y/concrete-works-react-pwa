import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Close from '@mui/icons-material/Close'
import { AppIcon } from '@/components/icons/AppIcon'
import { Z_INDEX } from '@/lib/zIndex'
import { cn } from '@/lib/utils'

export type ImageLightboxItem = { src: string; label: string }

type ImageLightboxDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** รูปเดียว */
  src?: string | null
  /** หลายรูป (เช่น ก่อนเท/หลังเท) — ถ้ามีจะใช้แทน `src` */
  items?: ImageLightboxItem[]
  title?: string
}

export function ImageLightboxDialog({
  open,
  onOpenChange,
  src,
  items,
  title = 'รูปภาพ',
}: ImageLightboxDialogProps) {
  const slides: ImageLightboxItem[] =
    items && items.length > 0
      ? items
      : src
        ? [{ src, label: title }]
        : []

  const visible = open && slides.length > 0

  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onOpenChange])

  if (!visible) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 flex flex-col bg-zinc-950/96"
      style={{ zIndex: Z_INDEX.lightbox }}
      onClick={() => onOpenChange(false)}
    >
      <button
        type="button"
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] z-10 rounded-lg p-2 text-white/95 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
        aria-label="ปิด"
        onClick={(e) => {
          e.stopPropagation()
          onOpenChange(false)
        }}
      >
        <AppIcon icon={Close} size="md" />
      </button>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-3 pb-[max(10px,env(safe-area-inset-bottom,0px))] pt-12 sm:px-4',
          slides.length > 1 && 'sm:flex-row sm:items-stretch sm:gap-4 sm:overflow-hidden sm:pt-14',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {slides.map((item) => (
          <figure
            key={`${item.label}-${item.src}`}
            className="flex min-h-0 min-w-0 flex-1 flex-col items-center"
          >
            {slides.length > 1 ? (
              <figcaption className="mb-2 flex shrink-0 justify-center sm:mb-2.5">
                <span className="rounded-full bg-white/14 px-4 py-1.5 text-sm font-semibold tracking-wide text-white shadow-[0_1px_12px_rgba(0,0,0,0.35)] ring-1 ring-white/25 backdrop-blur-sm sm:px-5 sm:py-2 sm:text-base">
                  {item.label}
                </span>
              </figcaption>
            ) : null}
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <img
                src={item.src}
                alt=""
                referrerPolicy="no-referrer"
                className="max-h-[min(85dvh,1200px)] w-auto max-w-full object-contain object-center"
              />
            </div>
          </figure>
        ))}
      </div>
    </div>,
    document.body,
  )
}

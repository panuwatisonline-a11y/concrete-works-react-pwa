import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useFilterStore } from '@/stores/filterStore'
import { rq, theme, icon, ICON_STROKE } from '@/lib/requestUi'

/** หัวข้อรายการจอง — ติดใต้แถบ สถานะ / รายการของฉัน ใน AppHeader */
export function MobileRequestListHeader() {
  const chrome = useFilterStore((s) => s.mobileRequestListChrome)
  if (!chrome) return null

  return (
    <div className={theme.mobileRequestListHeader}>
      <div className={theme.mobileRequestListHeaderInner}>
        <Link
          to="/requests?view=summary"
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-strong)] text-[color:var(--pour-ink-2)] shadow-md shadow-slate-900/10 backdrop-blur-md transition hover:border-[color:var(--pour-accent)] hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--pour-accent)] active:scale-95"
          aria-label="กลับไปหน้าสรุปสถานะ"
        >
          <ChevronLeft className={icon.md} strokeWidth={ICON_STROKE} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className={rq.heroTitle}>{chrome.title}</h1>
          <p className={rq.sub}>{chrome.subtitle}</p>
        </div>
      </div>
    </div>
  )
}

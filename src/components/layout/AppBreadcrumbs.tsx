import { ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { BREADCRUMB_MAP } from '@/lib/breadcrumbMap'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

/** Desktop-only trail above page content (mobile uses header density instead). */
export function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    return { label: BREADCRUMB_MAP[path] ?? seg, path }
  })

  if (breadcrumbs.length === 0) return null

  return (
    <div className={cn('hidden shrink-0 py-2 md:block', theme.breadcrumbStrip)}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-[#6b7280]">
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-[#c8ced8]" />}
            <span className={i === breadcrumbs.length - 1 ? 'font-semibold text-[#374151]' : ''}>{bc.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

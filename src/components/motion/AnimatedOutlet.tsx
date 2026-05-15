import { Outlet, useLocation } from 'react-router-dom'
import { anim } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

/** Re-mounts on route change so page-enter CSS runs again. */
export function AnimatedOutlet({ className }: { className?: string }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className={cn('min-w-0', anim.page, className)}>
      <Outlet />
    </div>
  )
}

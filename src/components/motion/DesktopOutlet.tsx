import { useLayoutEffect } from 'react'
import { useOutlet } from 'react-router-dom'
import { setPageTransitionActive } from '@/stores/pageTransitionStore'
import { cn } from '@/lib/utils'

/** PC layout — no stack animation; instant route swap. */
export function DesktopOutlet({ className }: { className?: string }) {
  const outlet = useOutlet()

  useLayoutEffect(() => {
    setPageTransitionActive(false)
  })

  return <div className={cn('min-w-0', className)}>{outlet}</div>
}

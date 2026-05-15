import type { CSSProperties, ReactNode } from 'react'
import { anim } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const MAX_STAGGER_INDEX = 14
const STAGGER_MS = 48

export function StaggerItem({
  index,
  children,
  className,
  style,
}: {
  index: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS
  return (
    <div
      className={cn(anim.staggerItem, className)}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

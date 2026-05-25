import MuiTooltip from '@mui/material/Tooltip'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pourPcUi } from '@/lib/pourPcScale'

type ClampLines = 2 | 3 | 4

interface TableClampTextProps {
  /** ข้อความเต็ม — ใช้ใน tooltip เมื่อถูก clamp */
  text: string
  children?: ReactNode
  className?: string
  lines?: ClampLines
}

function clampClass(lines: ClampLines): string {
  const tw = lines === 2 ? 'line-clamp-2' : lines === 4 ? 'line-clamp-4' : 'line-clamp-3'
  const pc = lines === 2 ? 'pour-pc-clamp-text--2' : lines === 4 ? 'pour-pc-clamp-text--4' : 'pour-pc-clamp-text--3'
  return cn(pourPcUi.clampText, pc, tw)
}

/** ข้อความในตาราง — clamp หลายบรรทัด + tooltip เมื่อยาวเกิน (ไม่มี resize คอลัมน์) */
export function TableClampText({ text, children, className, lines = 3 }: TableClampTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clamped, setClamped] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, children])

  const body = (
    <span
      ref={ref}
      className={cn('block min-w-0', clampClass(lines), className)}
    >
      {children ?? text}
    </span>
  )

  if (!text.trim() || !clamped) return body

  return (
    <MuiTooltip
      title={text}
      placement="top"
      enterDelay={350}
      describeChild
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 420,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.8125rem',
            lineHeight: 1.45,
          },
        },
      }}
    >
      {body}
    </MuiTooltip>
  )
}

import MuiTooltip from '@mui/material/Tooltip'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pourPcUi } from '@/lib/pourPcScale'

interface TableClampTextProps {
  /** ข้อความเต็ม — tooltip เมื่อถูกตัด (บรรทัดเดียว) */
  text: string
  children?: ReactNode
  className?: string
}

/** ข้อความในตาราง — บรรทัดเดียว + tooltip เมื่อยาวเกิน */
export function TableClampText({ text, children, className }: TableClampTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clamped, setClamped] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClamped(el.scrollWidth > el.clientWidth + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, children])

  const body = (
    <span ref={ref} className={cn(pourPcUi.clampText, className)}>
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

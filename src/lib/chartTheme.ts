import { useLayoutEffect, useState } from 'react'
import { useThemeStore } from '@/stores/themeStore'

export type ChartColors = {
  grid: string
  axis: string
  label: string
  labelStrong: string
  dim: string
  cursor: string
  surface: string
  pieStroke: string
  tooltipCursorFill: string
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** อ่านสีกราฟจาก --chart-* / --pour-* ตามธีมปัจจุบัน */
export function readChartColors(): ChartColors {
  return {
    grid: cssVar('--chart-grid', '#e2e8f0'),
    axis: cssVar('--chart-axis', '#64748b'),
    label: cssVar('--chart-label', '#64748b'),
    labelStrong: cssVar('--chart-label-strong', '#1e293b'),
    dim: cssVar('--chart-dim', '#cbd5e1'),
    cursor: cssVar('--chart-cursor', '#64748b'),
    surface: cssVar('--chart-surface', '#f8fafc'),
    pieStroke: cssVar('--chart-pie-stroke', '#ffffff'),
    tooltipCursorFill: cssVar('--chart-tooltip-cursor', 'rgba(100, 116, 139, 0.12)'),
  }
}

export function useChartColors(): ChartColors {
  const variant = useThemeStore((s) => s.variant)
  const [colors, setColors] = useState(() => readChartColors())

  useLayoutEffect(() => {
    setColors(readChartColors())
    const id = requestAnimationFrame(() => setColors(readChartColors()))
    return () => cancelAnimationFrame(id)
  }, [variant])

  return colors
}

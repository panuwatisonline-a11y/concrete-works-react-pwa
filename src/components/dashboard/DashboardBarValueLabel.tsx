export type DashboardBarLabelProps = {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  value?: unknown
}

/** ป้ายค่าด้านขวาแท่งกราฟแนวตั้ง (จำนวน | %) */
export function DashboardBarValueLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  total,
  formatValue,
  labelFill,
  pctFill,
}: {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  value?: unknown
  total: number
  formatValue: (v: number) => string
  labelFill: string
  pctFill: string
}) {
  const nx = Number(x)
  const ny = Number(y)
  const nw = Number(width)
  const nh = Number(height)
  const raw = Array.isArray(value) ? value[0] : value
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num) || num <= 0) return null
  const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0'
  return (
    <text x={nx + nw + 6} y={ny + nh / 2} dominantBaseline="middle" style={{ pointerEvents: 'none' }}>
      <tspan fill={labelFill} fontSize={10} fontWeight={600}>
        {formatValue(num)}
      </tspan>
      <tspan fill={pctFill} fontSize={9}>
        {' '}
        | {pct}%
      </tspan>
    </text>
  )
}

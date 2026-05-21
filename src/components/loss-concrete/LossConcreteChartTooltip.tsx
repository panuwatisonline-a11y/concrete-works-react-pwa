type VolumeFormat = 'volume' | 'percent'

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
}

export function LossConcreteChartTooltip({
  active,
  payload,
  label,
  valueFormat = 'volume',
}: {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  valueFormat?: VolumeFormat
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] px-3 py-2 shadow-lg backdrop-blur-sm">
      {label != null && label !== '' ? (
        <p className="mb-1.5 text-[10px] font-semibold text-pour-muted">{String(label)}</p>
      ) : null}
      <ul className="space-y-1">
        {payload.map((entry, i) => {
          const v = typeof entry.value === 'number' ? entry.value : Number(entry.value)
          const text =
            Number.isNaN(v)
              ? '—'
              : valueFormat === 'percent'
                ? `${v.toFixed(2)}%`
                : `${v.toFixed(2)} m³`
          return (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? 'var(--pour-accent)' }}
              />
              <span className="text-[color:var(--pour-ink-1)]">{entry.name != null ? String(entry.name) : ''}</span>
              <span className="ml-auto font-mono font-semibold tabular-nums text-[color:var(--pour-ink-0)]">
                {text}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

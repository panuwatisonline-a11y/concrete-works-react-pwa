import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { NamedVolumeSlice, TrendGranularity, TrendPoint } from '@/lib/adminDashboardAnalytics'
import { formatTrendAxisLabel } from '@/lib/adminDashboardAnalytics'

const TREND_LABELS: Record<TrendGranularity, string> = {
  day: 'วัน',
  week: 'สัปดาห์',
  month: 'เดือน',
  year: 'ปี',
}

export function TrendGranularityToggle({
  value,
  onChange,
}: {
  value: TrendGranularity
  onChange: (g: TrendGranularity) => void
}) {
  const options: TrendGranularity[] = ['day', 'week', 'month', 'year']
  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-xl border border-[#e2e6ec] bg-[#f8fafc] p-1"
      role="tablist"
      aria-label="ช่วงเวลากราฟแนวโน้ม"
    >
      {options.map((g) => (
        <button
          key={g}
          type="button"
          role="tab"
          aria-selected={value === g}
          onClick={() => onChange(g)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            value === g
              ? 'bg-white text-[color:var(--pour-accent)] shadow-sm ring-1 ring-[#e2e6ec]'
              : 'text-[#64748b] hover:bg-white/80 hover:text-[#111827]',
          )}
        >
          {TREND_LABELS[g]}
        </button>
      ))}
    </div>
  )
}

export function VolumeTrendDualLineChart({
  points,
  granularity,
  loading,
}: {
  points: TrendPoint[]
  granularity: TrendGranularity
  loading: boolean
}) {
  const model = useMemo(() => {
    const vbW = 720
    const vbH = 240
    const padL = 52
    const padR = 18
    const padT = 14
    const padB = 44
    const innerW = vbW - padL - padR
    const innerH = vbH - padT - padB
    const x0 = padL
    const y0 = padT
    const x1 = padL + innerW
    const y1 = padT + innerH

    if (points.length === 0) {
      return {
        maxY: 1,
        pts: [] as {
          x: number
          yr: number
          yc: number
          requestVol: number
          confirmVol: number
          key: string
        }[],
        vbW,
        vbH,
        x0,
        x1,
        y0,
        y1,
        innerW,
        innerH,
        padL,
        padT,
        padB,
        n: 0,
      }
    }

    let maxY = 1
    for (const p of points) {
      if (p.requestVol > maxY) maxY = p.requestVol
      if (p.confirmVol > maxY) maxY = p.confirmVol
    }
    const n = points.length
    const xAt = (i: number) => (n <= 1 ? x0 + innerW / 2 : x0 + (i / (n - 1)) * innerW)
    const yAt = (v: number) => y1 - (v / maxY) * innerH
    const pts = points.map((p, i) => ({
      x: xAt(i),
      yr: yAt(p.requestVol),
      yc: yAt(p.confirmVol),
      requestVol: p.requestVol,
      confirmVol: p.confirmVol,
      key: p.key,
    }))
    return { maxY, pts, vbW, vbH, x0, x1, y0, y1, innerW, innerH, padL, padT, padB, n }
  }, [points])

  if (loading) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:min-h-56">
        กำลังโหลดกราฟ…
      </div>
    )
  }

  if (points.length === 0) {
    return (
      <div className="flex min-h-44 items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:min-h-56">
        ไม่มีข้อมูลในช่วงที่เลือก (ต้องมีวันเลื่อน วันเท หรือวันที่จองสำหรับจัดกลุ่มกราฟ)
      </div>
    )
  }

  const { maxY, pts, vbW, vbH, x0, x1, y0, y1, innerW, innerH, n } = model
  const tickVs =
    maxY <= 1 ? [0, 1] : [...new Set([0, Math.round(maxY / 2), Math.ceil(maxY)])].sort((a, b) => a - b)

  const pathR =
    pts.length <= 1
      ? ''
      : pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yr.toFixed(1)}`).join(' ')
  const pathC =
    pts.length <= 1
      ? ''
      : pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yc.toFixed(1)}`).join(' ')

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e6ec]/80 bg-[#f8fafc] px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-[11px] leading-snug text-[#64748b] md:text-xs">
          สะสมต่อช่วง: วันเลื่อน (postpone) ก่อน แล้ววันเท แล้ววันที่จอง — เทียบ Request volume กับ Confirmed volume
        </p>
      </div>
      <div className="p-3 md:p-4">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          width={vbW}
          height={vbH}
          className="block max-w-full"
          style={{ width: '100%', height: vbH, maxHeight: vbH }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="กราฟแนวโน้มปริมาณคำขอและยืนยันเท"
        >
            <rect x={x0} y={y0} width={innerW} height={innerH} fill="#f8fafc" rx="8" />
            {tickVs.map((v) => {
              const y = y1 - (v / maxY) * innerH
              return (
                <g key={`gy-${v}`}>
                  <line x1={x0} y1={y} x2={x1} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                  <text x={x0 - 8} y={y + 4} textAnchor="end" className="fill-[#94a3b8] text-[11px] font-medium">
                    {v}
                  </text>
                </g>
              )
            })}
            <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={x0} y1={y1} x2={x1} y2={y1} stroke="#cbd5e1" strokeWidth="1" />

            {pathR ? (
              <path
                d={pathR}
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {pathC ? (
              <path
                d={pathC}
                fill="none"
                stroke="#171717"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {pts.map((p) => (
              <g key={p.key}>
                <circle cx={p.x} cy={p.yr} r="4" fill="white" stroke="#64748b" strokeWidth="2">
                  <title>
                    Request: {p.requestVol.toFixed(2)} m³ — {formatTrendAxisLabel(p.key, granularity)}
                  </title>
                </circle>
                <circle cx={p.x} cy={p.yc} r="4" fill="white" stroke="[color:var(--pour-accent)]" strokeWidth="2">
                  <title>
                    Confirm: {p.confirmVol.toFixed(2)} m³ — {formatTrendAxisLabel(p.key, granularity)}
                  </title>
                </circle>
              </g>
            ))}

            {pts.map((p, i) => {
              const label = formatTrendAxisLabel(p.key, granularity)
              return (
                <text
                  key={`lx-${p.key}-${i}`}
                  x={p.x}
                  y={vbH - 10}
                  textAnchor={n <= 2 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                  className="fill-[#6b7280] text-[8.5px] md:text-[9.5px]"
                >
                  {label}
                </text>
              )
            })}
        </svg>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e2e6ec]/80 pt-3 text-[10px] text-[#374151] md:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-sm bg-[#64748b]" aria-hidden />
            Request volume (m³)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-sm bg-[color:var(--pour-accent)]" aria-hidden />
            Confirmed volume (m³)
          </span>
        </div>
      </div>
    </div>
  )
}

function fmtVol(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(2)}k`
  return v.toFixed(v >= 10 ? 1 : 2)
}

export function HorizontalVolumeBarChart({
  title,
  subtitle,
  slices,
  loading,
  emptyMessage,
}: {
  title: string
  subtitle?: string
  slices: NamedVolumeSlice[]
  loading: boolean
  emptyMessage: string
}) {
  if (loading) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:min-h-48">
        กำลังโหลด…
      </div>
    )
  }

  if (slices.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:min-h-48">
        {emptyMessage}
      </div>
    )
  }

  const maxV = Math.max(...slices.map((s) => s.volume), 1)

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e6ec]/80 bg-[#f8fafc] px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        {subtitle ? <p className="mt-0.5 text-[11px] text-[#64748b] md:text-xs">{subtitle}</p> : null}
      </div>
      <div className="space-y-3 p-3 md:p-4">
        {slices.map((s) => {
          const wPct = (s.volume / maxV) * 100
          return (
            <div key={s.label} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-medium text-[#374151]" title={s.label}>
                  {s.label}
                </span>
                <span className="shrink-0 tabular-nums text-[#6b7280]">
                  {s.volume.toFixed(2)} m³ · {s.pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f7]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neutral-600 to-neutral-900 transition-[width] duration-500"
                  style={{ width: `${wPct}%` }}
                >
                  <span className="sr-only">
                    {s.label} {s.volume.toFixed(2)} ลูกบาศก์เมตร คิดเป็น {s.pct.toFixed(1)} เปอร์เซ็นต์
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-[#e2e6ec]/80 px-3 py-2 text-[10px] text-[#64748b] md:px-4">
        รวม confirmed volume ทั้งหมดในกราฟนี้:{' '}
        <span className="font-semibold text-[#111827]">
          {fmtVol(slices.reduce((a, b) => a + b.volume, 0))} m³
        </span>
      </div>
    </div>
  )
}

export function StatusVolumeStrip({
  statuses,
  counts,
  total,
  loading,
}: {
  statuses: { id: number; status_name: string }[]
  counts: Record<number, number>
  total: number
  loading: boolean
}) {
  const ORDER = [1, 2, 3, 4, 5, 6, 7, 8] as const
  const colors: Record<number, string> = {
    1: '#6b7280',
    2: '#d97706',
    3: '#525252',
    4: '#737373',
    5: '#b45309',
    6: '#dc2626',
    7: '#9ca3af',
    8: '#16a34a',
  }

  if (loading) {
    return (
      <div className="flex min-h-[4rem] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white text-sm text-[#6b7280]">
        กำลังโหลดสัดส่วนสถานะ…
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-6 text-center text-sm text-[#6b7280]">
        ยังไม่มีคำขอในระบบ
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e6ec]/80 bg-[#f8fafc] px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-sm font-semibold text-[#111827]">สัดส่วนสถานะคำขอ</p>
        <p className="mt-0.5 text-[11px] text-[#64748b] md:text-xs">
          ทั้งหมด {total} รายการ — ชี้ที่แถบสีเพื่อดูรายละเอียดใน tooltip
        </p>
      </div>
      <div className="p-3 md:p-4">
        <div className="flex h-4 overflow-hidden rounded-full bg-[#eef2f7] ring-1 ring-[#e2e6ec]/80">
          {ORDER.map((id) => {
            const c = counts[id] ?? 0
            if (c === 0) return null
            const pct = (c / total) * 100
            const name = statuses.find((s) => s.id === id)?.status_name ?? `สถานะ ${id}`
            return (
              <div
                key={id}
                style={{ width: `${pct}%`, backgroundColor: colors[id] ?? '#64748b' }}
                className="min-w-0 transition-[width] duration-300 first:rounded-l-full last:rounded-r-full"
                title={`${name}: ${c} (${pct.toFixed(1)}%)`}
              />
            )
          })}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER.map((id) => {
            const c = counts[id] ?? 0
            const name = statuses.find((s) => s.id === id)?.status_name ?? `สถานะ ${id}`
            const pct = total > 0 ? (c / total) * 100 : 0
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#eef2f7] bg-[#fafbfc] px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors[id] }} />
                  <span className="truncate font-medium text-[#374151]" title={name}>
                    {name}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[#6b7280]">
                  {c} ({pct.toFixed(0)}%)
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

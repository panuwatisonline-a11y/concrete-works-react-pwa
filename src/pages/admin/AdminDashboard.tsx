import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/types/app.types'
import { app, rq, theme } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'

interface PendingRow {
  id: string
  casting_date: string | null
  status_id: number
  structure_no: string | null
  client: { client_name: string }[] | null
}

function pendingClientName(r: PendingRow): string {
  if (Array.isArray(r.client)) return r.client[0]?.client_name ?? ''
  return (r.client as { client_name: string } | null)?.client_name ?? ''
}

const PENDING_STATUS_ORDER = [1, 2, 3, 5] as const

const LINE_COLORS: Record<number, string> = {
  1: '#2563eb',
  2: '#0891b2',
  3: '#16a34a',
  5: '#d97706',
}

function castingSortKey(d: string | null): string | null {
  if (!d) return null
  const iso = d.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

function PendingQueueLineChart({
  rows,
  statuses,
  loading,
  emptySearch,
}: {
  rows: PendingRow[]
  statuses: { id: number; status_name: string }[]
  loading: boolean
  emptySearch: boolean
}) {
  const model = useMemo(() => {
    const agg = new Map<string, Map<number, number>>()
    for (const r of rows) {
      const iso = castingSortKey(r.casting_date)
      const bucket = iso ?? '__none__'
      if (!agg.has(bucket)) agg.set(bucket, new Map())
      const m = agg.get(bucket)!
      m.set(r.status_id, (m.get(r.status_id) ?? 0) + 1)
    }
    const rawDates = [...agg.keys()].filter((k) => k !== '__none__').sort()
    if (agg.has('__none__')) rawDates.push('__none__')

    const statusIds = PENDING_STATUS_ORDER.filter((sid) => rows.some((r) => r.status_id === sid))

    let maxY = 1
    for (const d of rawDates) {
      const m = agg.get(d)!
      for (const sid of statusIds) {
        const c = m.get(sid) ?? 0
        if (c > maxY) maxY = c
      }
    }

    return { dates: rawDates, statusIds, agg, maxY }
  }, [rows])

  const vbW = 680
  const vbH = 220
  const padL = 44
  const padR = 14
  const padT = 8
  const padB = 40
  const innerW = vbW - padL - padR
  const innerH = vbH - padT - padB
  const x0 = padL
  const y0 = padT
  const x1 = padL + innerW
  const y1 = padT + innerH

  const xAt = (i: number, n: number) => {
    if (n <= 1) return x0 + innerW / 2
    return x0 + (i / (n - 1)) * innerW
  }

  const yAt = (v: number) => y1 - (v / model.maxY) * innerH

  if (loading) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        กำลังโหลด…
      </div>
    )
  }

  if (emptySearch) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        ไม่พบรายการที่ตรงกับคำค้น
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        ไม่มีรายการรอ
      </div>
    )
  }

  const { dates, statusIds, agg, maxY } = model
  const n = dates.length
  const tickVs =
    maxY <= 1 ? [0, 1] : [...new Set([0, Math.ceil(maxY / 2), maxY])].sort((a, b) => a - b)

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e6ec]/80 bg-[#f8fafc] px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-[11px] leading-snug text-[#64748b] md:text-xs">
          จำนวนคำขอต่อวันเท แยกสถานะ · คิวรอสูงสุด 20 รายการ (รวมตัวกรองค้นหา)
        </p>
      </div>
      <div className="p-3 md:p-4">
        <div className="relative mx-auto h-[clamp(11rem,min(26svh,15rem),15rem)] w-full min-w-0 max-w-full">
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="block h-full w-full max-w-full font-sans tabular-nums"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="กราฟเส้นเปรียบเทียบจำนวนคำขอรอดำเนินการตามวันเทและสถานะ"
          >
            <rect x={x0} y={y0} width={innerW} height={innerH} fill="#f1f5f9" rx="8" />

            {tickVs.map((v) => {
              const y = yAt(v)
              return (
                <g key={`y-${v}`}>
                  <line x1={x0} y1={y} x2={x1} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                  <text
                    x={x0 - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-[#94a3b8] text-[11px] font-medium"
                  >
                    {v}
                  </text>
                </g>
              )
            })}

            <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={x0} y1={y1} x2={x1} y2={y1} stroke="#cbd5e1" strokeWidth="1" />

          {statusIds.map((sid) => {
            const pts = dates.map((d, i) => {
              const c = agg.get(d)?.get(sid) ?? 0
              return { x: xAt(i, n), y: yAt(c), c }
            })
            const dPath =
              pts.length <= 1
                ? ''
                : pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                    .join(' ')
            const color = LINE_COLORS[sid] ?? '#6b7280'
            return (
              <g key={sid}>
                {dPath ? (
                  <path
                    d={dPath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={p.c > 0 ? 4.5 : 3.5}
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                  >
                    <title>
                      {(statuses.find((s) => s.id === sid)?.status_name ?? STATUS_LABELS[sid] ?? sid) +
                        ': ' +
                        p.c +
                        ' — ' +
                        (dates[i] === '__none__' ? 'ไม่ระบุวันเท' : formatDate(dates[i]))}
                    </title>
                  </circle>
                ))}
              </g>
            )
          })}

          {dates.map((d, i) => {
            const label = d === '__none__' ? 'ไม่ระบุ' : formatDate(d)
            const x = xAt(i, n)
            return (
              <text
                key={d + i}
                x={x}
                y={vbH - 12}
                textAnchor={n <= 2 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className="fill-[#6b7280] text-[9px] md:text-[10px]"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e2e6ec]/80 pt-3 text-[10px] text-[#374151] md:text-xs">
        {statusIds.map((sid) => {
          const color = LINE_COLORS[sid] ?? '#6b7280'
          const name = statuses.find((s) => s.id === sid)?.status_name ?? STATUS_LABELS[sid] ?? String(sid)
          return (
            <span key={sid} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
              {name}
            </span>
          )
        })}
      </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { statuses } = useMasterDataStore()
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [pending, setPending] = useState<PendingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาในรายการรอดำเนินการ (Client, วันเท, structure)…',
    ariaLabel: 'ค้นหาใน Dashboard',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  useEffect(() => {
    async function load() {
      try {
        const countsMap: Record<number, number> = {}
        await Promise.all(
          [1, 2, 3, 4, 5, 6, 7, 8].map(async (s) => {
            const { count } = await supabase
              .from('Request')
              .select('*', { count: 'exact', head: true })
              .eq('status_id', s)
            countsMap[s] = count ?? 0
          })
        )

        const { data: rows } = await supabase
          .from('Request')
          .select('id, casting_date, status_id, structure_no, client:Client(client_name)')
          .in('status_id', [1, 2, 3, 5])
          .order('booked_at', { ascending: false })
          .limit(20)

        setCounts(countsMap)
        setPending((rows ?? []) as unknown as PendingRow[])
      } catch (e) {
        console.error('Admin dashboard load:', e)
        setCounts({})
        setPending([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const summaryIds = [1, 2, 3, 4, 5, 8] as const
  const summaryCards = useMemo(
    () =>
      summaryIds.map((id) => ({
        id,
        label: statuses.find((s) => s.id === id)?.status_name ?? STATUS_LABELS[id],
      })),
    [statuses],
  )

  const filteredPending = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return pending
    return pending.filter((r) => {
      const client = pendingClientName(r).toLowerCase()
      const date = formatDate(r.casting_date).toLowerCase()
      const str = (r.structure_no ?? '').toLowerCase()
      const st = String(r.status_id)
      const label = (
        statuses.find((s) => s.id === r.status_id)?.status_name ??
        STATUS_LABELS[r.status_id] ??
        ''
      ).toLowerCase()
      const blob = `${client} ${date} ${str} ${st} ${label}`
      return blob.includes(t)
    })
  }, [pending, q, statuses])

  /** POUR-style accent strips (blue + industrial gray). */
  const accentBar = [
    'from-[#2563eb] to-[#1d4ed8]',
    'from-[#3b82f6] to-[#2563eb]',
    'from-[#6b7280] to-[#2563eb]',
    'from-[#0891b2] to-[#2563eb]',
    'from-[#2563eb] to-[#1e3a8a]',
    'from-[#9ca3af] to-[#4b5563]',
  ] as const

  return (
    <div className={app.pageAdmin}>
      <h1 className={cn('text-2xl font-bold tracking-tight md:text-3xl', theme.brandWordmark)}>
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {summaryCards.map(({ id, label }, i) => (
          <Card
            key={id}
            className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80"
          >
            <div className={cn('h-1 bg-gradient-to-r', accentBar[i % accentBar.length])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">{label}</p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : (counts[id] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className={rq.cardTitle}>รายการรอดำเนินการ</h2>
        <PendingQueueLineChart
          rows={filteredPending}
          statuses={statuses}
          loading={loading}
          emptySearch={!loading && pending.length > 0 && filteredPending.length === 0}
        />
      </div>
    </div>
  )
}

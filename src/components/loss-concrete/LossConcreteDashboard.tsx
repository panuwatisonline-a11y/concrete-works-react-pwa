import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Timeline from '@mui/icons-material/Timeline'
import Warning from '@mui/icons-material/Warning'
import { AppIcon } from '@/components/icons/AppIcon'
import { LossConcreteChartTooltip } from '@/components/loss-concrete/LossConcreteChartTooltip'
import { LOSS_MONTHS, type LossConcreteRecord } from '@/lib/lossConcreteAnalytics'
import { TrendGranularityToggle } from '@/pages/admin/AdminDashboardCharts'
import type { TrendGranularity } from '@/lib/adminDashboardAnalytics'
import { cn } from '@/lib/utils'
import { useChartColors } from '@/lib/chartTheme'
import { glass } from '@/lib/requestUi'

interface LossCat {
  key: string
  label: string
  keyFn: (d: LossConcreteRecord) => string
  filter: ((d: LossConcreteRecord) => boolean) | null
}

const LOSS_CATS: LossCat[] = [
  { key: 'staff', label: 'By Staff', keyFn: (d) => d.staff, filter: null },
  { key: 'client', label: 'By Sub Contractor', keyFn: (d) => d.client, filter: null },
  {
    key: 'structure',
    label: 'By Structure',
    keyFn: (d) => d.structure,
    filter: (d) => !/lean|blinding/i.test(d.structure) && !/bored\s*pile/i.test(d.structure),
  },
  {
    key: 'lean',
    label: 'Lean / Blinding',
    keyFn: (d) => d.structure,
    filter: (d) => /lean|blinding/i.test(d.structure),
  },
  {
    key: 'boredpile',
    label: 'Bored Pile',
    keyFn: (d) => d.structure,
    filter: (d) => /bored\s*pile/i.test(d.structure),
  },
]

interface LossItem {
  name: string
  lossM3: number
  dwgVol: number
  confVol: number
  lossPct: number
  count: number
}

interface CategoryGroup {
  key: string
  label: string
  items: LossItem[]
}

interface Selection {
  category: string
  value: string | null
}

type CmpMode = 'm3' | 'pct'

const panelClass = cn(
  glass.surface,
  'overflow-hidden rounded-[14px] border border-[color:var(--pour-surface-border)] p-5 shadow-[var(--glass-shadow-sm)]',
)

const tabBtn = (active: boolean, activeClass: string) =>
  cn(
    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
    active ? activeClass : 'text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )

interface LossConcreteDashboardProps {
  records: LossConcreteRecord[]
}

export function LossConcreteDashboard({ records }: LossConcreteDashboardProps) {
  const { grid: cGrid, axis: cAxis, cursor: cCursor } = useChartColors()
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('month')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [cmpMode, setCmpMode] = useState<CmpMode>('m3')

  const lossItems = useMemo(() => records.filter((d) => d.dwgVol > 0), [records])

  const activeItems = useMemo(() => {
    if (!selection) return lossItems
    const cat = LOSS_CATS.find((c) => c.key === selection.category)
    if (!cat) return lossItems
    let subset = cat.filter ? lossItems.filter(cat.filter) : lossItems
    if (selection.value) subset = subset.filter((d) => (cat.keyFn(d) || 'Unknown') === selection.value)
    return subset
  }, [lossItems, selection])

  const categoryGroups = useMemo((): CategoryGroup[] => {
    return LOSS_CATS.map((cat) => {
      const subset = cat.filter ? lossItems.filter(cat.filter) : lossItems
      const map: Record<string, { name: string; lossM3: number; dwgVol: number; confVol: number; count: number }> =
        {}
      subset.forEach((d) => {
        const key = cat.keyFn(d) || 'Unknown'
        if (!map[key]) map[key] = { name: key, lossM3: 0, dwgVol: 0, confVol: 0, count: 0 }
        map[key].lossM3 += d.lossM3
        map[key].dwgVol += d.dwgVol
        map[key].confVol += d.confirmVol
        map[key].count++
      })
      const items: LossItem[] = Object.values(map)
        .map((o) => ({
          name: o.name,
          lossM3: +o.lossM3.toFixed(2),
          dwgVol: +o.dwgVol.toFixed(2),
          confVol: +o.confVol.toFixed(2),
          lossPct: o.dwgVol > 0 ? +(o.lossM3 / o.dwgVol * 100).toFixed(2) : 0,
          count: o.count,
        }))
        .sort((a, b) => b.lossM3 - a.lossM3)
      return { key: cat.key, label: cat.label, items }
    })
  }, [lossItems])

  const kpi = useMemo(() => {
    let totalLoss = 0
    let totalDwg = 0
    let totalConf = 0
    activeItems.forEach((d) => {
      totalLoss += d.lossM3
      totalDwg += d.dwgVol
      totalConf += d.confirmVol
    })
    return {
      count: activeItems.length,
      lossM3: totalLoss.toFixed(2),
      lossPct: totalDwg > 0 ? (totalLoss / totalDwg * 100).toFixed(2) : '0.00',
      dwgVol: totalDwg.toFixed(2),
      confVol: totalConf.toFixed(2),
    }
  }, [activeItems])

  const comparisonData = useMemo(() => {
    if (!selection) return null
    const group = categoryGroups.find((g) => g.key === selection.category)
    if (!group || group.items.length === 0) return null
    return group.items.map((item) => ({
      name: item.name,
      'DWG Vol': item.dwgVol,
      'Confirm Vol': item.confVol,
      'Loss (m³)': item.lossM3,
    }))
  }, [selection, categoryGroups])

  const comparisonLabel = selection
    ? LOSS_CATS.find((c) => c.key === selection.category)?.label || ''
    : ''

  const trendData = useMemo(() => {
    if (activeItems.length === 0) return []
    const maxTs = activeItems.reduce((m, i) => Math.max(m, i.timestamp), 0)
    const maxDate = new Date(maxTs)
    let cutoffTs = 0
    if (trendGranularity === 'day') {
      const c = new Date(maxDate)
      c.setDate(c.getDate() - 29)
      c.setHours(0, 0, 0, 0)
      cutoffTs = c.getTime()
    } else if (trendGranularity === 'week') {
      const c = new Date(maxDate)
      c.setDate(c.getDate() - 83)
      c.setHours(0, 0, 0, 0)
      cutoffTs = c.getTime()
    } else if (trendGranularity === 'month') {
      const c = new Date(maxDate)
      c.setMonth(c.getMonth() - 11)
      c.setDate(1)
      c.setHours(0, 0, 0, 0)
      cutoffTs = c.getTime()
    }

    const getKeyInfo = (item: LossConcreteRecord) => {
      const d = new Date(item.timestamp)
      if (trendGranularity === 'day') {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return {
          key: `${yyyy}-${mm}-${dd}`,
          ts: new Date(yyyy, d.getMonth(), d.getDate()).getTime(),
          name: `${dd}/${mm}`,
        }
      }
      if (trendGranularity === 'week') {
        const dow = d.getDay()
        const diff = dow === 0 ? -6 : 1 - dow
        const ws = new Date(d)
        ws.setDate(d.getDate() + diff)
        ws.setHours(0, 0, 0, 0)
        const wy = ws.getFullYear()
        const wm = String(ws.getMonth() + 1).padStart(2, '0')
        const wd = String(ws.getDate()).padStart(2, '0')
        return { key: `${wy}-${wm}-${wd}`, ts: ws.getTime(), name: `${wd}/${wm}` }
      }
      if (trendGranularity === 'month') {
        if (item.month === 'Unknown') return null
        const [mon, yr] = item.month.split(' ')
        const monIdx = LOSS_MONTHS.indexOf(mon as (typeof LOSS_MONTHS)[number])
        return {
          key: item.month,
          ts: monIdx >= 0 ? new Date(+yr, monIdx, 1).getTime() : item.timestamp,
          name: item.month,
        }
      }
      const yr = d.getFullYear()
      return { key: String(yr), ts: new Date(yr, 0, 1).getTime(), name: String(yr) }
    }

    const res: Record<
      string,
      { name: string; ts: number; 'DWG Vol': number; 'Confirm Vol': number; 'Loss (m³)': number }
    > = {}
    activeItems.forEach((item) => {
      if (item.timestamp < cutoffTs) return
      const info = getKeyInfo(item)
      if (!info) return
      const { key, ts, name } = info
      if (!res[key]) res[key] = { name, ts, 'DWG Vol': 0, 'Confirm Vol': 0, 'Loss (m³)': 0 }
      res[key]['DWG Vol'] += item.dwgVol
      res[key]['Confirm Vol'] += item.confirmVol
      res[key]['Loss (m³)'] += item.lossM3
    })

    return Object.values(res)
      .sort((a, b) => a.ts - b.ts)
      .map((o) => ({
        name: o.name,
        'DWG Vol': +o['DWG Vol'].toFixed(2),
        'Confirm Vol': +o['Confirm Vol'].toFixed(2),
        'Loss (m³)': +o['Loss (m³)'].toFixed(2),
      }))
  }, [activeItems, trendGranularity])

  const chartLabel = selection
    ? selection.value || LOSS_CATS.find((c) => c.key === selection.category)?.label || ''
    : 'ทั้งหมด'

  const kpiCards = [
    { label: 'รายการ', value: kpi.count, unit: '', accent: 'from-neutral-600 to-neutral-400' },
    { label: 'DWG Vol', value: kpi.dwgVol, unit: 'm³', accent: 'from-neutral-500 to-neutral-400' },
    { label: 'Confirm Vol', value: kpi.confVol, unit: 'm³', accent: 'from-emerald-600 to-teal-500' },
    {
      label: 'Total Loss',
      value: kpi.lossM3,
      unit: 'm³',
      accent: parseFloat(kpi.lossM3) > 0 ? 'from-rose-600 to-pink-500' : 'from-emerald-600 to-teal-500',
    },
    {
      label: 'Loss % of DWG',
      value: kpi.lossPct,
      unit: '%',
      accent: parseFloat(kpi.lossPct) > 0 ? 'from-orange-500 to-amber-500' : 'from-emerald-600 to-teal-500',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpiCards.map(({ label, value, unit, accent }) => (
          <div key={label} className={cn('rounded-xl bg-gradient-to-br p-px shadow-sm', accent)}>
            <div className="h-full rounded-xl bg-[color:var(--glass-bg)] p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-pour-muted">{label}</p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-[color:var(--pour-ink-0)]">
                {value}
                {unit ? <span className="ml-1 text-xs font-semibold text-pour-muted">{unit}</span> : null}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className={cn(panelClass, 'min-w-0 flex-1')}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--pour-ink-0)]">
                <AppIcon icon={Warning} size="sm" className="text-rose-500" />
                Loss Concrete Trend
              </h3>
              <p className="ml-6 mt-0.5 text-xs font-semibold text-rose-600/90 dark:text-rose-300/80">{chartLabel}</p>
            </div>
            <TrendGranularityToggle value={trendGranularity} onChange={setTrendGranularity} />
          </div>
          {trendData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm italic text-pour-muted">ไม่มีข้อมูล</div>
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 24, right: 12, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lgLossDwg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lgLossConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lgLossRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={cGrid} />
                  <XAxis dataKey="name" stroke={cAxis} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={cAxis} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={(props) => (
                      <LossConcreteChartTooltip
                        active={props.active}
                        payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                        label={props.label}
                        valueFormat="volume"
                      />
                    )}
                    cursor={{ stroke: cCursor, strokeWidth: 1, strokeDasharray: '4 4' }}
                    wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: cAxis, paddingTop: 6 }} />
                  <Area
                    type="monotone"
                    dataKey="DWG Vol"
                    name="DWG Volume"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    fill="url(#lgLossDwg)"
                    dot={{ r: 3, fill: '#94A3B8', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#94A3B8', strokeWidth: 0 }}
                  >
                    <LabelList
                      dataKey="DWG Vol"
                      position="top"
                      style={{ fill: cAxis, fontSize: 10, fontWeight: 600, pointerEvents: 'none' }}
                      formatter={(v) => (typeof v === 'number' && v > 0 ? v.toFixed(2) : '')}
                    />
                  </Area>
                  <Area
                    type="monotone"
                    dataKey="Confirm Vol"
                    name="Confirm Volume"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#lgLossConf)"
                    dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }}
                  >
                    <LabelList
                      dataKey="Confirm Vol"
                      position="top"
                      style={{ fill: '#10B981', fontSize: 10, fontWeight: 600, pointerEvents: 'none' }}
                      formatter={(v) => (typeof v === 'number' && v > 0 ? v.toFixed(2) : '')}
                    />
                  </Area>
                  <Area
                    type="monotone"
                    dataKey="Loss (m³)"
                    name="Loss Concrete"
                    stroke="#F43F5E"
                    strokeWidth={3}
                    fill="url(#lgLossRed)"
                    dot={{ r: 3, fill: '#F43F5E', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#F43F5E', strokeWidth: 0 }}
                  >
                    <LabelList
                      dataKey="Loss (m³)"
                      position="top"
                      style={{ fill: '#F43F5E', fontSize: 10, fontWeight: 600, pointerEvents: 'none' }}
                      formatter={(v) => (typeof v === 'number' && v > 0 ? v.toFixed(2) : '')}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {selection && comparisonData ? (
          <div className={cn(panelClass, 'min-w-0 flex-1')}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--pour-ink-0)]">
                  <AppIcon icon={Timeline} size="sm" className="text-amber-500" />
                  Comparison
                </h3>
                <p className="ml-6 mt-0.5 text-xs font-semibold text-amber-600/90 dark:text-amber-300/80">
                  {comparisonLabel}
                </p>
              </div>
              <div className="flex gap-1 rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] p-1">
                <button type="button" onClick={() => setCmpMode('m3')} className={tabBtn(cmpMode === 'm3', 'bg-amber-500 text-white')}>
                  m³
                </button>
                <button type="button" onClick={() => setCmpMode('pct')} className={tabBtn(cmpMode === 'pct', 'bg-amber-500 text-white')}>
                  %
                </button>
              </div>
            </div>
            {(() => {
              const sourceData =
                cmpMode === 'pct'
                  ? comparisonData.map((d) => ({
                      name: d.name,
                      'DWG (100%)': 100,
                      'Confirm %': d['DWG Vol'] > 0 ? +(d['Confirm Vol'] / d['DWG Vol'] * 100).toFixed(2) : 0,
                      'Loss %': d['DWG Vol'] > 0 ? +(d['Loss (m³)'] / d['DWG Vol'] * 100).toFixed(2) : 0,
                    }))
                  : comparisonData
              const k1 = cmpMode === 'pct' ? 'DWG (100%)' : 'DWG Vol'
              const k2 = cmpMode === 'pct' ? 'Confirm %' : 'Confirm Vol'
              const k3 = cmpMode === 'pct' ? 'Loss %' : 'Loss (m³)'
              const zero: Record<string, number | string> = { _lbl: '', [k1]: 0, [k2]: 0, [k3]: 0 }
              const pyramidData: Record<string, number | string>[] = [{ ...zero }]
              sourceData.forEach((d) => {
                pyramidData.push({ ...d, _lbl: d.name })
                pyramidData.push({ ...zero })
              })
              const bottomPad = comparisonData.length > 3 ? 72 : 24
              return (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pyramidData} margin={{ top: 24, right: 16, left: -14, bottom: bottomPad }}>
                      <defs>
                        <linearGradient id="cmpDwg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="cmpConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.65} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="cmpLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={cGrid} />
                      <XAxis
                        dataKey="_lbl"
                        stroke={cAxis}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={comparisonData.length > 3 ? -35 : 0}
                        textAnchor={comparisonData.length > 3 ? 'end' : 'middle'}
                        interval={0}
                        tick={{ fill: cAxis, fontSize: 10 }}
                      />
                      <YAxis
                        stroke={cAxis}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => (cmpMode === 'pct' ? `${v}%` : String(v))}
                      />
                      <Tooltip
                        content={(props) => (
                          <LossConcreteChartTooltip
                            active={props.active}
                            payload={props.payload as readonly { name?: string | number; value?: number | string; color?: string }[]}
                            label={props.label}
                            valueFormat={cmpMode === 'pct' ? 'percent' : 'volume'}
                          />
                        )}
                        cursor={{ stroke: cCursor, strokeWidth: 1, strokeDasharray: '4 4' }}
                        wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, color: cAxis, paddingTop: 6 }} />
                      {cmpMode === 'm3' ? (
                        <Area
                          type="linear"
                          dataKey={k1}
                          name="DWG Volume"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          strokeDasharray="5 3"
                          fill="url(#cmpDwg)"
                          dot={false}
                          activeDot={{ r: 5 }}
                        >
                          <LabelList
                            dataKey={k1}
                            position="top"
                            style={{ fill: cAxis, fontSize: 9, fontWeight: 600 }}
                            formatter={(v) => (typeof v === 'number' && v > 0 ? v.toFixed(2) : '')}
                          />
                        </Area>
                      ) : null}
                      {cmpMode === 'm3' ? (
                        <Area
                          type="linear"
                          dataKey={k2}
                          name="Confirm Volume"
                          stroke="#10B981"
                          strokeWidth={2}
                          fill="url(#cmpConf)"
                          dot={false}
                          activeDot={{ r: 5 }}
                        >
                          <LabelList
                            dataKey={k2}
                            position="top"
                            style={{ fill: '#10B981', fontSize: 9, fontWeight: 600 }}
                            formatter={(v) => (typeof v === 'number' && v > 0 ? v.toFixed(2) : '')}
                          />
                        </Area>
                      ) : null}
                      <Area
                        type="linear"
                        dataKey={k3}
                        name={cmpMode === 'pct' ? 'Loss %' : 'Loss Concrete'}
                        stroke="#F43F5E"
                        strokeWidth={3}
                        fill="url(#cmpLoss)"
                        dot={false}
                        activeDot={{ r: 6 }}
                      >
                        <LabelList
                          dataKey={k3}
                          position="top"
                          style={{ fill: '#F43F5E', fontSize: 9, fontWeight: 700 }}
                          formatter={(v) =>
                            typeof v === 'number' && v !== 0
                              ? cmpMode === 'pct'
                                ? `${v.toFixed(2)}%`
                                : v.toFixed(2)
                              : ''
                          }
                        />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
          </div>
        ) : null}
      </div>

      <div className={cn(panelClass, 'p-0')}>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] px-4 py-3">
          <button
            type="button"
            onClick={() => setSelection(null)}
            className={tabBtn(
              !selection,
              'bg-[color:var(--pour-accent)] text-[color:var(--pour-accent-foreground,#fff)] shadow-sm',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <AppIcon icon={Timeline} size="xs" sx={{ fontSize: 12 }} />
              All Data
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{lossItems.length}</span>
            </span>
          </button>
          {categoryGroups.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelection({ category: cat.key, value: null })}
              className={tabBtn(
                selection?.category === cat.key,
                'bg-rose-500 text-white shadow-sm shadow-rose-500/20',
              )}
            >
              {cat.label}
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{cat.items.length}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {!selection ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[color:var(--pour-surface-border)] text-[10px] uppercase tracking-wider text-pour-muted">
                  <th className="px-5 py-3 text-left font-bold">Category</th>
                  <th className="px-4 py-3 text-right font-bold">Items</th>
                  <th className="px-4 py-3 text-right font-bold">DWG Vol (m³)</th>
                  <th className="px-4 py-3 text-right font-bold">Confirm Vol (m³)</th>
                  <th className="px-4 py-3 text-right font-bold">Loss (m³)</th>
                  <th className="px-5 py-3 text-right font-bold">Loss % DWG</th>
                </tr>
              </thead>
              <tbody>
                {categoryGroups.map((cat) => {
                  const totDwg = cat.items.reduce((s, i) => s + i.dwgVol, 0)
                  const totConf = cat.items.reduce((s, i) => s + i.confVol, 0)
                  const totLoss = cat.items.reduce((s, i) => s + i.lossM3, 0)
                  const lossPct = totDwg > 0 ? (totLoss / totDwg * 100).toFixed(2) : '—'
                  return (
                    <tr
                      key={cat.key}
                      onClick={() => setSelection({ category: cat.key, value: null })}
                      className="cursor-pointer border-b border-[color:var(--glass-border-subtle)] transition-colors last:border-b-0 hover:bg-[color:var(--pour-nav-hover-bg)]"
                    >
                      <td className="px-5 py-3 font-bold text-[color:var(--pour-ink-0)]">{cat.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-pour-muted">{cat.items.length}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-pour-muted">{totDwg.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {totConf.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-bold tabular-nums',
                          totLoss > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {totLoss.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          'px-5 py-3 text-right font-bold tabular-nums',
                          parseFloat(String(lossPct)) > 0
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {lossPct}
                        {lossPct !== '—' ? '%' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            (() => {
              const group = categoryGroups.find((g) => g.key === selection.category)
              if (!group || group.items.length === 0) {
                return <p className="px-5 py-8 text-center text-sm italic text-pour-muted">ไม่มีข้อมูล</p>
              }
              return (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[color:var(--pour-surface-border)] text-[10px] uppercase tracking-wider text-pour-muted">
                      <th className="px-5 py-3 text-left font-bold">Name</th>
                      <th className="px-4 py-3 text-right font-bold">Items</th>
                      <th className="px-4 py-3 text-right font-bold">DWG Vol (m³)</th>
                      <th className="px-4 py-3 text-right font-bold">Confirm Vol (m³)</th>
                      <th className="px-4 py-3 text-right font-bold">Loss (m³)</th>
                      <th className="px-5 py-3 text-right font-bold">Loss % DWG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr
                        key={item.name}
                        onClick={() =>
                          setSelection({
                            category: selection.category,
                            value: item.name === selection.value ? null : item.name,
                          })
                        }
                        className={cn(
                          'cursor-pointer border-b border-[color:var(--glass-border-subtle)] transition-colors last:border-b-0',
                          selection.value === item.name
                            ? 'border-l-2 border-l-rose-500 bg-rose-500/10'
                            : 'hover:bg-[color:var(--pour-nav-hover-bg)]',
                        )}
                      >
                        <td
                          className={cn(
                            'px-5 py-3 font-semibold',
                            selection.value === item.name ? 'text-rose-600 dark:text-rose-300' : 'text-[color:var(--pour-ink-0)]',
                          )}
                        >
                          {item.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-pour-muted">{item.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-pour-muted">{item.dwgVol.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {item.confVol.toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-bold tabular-nums',
                            item.lossM3 > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {item.lossM3.toFixed(2)}
                        </td>
                        <td
                          className={cn(
                            'px-5 py-3 text-right font-bold tabular-nums',
                            item.lossPct > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {Number(item.lossPct).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()
          )}
        </div>
      </div>
    </div>
  )
}

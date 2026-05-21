import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, HardHat, Layers, TrendingUp } from 'lucide-react'
import { LossConcreteChartTooltip } from '@/components/loss-concrete/LossConcreteChartTooltip'
import { DashboardKpiBox } from '@/components/dashboard/DashboardKpiBox'
import type { MixcodeBalanceRow } from '@/lib/mixcodeBalance'
import { app, glass, rq, tableCompact, type } from '@/lib/requestUi'
import { cn, formatVolumeNumber } from '@/lib/utils'
import { useThemeStore } from '@/stores/themeStore'

interface MixCodeBalancePanelProps {
  rows: MixcodeBalanceRow[]
  loading: boolean
}

const dashTable = {
  table: cn(tableCompact.table, 'min-w-[72rem]'),
  head: tableCompact.head,
  body: tableCompact.body,
} as const

export function MixCodeBalancePanel({ rows, loading }: MixCodeBalancePanelProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const cGrid = isDark ? '#334155' : '#E2E8F0'
  const cAxis = isDark ? '#94A3B8' : '#64748B'
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null)

  const suppliers = useMemo(
    () => [...new Set(rows.map((r) => r.supplier).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th')),
    [rows],
  )

  const filtered = useMemo(
    () => (supplierFilter ? rows.filter((r) => r.supplier === supplierFilter) : rows),
    [rows, supplierFilter],
  )

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({
          poQty: acc.poQty + r.poQty,
          used: acc.used + r.used,
          pending: acc.pending + r.pending,
          balance: acc.balance + r.balance,
        }),
        { poQty: 0, used: 0, pending: 0, balance: 0 },
      ),
    [filtered],
  )

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSupplierFilter(null)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
            !supplierFilter
              ? 'border-[color:var(--pour-accent)] bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
              : 'border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] text-pour-muted hover:text-[color:var(--pour-ink-0)]',
          )}
        >
          All Suppliers
        </button>
        {suppliers.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSupplierFilter(supplierFilter === s ? null : s)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
              supplierFilter === s
                ? 'border-[color:var(--pour-accent)] bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                : 'border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] text-pour-muted hover:text-[color:var(--pour-ink-0)]',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardKpiBox
          title="Total PO Qty"
          value={totals.poQty.toFixed(2)}
          unit="m³"
          icon={<Layers size={20} />}
          color="from-blue-600 to-cyan-500"
        />
        <DashboardKpiBox
          title="Used (Completed)"
          value={totals.used.toFixed(2)}
          unit="m³"
          icon={<HardHat size={20} />}
          color="from-emerald-600 to-teal-500"
        />
        <DashboardKpiBox
          title="Pending (Active)"
          value={totals.pending.toFixed(2)}
          unit="m³"
          icon={<Activity size={20} />}
          color="from-amber-600 to-orange-500"
        />
        <DashboardKpiBox
          title="Balance Remaining"
          value={totals.balance.toFixed(2)}
          unit="m³"
          icon={<TrendingUp size={20} />}
          color={totals.balance < 0 ? 'from-rose-600 to-pink-500' : 'from-slate-600 to-slate-400'}
          isAlert={totals.balance < 0}
        />
      </div>

      {filtered.length > 0 ? (
        <section
          className={cn(
            glass.surface,
            'overflow-hidden rounded-[14px] p-5 shadow-[var(--glass-shadow-sm)]',
          )}
        >
          <h2 className={cn(rq.cardTitle, 'mb-4 flex items-center gap-2 text-sm')}>
            <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--pour-accent)]" aria-hidden />
            Balance per Mix Code (m³)
          </h2>
          <div style={{ height: Math.max(180, filtered.length * 42) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filtered.map((r) => ({
                  name: r.mixcode || '—',
                  Used: r.used,
                  Pending: r.pending,
                  Balance: Math.max(r.balance, 0),
                  Over: r.balance < 0 ? Math.abs(r.balance) : 0,
                }))}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={cGrid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: cAxis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: cAxis, fontSize: 11, fontFamily: 'monospace' }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  content={(props) => (
                    <LossConcreteChartTooltip
                      active={props.active}
                      payload={
                        props.payload as readonly {
                          name?: string | number
                          value?: number | string
                          color?: string
                        }[]
                      }
                      label={props.label}
                      valueFormat="volume"
                    />
                  )}
                  wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: cAxis, paddingTop: 8 }} />
                <Bar dataKey="Used" stackId="a" fill="#10B981" name="Used (m³)" />
                <Bar dataKey="Pending" stackId="a" fill="#F59E0B" name="Pending (m³)" />
                <Bar
                  dataKey="Balance"
                  stackId="a"
                  fill={isDark ? '#334155' : '#94A3B8'}
                  radius={[0, 4, 4, 0]}
                  name="Balance (m³)"
                />
                <Bar dataKey="Over" stackId="a" fill="#F43F5E" radius={[0, 4, 4, 0]} name="Over (m³)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      <section
        className={cn(
          glass.surface,
          'overflow-hidden rounded-[14px] shadow-[var(--glass-shadow-sm)]',
        )}
        aria-label="Mix code balance detail"
      >
        <div
          className={cn(
            rq.cardHeader,
            'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <h2 className={cn(rq.cardTitle, 'flex items-center gap-2 text-sm')}>
            <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--pour-accent)]" aria-hidden />
            Mix Code Balance Detail
          </h2>
          <p className={cn(type.caption, 'tabular-nums')}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className={app.tableWrap}>
          <table className={dashTable.table}>
            <thead className={dashTable.head}>
              <tr>
                <th>Supplier</th>
                <th>Mix Code</th>
                <th>Strength</th>
                <th>Sample Type</th>
                <th>Slump</th>
                <th className="text-right">PO Qty (m³)</th>
                <th className="text-right">Used (m³)</th>
                <th className="text-right">Pending (m³)</th>
                <th className="text-right">Balance (m³)</th>
                <th>Usage %</th>
                <th>For Structure</th>
              </tr>
            </thead>
            <tbody className={dashTable.body}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className={tableCompact.emptyCell}>
                    No mix code data — add records on the Mixcode tab
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isOver = row.balance < 0
                  const isLow = !isOver && row.usedPct >= 80
                  return (
                    <tr key={row.id}>
                      <td className="font-medium">{row.supplier || '—'}</td>
                      <td className="font-mono font-semibold text-[color:var(--pour-accent)]">
                        {row.mixcode || '—'}
                      </td>
                      <td>{row.strengthLabel}</td>
                      <td className="text-xs">{row.sampleType || '—'}</td>
                      <td className="text-xs">{row.slump || '—'}</td>
                      <td className="text-right font-mono tabular-nums">{row.poQty.toFixed(2)}</td>
                      <td className="text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.used.toFixed(2)}
                      </td>
                      <td className="text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {row.pending.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          'text-right font-mono font-semibold tabular-nums',
                          isOver && 'text-rose-600 dark:text-rose-400',
                          isLow && !isOver && 'text-amber-600 dark:text-amber-400',
                        )}
                      >
                        {row.balance.toFixed(2)}
                        {isOver ? (
                          <span className="ml-1 text-[10px] font-normal text-rose-500">(Over)</span>
                        ) : null}
                      </td>
                      <td className="min-w-[7rem]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--pour-surface-tint)]">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(row.usedPct, 100)}%`,
                                background: isOver ? '#F43F5E' : isLow ? '#F59E0B' : '#10B981',
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              'w-14 text-right text-[11px] font-bold tabular-nums',
                              isOver && 'text-rose-600 dark:text-rose-400',
                              isLow && !isOver && 'text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {row.usedPct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate text-xs" title={row.structureList}>
                        {row.structureList || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {filtered.length > 0 ? (
              <tfoot>
                <tr className="border-t border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)]/80 font-semibold">
                  <td colSpan={5} className="px-3 py-2.5 text-xs uppercase tracking-wider text-pour-muted">
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    {formatVolumeNumber(totals.poQty)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatVolumeNumber(totals.used)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {formatVolumeNumber(totals.pending)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2.5 text-right font-mono tabular-nums',
                      totals.balance < 0 && 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {formatVolumeNumber(totals.balance)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ClipboardList, Layers, List, MapPin } from 'lucide-react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  buildMonthGridCells,
  calendarMonthRange,
  dateToIsoLocal,
  fetchRequestsForCalendarMonth,
  formatCalendarMonthTitle,
  groupRequestsByCastingDate,
  type CalendarDayBucket,
} from '@/lib/requestCalendarData'
import { todayIsoLocal } from '@/lib/cstListDue'
import { cacheRequestRows } from '@/lib/offline/cache'
import { isFullyOnline } from '@/stores/connectivityStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { icon, ICON_STROKE, rq, type } from '@/lib/requestUi'
import { cn, formatDate, formatTime, formatVolumeNumber } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] as const

type RequestBookingCalendarProps = {
  scopeMine: boolean
  userId?: string
  clientId?: number | null
}

export function RequestBookingCalendar({
  scopeMine,
  userId,
  clientId,
}: RequestBookingCalendarProps) {
  const [month, setMonth] = useState(() => {
    const t = todayIsoLocal().split('-').map(Number)
    return new Date(t[0], t[1] - 1, 1)
  })
  const [selectedIso, setSelectedIso] = useState(todayIsoLocal)
  const [rows, setRows] = useState<RequestWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!opts?.background) setLoading(true)
      try {
        const data = await fetchRequestsForCalendarMonth({
          month,
          scopeMine,
          userId,
          clientId,
        })
        setRows(data)
        if (isFullyOnline()) await cacheRequestRows(data)
        useConnectivityStore.getState().setUsingOfflineCache(!isFullyOnline())
      } catch (e) {
        console.error('Calendar load:', e)
        setRows([])
      } finally {
        setLoading(false)
      }
    },
    [month, scopeMine, userId, clientId],
  )

  useEffect(() => {
    void load()
  }, [load])

  useDataSyncRefetch(['Request', '*'], load)
  usePullToRefreshRegistration(() => load({ background: true }))

  const buckets = useMemo(() => groupRequestsByCastingDate(rows), [rows])
  const cells = useMemo(() => buildMonthGridCells(month), [month])
  const selectedBucket: CalendarDayBucket | undefined = buckets.get(selectedIso)
  const monthPourDays = buckets.size
  const monthPourCount = rows.length

  const shiftMonth = (delta: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(-1)} aria-label="เดือนก่อน">
            <ChevronLeft className={icon.sm} strokeWidth={ICON_STROKE} />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftMonth(1)} aria-label="เดือนถัดไป">
            <ChevronRight className={icon.sm} strokeWidth={ICON_STROKE} />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="ml-1" onClick={() => {
            const t = todayIsoLocal().split('-').map(Number)
            setMonth(new Date(t[0], t[1] - 1, 1))
            setSelectedIso(todayIsoLocal())
          }}>
            วันนี้
          </Button>
        </div>
        <p className={cn(type.bodyStrong, 'tabular-nums')}>{formatCalendarMonthTitle(month)}</p>
      </div>

      <p className={type.caption}>
        {loading
          ? 'กำลังโหลด…'
          : `${monthPourCount} รายการ · ${monthPourDays} วันเท (${calendarMonthRange(month).from} – ${calendarMonthRange(month).to})`}
      </p>

      <div className={cn(rq.card, 'overflow-hidden p-3 sm:p-4')}>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className={cn(type.caption, 'py-1 text-center font-medium text-pour-muted')}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[3.25rem]" aria-hidden />
            const iso = dateToIsoLocal(day)
            const bucket = buckets.get(iso)
            const isSelected = iso === selectedIso
            const isToday = iso === todayIsoLocal()
            const inMonth = day.getMonth() === month.getMonth()
            return (
              <button
                key={iso}
                type="button"
                disabled={!inMonth}
                onClick={() => setSelectedIso(iso)}
                className={cn(
                  'pour-interactive flex min-h-[3.25rem] flex-col items-center justify-start rounded-lg border px-0.5 py-1.5 text-center transition-colors',
                  !inMonth && 'pointer-events-none opacity-30',
                  isSelected
                    ? 'border-[color:var(--pour-accent)] bg-[color:var(--pour-accent)]/15'
                    : 'border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:var(--pour-nav-hover-bg)]',
                  isToday && !isSelected && 'ring-1 ring-[color:var(--pour-accent)]/40',
                )}
              >
                <span className={cn('text-sm font-semibold tabular-nums', isToday && 'text-[color:var(--pour-accent)]')}>
                  {day.getDate()}
                </span>
                {bucket ? (
                  <span
                    className={cn(
                      'mt-0.5 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                      'bg-[color:var(--pour-accent)] text-white',
                    )}
                  >
                    {bucket.count}
                  </span>
                ) : (
                  <span className="mt-1 h-4" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className={cn(rq.card, 'space-y-4 p-4 sm:p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={type.title}>
              วันเท {formatDate(`${selectedIso}T12:00:00`)}
            </h2>
            <p className={cn(type.caption, 'mt-1')}>
              {selectedBucket
                ? `${selectedBucket.count} รายการ · รวม ${formatVolumeNumber(selectedBucket.volumeRequest)} cu.m`
                : 'ไม่มีรายการจองในวันนี้'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/requests/booking-summary?date=${selectedIso}`}
              className={cn(
                'pour-interactive inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--glass-border)] px-3 py-2',
                type.caption,
                'font-medium hover:bg-[color:var(--pour-nav-hover-bg)]',
              )}
            >
              <ClipboardList className={icon.sm} strokeWidth={ICON_STROKE} />
              สรุปรายการจอง
            </Link>
            <Link
              to={`/requests?view=latest&casting_from=${selectedIso}&casting_to=${selectedIso}`}
              className={cn(
                'pour-interactive inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--glass-border)] px-3 py-2',
                type.caption,
                'font-medium hover:bg-[color:var(--pour-nav-hover-bg)]',
              )}
            >
              <List className={icon.sm} strokeWidth={ICON_STROKE} />
              รายการวันนี้
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-pour-muted">กำลังโหลด…</p>
        ) : !selectedBucket || selectedBucket.requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-pour-muted">ไม่มีรายการในวันที่เลือก</p>
        ) : (
          <ul className="space-y-2">
            {selectedBucket.requests.map((r) => {
              const loc = (r.location as { full_location?: string; location1?: string } | null)?.full_location
                ?? (r.location as { location1?: string } | null)?.location1
              const structureName = (r.structure as { structure_name?: string } | null)?.structure_name?.trim()
              const structureNo = r.structure_no?.trim()
              const structureLine = structureName
                ? structureNo
                  ? `${structureName} · ${structureNo}`
                  : structureName
                : structureNo ?? null
              const time = formatTime(r.request_time)
              return (
                <li key={r.id}>
                  <Link
                    to={`/requests/${r.id}`}
                    className={cn(
                      rq.card,
                      'pour-interactive flex gap-3 px-3 py-2.5 transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]',
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-start gap-1.5">
                            <Layers className={cn(icon.xs, 'mt-0.5 shrink-0 text-pour-muted')} strokeWidth={ICON_STROKE} aria-hidden />
                            <span className={cn(type.bodyStrong, 'min-w-0 leading-snug')}>
                              {structureLine ?? '—'}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <MapPin className={cn(icon.xs, 'mt-0.5 shrink-0 text-pour-muted')} strokeWidth={ICON_STROKE} aria-hidden />
                            <span className={cn(type.caption, 'min-w-0 leading-snug')}>
                              {loc?.trim() || '—'}
                            </span>
                          </div>
                        </div>
                        <StatusBadge statusId={r.status_id} size="sm" compact className="shrink-0" />
                      </div>
                      <p className={cn(type.caption, 'flex flex-wrap gap-x-2 gap-y-0.5 tabular-nums')}>
                        {time !== '-' ? <span>{time}</span> : null}
                        {r.volume_request != null ? (
                          <span>{formatVolumeNumber(r.volume_request)} m³</span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

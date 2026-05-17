import { Fragment, useEffect, useMemo } from 'react'
import { CalendarDays, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { CstBlankPrintButton } from '@/components/cst/CstBlankPrintButton'
import { CstListSection } from '@/components/cst/CstListSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CST_AGE_GROUP_LABELS_TH,
  cstRequestsForAgeOnTestDate,
  todayIsoLocal,
} from '@/lib/cstListDue'
import {
  localPrintCstFilterSchedule,
  warmCstFilterScheduleTemplateCache,
} from '@/lib/cstFilterPrint'
import { CstMixCodeCell } from '@/components/cst/CstMixCodeCell'
import { cstMixCodeLabelForCard, getCstListRowFields } from '@/lib/cstListRow'
import { app, ICON_STROKE, rq, tableCompact, type } from '@/lib/requestUi'
import { cn, formatDate } from '@/lib/utils'
import { CST_TEST_AGES, type RequestWithRelations } from '@/types/app.types'

const filterTableCompact = {
  table: cn(tableCompact.table, 'min-w-[52rem]'),
  head: tableCompact.head,
  body: tableCompact.body,
} as const

function CstFilterMobileCard({
  r,
  onRowClick,
}: {
  r: RequestWithRelations
  onRowClick: (request: RequestWithRelations) => void
}) {
  const f = getCstListRowFields(r)
  const rows: [string, string | null | undefined][] = [
    ['Concrete Work', f.concrete],
    ['Structure', f.structure],
    ['Location', f.location],
    ['Structure No.', f.structureNo],
    ['Mix Code', cstMixCodeLabelForCard(f.mix)],
    ['Volume', f.volume !== '-' ? f.volume : null],
  ]

  return (
    <button
      type="button"
      className={cn(
        rq.card,
        'w-full cursor-pointer overflow-hidden text-left text-xs leading-tight transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]',
      )}
      onClick={() => onRowClick(r)}
    >
      <div className="border-b border-[color:var(--glass-border-subtle)] px-3 py-2">
        <p className="text-sm font-semibold leading-tight">{f.structure ?? f.location ?? '—'}</p>
        <p className="mt-px text-[10px] text-pour-muted">{f.castingDate}</p>
      </div>
      <div className="grid grid-cols-[minmax(5.25rem,auto)_1fr] gap-x-2 gap-y-0.5 px-3 py-2">
        {rows.map(([label, value]) =>
          value ? (
            <Fragment key={label}>
              <span className="text-[10px] font-semibold text-pour-muted">{label}</span>
              <span className="min-w-0 font-medium">{value}</span>
            </Fragment>
          ) : null,
        )}
      </div>
    </button>
  )
}

function CstFilterTable({
  requests,
  onRowClick,
}: {
  requests: RequestWithRelations[]
  onRowClick: (request: RequestWithRelations) => void
}) {
  return (
    <>
      <div className="space-y-2 pour-desktop:hidden">
        {requests.map((r) => (
          <CstFilterMobileCard key={r.id} r={r} onRowClick={onRowClick} />
        ))}
      </div>
      <div className={cn(app.tableWrapNested, 'mt-0')}>
        <table className={filterTableCompact.table}>
          <thead className={filterTableCompact.head}>
            <tr>
              <th>Casting date</th>
              <th>Concrete Work</th>
              <th>Structure</th>
              <th>Location</th>
              <th>Structure No.</th>
              <th>Mix Code</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody className={filterTableCompact.body}>
            {requests.map((r) => {
              const f = getCstListRowFields(r)
              return (
                <tr key={r.id} className="cursor-pointer" onClick={() => onRowClick(r)}>
                  <td className="whitespace-nowrap tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <CstBlankPrintButton request={r} />
                      <span>{f.castingDate}</span>
                    </div>
                  </td>
                  <td>{f.concrete ?? '-'}</td>
                  <td>{f.structure ?? '-'}</td>
                  <td>{f.location ?? '-'}</td>
                  <td>{f.structureNo ?? '-'}</td>
                  <td>
                    <CstMixCodeCell mix={f.mix} />
                  </td>
                  <td className="tabular-nums whitespace-nowrap">{f.volume}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export type CstFilterByDatePanelProps = {
  requests: RequestWithRelations[]
  testDateIso: string
  search?: string
  onTestDateChange: (iso: string) => void
  onRowClick: (request: RequestWithRelations) => void
}

export function CstFilterByDatePanel({
  requests,
  testDateIso,
  search = '',
  onTestDateChange,
  onRowClick,
}: CstFilterByDatePanelProps) {
  useEffect(() => {
    warmCstFilterScheduleTemplateCache()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<(typeof CST_TEST_AGES)[number], RequestWithRelations[]>()
    for (const age of CST_TEST_AGES) {
      map.set(age, cstRequestsForAgeOnTestDate(requests, testDateIso, age))
    }
    return map
  }, [requests, testDateIso])

  const totalCount = useMemo(
    () => [...grouped.values()].reduce((sum, list) => sum + list.length, 0),
    [grouped],
  )

  const testDateDisplay =
    testDateIso && formatDate(`${testDateIso}T12:00:00`) !== '-'
      ? formatDate(`${testDateIso}T12:00:00`)
      : testDateIso

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg-2)]/40 px-4 py-3 sm:px-5">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label htmlFor="cst-filter-test-date" className="flex items-center gap-1.5 text-sm">
            <CalendarDays className="h-4 w-4 text-[color:var(--pour-accent)]" aria-hidden />
            วันทดสอบ
          </Label>
          <Input
            id="cst-filter-test-date"
            type="date"
            value={testDateIso}
            max="9999-12-31"
            onChange={(e) => onTestDateChange(e.target.value || todayIsoLocal())}
            className="max-w-[14rem]"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3 pb-0.5 sm:ml-auto">
          <p className={cn(type.caption, 'pb-2 sm:pb-0')}>
            รายการที่ครบกำหนดทดสอบวันที่ {testDateDisplay} · {totalCount} รายการ
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={totalCount === 0}
            onClick={() => {
              try {
                localPrintCstFilterSchedule(testDateIso, search)
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'เปิดหน้าพิมพ์ไม่สำเร็จ')
              }
            }}
          >
            <Printer className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
            พิมพ์รายการ
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {CST_TEST_AGES.map((age) => {
          const ageRequests = grouped.get(age) ?? []
          return (
            <CstListSection
              key={age}
              title={CST_AGE_GROUP_LABELS_TH[age]}
              count={ageRequests.length}
              defaultOpen={ageRequests.length > 0}
              emptyMessage="ไม่มีรายการในกลุ่มนี้"
            >
              <CstFilterTable requests={ageRequests} onRowClick={onRowClick} />
            </CstListSection>
          )
        })}
      </div>
    </div>
  )
}

import { cstTestDateDisplay, cstTestDateDisplayShort } from '@/lib/cstForm'
import { glass } from '@/lib/requestUi'
import { CST_TEST_AGES, type CstTestAge, type RequestWithRelations } from '@/types/app.types'
import { cn } from '@/lib/utils'

export const CST_AGE_COLUMN_LABELS: Record<CstTestAge, string> = {
  1: '1 Day',
  3: '3 Days',
  7: '7 Days',
  14: '14 Days',
  28: '28 Days',
}

type CstAgeColumnCellProps = {
  age: CstTestAge
  testDateLabel: string
  testDateShort: string
  saved: boolean
  canEdit: boolean
  /** เน้นเมื่อครบกำหนดวันนี้และยังไม่บันทึก */
  emphasized?: boolean
  onClick: () => void
}

function cstAgeCellClass(saved: boolean, interactive: boolean) {
  return cn(
    'flex w-full min-w-0 flex-col items-center justify-center rounded-[8px] border px-1.5 py-1.5 text-center transition-[border-color,background-color,box-shadow]',
    saved
      ? 'border-[rgba(22,163,74,0.45)] bg-[rgba(22,163,74,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
      : cn(
          glass.borderSubtle,
          'border-dashed bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
        ),
    interactive &&
      !saved &&
      'cursor-pointer hover:border-[color:var(--pour-accent)]/50 hover:bg-[var(--pour-accent-muted)] hover:shadow-sm',
    interactive &&
      saved &&
      'cursor-pointer hover:border-[rgba(22,163,74,0.55)] hover:bg-[rgba(22,163,74,0.16)]',
  )
}

function dateClass(saved: boolean) {
  return cn(
    'text-[11px] font-semibold leading-tight tabular-nums',
    saved ? 'text-[#15803d]' : 'text-pour-muted',
  )
}

/** การ์ดอายุ CST — วันทดสอบ + สถานะจากสีการ์ด */
export function CstAgeColumnCell({
  age,
  testDateLabel,
  testDateShort,
  saved,
  canEdit,
  emphasized,
  onClick,
}: CstAgeColumnCellProps) {
  const title = saved
    ? `มีผล CST แล้ว · วันทดสอบ ${testDateLabel} (+${age} วัน)`
    : `ยังไม่มีผล · วันทดสอบ ${testDateLabel} (+${age} วัน) — คลิกเพื่อบันทึก`

  const dateEl = (
    <span className={dateClass(saved)} title={testDateLabel}>
      {testDateShort}
    </span>
  )

  if (canEdit) {
    return (
      <button
        type="button"
        className={cn(
          cstAgeCellClass(saved, true),
          emphasized &&
            !saved &&
            'ring-2 ring-[color:var(--pour-accent-ring)] ring-offset-1 border-[color:var(--pour-accent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent-ring)] focus-visible:ring-offset-1',
        )}
        title={title}
        aria-label={saved ? `แก้ไขผล CST ${testDateLabel}` : `บันทึกผล CST ${testDateLabel}`}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        {dateEl}
      </button>
    )
  }

  return (
    <div
      className={cn(
        cstAgeCellClass(saved, false),
        emphasized && !saved && 'ring-2 ring-[color:var(--pour-accent-ring)] ring-offset-1 border-[color:var(--pour-accent)]',
      )}
      title={title}
    >
      {dateEl}
    </div>
  )
}

type CstAgeColumnsRowProps = {
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>
  savedAges: number[]
  canEdit: boolean
  onAgeClick: (age: CstTestAge) => void
  className?: string
}

/** แถวคอลัมน์อายุ CST (มือถือ) */
export function CstAgeColumnsRow({
  request,
  savedAges,
  canEdit,
  onAgeClick,
  className,
}: CstAgeColumnsRowProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-1.5', className)}>
      {CST_TEST_AGES.map((age) => (
        <CstAgeColumnCell
          key={age}
          age={age}
          testDateLabel={cstTestDateDisplay(request, age)}
          testDateShort={cstTestDateDisplayShort(request, age)}
          saved={savedAges.includes(age)}
          canEdit={canEdit}
          onClick={() => onAgeClick(age)}
        />
      ))}
    </div>
  )
}

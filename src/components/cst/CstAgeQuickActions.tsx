import { Button } from '@/components/ui/button'
import { rq } from '@/lib/requestUi'
import { CST_TEST_AGES, type CstTestAge } from '@/types/app.types'
import { cn } from '@/lib/utils'

type CstAgeQuickActionsProps = {
  savedAges: number[]
  onAgeClick: (age: CstTestAge) => void
  disabled?: boolean
  compact?: boolean
  /** แถวตาราง CST — ปุ่มเล็กลง */
  dense?: boolean
  /** มือถือ — 5 คอลัมน์เท่ากัน */
  grid?: boolean
  /** เน้นปุ่มที่ครบกำหนดวันนี้ */
  emphasizeAges?: CstTestAge[]
  className?: string
}

/** ปุ่ม +1 … +28 สำหรับบันทึก/แก้ไขผล CST */
export function CstAgeQuickActions({
  savedAges,
  onAgeClick,
  disabled,
  compact,
  dense,
  grid,
  emphasizeAges,
  className,
}: CstAgeQuickActionsProps) {
  return (
    <div
      className={cn(
        grid ? 'grid grid-cols-5 gap-1.5' : compact ? 'flex flex-wrap gap-0.5' : rq.actions.buttonRow,
        className,
      )}
    >
      {CST_TEST_AGES.map((d) => {
        const saved = savedAges.includes(d)
        const emphasize = emphasizeAges?.includes(d) && !saved
        return (
          <Button
            key={d}
            type="button"
            size={compact || grid ? 'sm' : 'action'}
            variant={saved ? 'default' : 'outline'}
            className={cn(
              'tabular-nums font-semibold',
              dense && 'h-6 min-h-6 px-1.5 text-[11px]',
              grid && 'h-9 min-h-9 w-full justify-center px-0 text-xs',
              emphasize &&
                'border-[color:var(--pour-accent)] bg-[var(--pour-accent-muted)] ring-2 ring-[color:var(--pour-accent-ring)] ring-offset-1',
            )}
            disabled={disabled}
            title={saved ? `แก้ไขผล CST +${d} วัน` : `บันทึกผล CST +${d} วัน`}
            aria-label={saved ? `แก้ไข CST +${d} วัน (มีข้อมูลแล้ว)` : `บันทึก CST +${d} วัน`}
            onClick={() => onAgeClick(d)}
          >
            +{d}
          </Button>
        )
      })}
    </div>
  )
}

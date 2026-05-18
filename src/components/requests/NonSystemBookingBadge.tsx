import { cn } from '@/lib/utils'

const badgeClass = cn(
  'inline-flex shrink-0 items-center rounded-md border border-amber-200/80 bg-amber-50/90',
  'px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-amber-900',
  'pour-desktop:text-[11px]',
)

export function NonSystemBookingBadge({ className }: { className?: string }) {
  return (
    <span className={cn(badgeClass, className)} title="รายการนี้ไม่ได้จองผ่าน workflow ในระบบ">
      ไม่ได้จองผ่านระบบ
    </span>
  )
}

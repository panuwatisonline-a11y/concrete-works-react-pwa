import { Button } from '@/components/ui/button'

interface ResizableTableToolbarProps {
  onReset: () => void
  className?: string
}

/** รีเซ็ตความกว้างคอลัมน์ที่บันทึกไว้ */
export function ResizableTableToolbar({ onReset, className }: ResizableTableToolbarProps) {
  return (
    <div className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-pour-xs text-pour-muted hover:text-[color:var(--pour-ink-1)]"
        onClick={onReset}
      >
        รีเซ็ตความกว้างคอลัมน์
      </Button>
    </div>
  )
}

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { icon, ICON_STROKE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] px-3 py-2.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {isDark ? (
          <Moon className={cn(icon.sm, 'shrink-0 text-[color:var(--pour-accent)]')} strokeWidth={ICON_STROKE} aria-hidden />
        ) : (
          <Sun className={cn(icon.sm, 'shrink-0 text-[color:var(--pour-accent)]')} strokeWidth={ICON_STROKE} aria-hidden />
        )}
        <div className="min-w-0">
          <p className={cn('truncate', type.bodyStrong)}>{isDark ? 'โหมดมืด' : 'โหมดสว่าง'}</p>
          <p className={cn('truncate', type.caption)}>{isDark ? 'ธีมสีเข้ม' : 'ธีมสีอ่อน'}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        onClick={toggleTheme}
        className={cn(
          'pour-interactive relative h-7 w-12 shrink-0 rounded-full border transition-colors',
          isDark
            ? 'border-[color:var(--pour-accent-ring)] bg-[color:var(--pour-accent-muted)]'
            : 'border-[color:var(--glass-border)] bg-[color:var(--glass-bg-strong)]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform',
            isDark ? 'translate-x-5' : 'translate-x-0',
          )}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-[color:var(--pour-accent)]" strokeWidth={2.25} />
          ) : (
            <Sun className="h-3 w-3 text-[color:var(--pour-accent)]" strokeWidth={2.25} />
          )}
        </span>
      </button>
    </div>
  )
}

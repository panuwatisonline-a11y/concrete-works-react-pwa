import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Logout from '@mui/icons-material/Logout'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { AppVersionLabel } from '@/components/layout/AppVersionLabel'
import type { Profile } from '@/types/app.types'
import { type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

type SidebarAccountFooterProps = {
  displayName: string
  subtitle: string
  profile: Profile | null
  avatarUrl?: string
  onLogout: () => void | Promise<void>
  /** ยุบไว้ตอนเปิด drawer — แตะแถวชื่อเพื่อขยาย */
  defaultOpen?: boolean
  showProfileLink?: boolean
  padding?: 'normal' | 'tight'
}

export function SidebarAccountFooter({
  displayName,
  subtitle,
  profile,
  avatarUrl,
  onLogout,
  defaultOpen = false,
  showProfileLink = false,
  padding = 'normal',
}: SidebarAccountFooterProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = 'sidebar-account-footer-panel'

  return (
    <div
      className={cn(
        'shrink-0 border-t border-[color:var(--pour-line)]',
        padding === 'tight' ? 'p-1.5' : 'p-3',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'pour-interactive flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors',
          'hover:bg-[color:var(--pour-nav-hover-bg)]',
        )}
      >
        <UserAvatar
          profile={profile}
          avatarUrl={avatarUrl}
          size="sm"
          className="shrink-0 ring-1 ring-[color:var(--glass-border-subtle)]"
        />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate', type.bodyStrong)}>{displayName}</p>
          {!open ? <p className={cn('truncate', type.caption)}>{subtitle}</p> : null}
        </div>
        {!open ? <AppVersionLabel className="mt-0 shrink-0 text-pour-2xs opacity-80" /> : null}
        <AppIcon
          icon={ExpandMore}
          size="sm"
          className={cn('shrink-0 text-[color:var(--pour-ink-3)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div id={panelId} className="mt-2 space-y-2">
          <ThemeToggle compact />
          {showProfileLink ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg border border-[color:var(--pour-line)] bg-[color:var(--pour-bg-2)] px-2.5 py-2 transition hover:bg-[color:var(--pour-nav-hover-bg)]"
            >
              <div className="min-w-0 flex-1">
                <p className={cn('truncate', type.caption)}>{subtitle}</p>
              </div>
              <AppIcon icon={ChevronRight} size="sm" className="shrink-0 text-[color:var(--pour-ink-3)]" />
            </Link>
          ) : (
            <p className={cn('truncate px-0.5', type.caption)}>{subtitle}</p>
          )}
          <Button
            variant="outline"
            className="h-9 w-full rounded-lg border-[color:var(--pour-line)] bg-transparent font-semibold text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-nav-hover-bg)]"
            onClick={() => void onLogout()}
          >
            <AppIcon icon={Logout} size="xs" className="mr-2" />
            ออกจากระบบ
          </Button>
          <AppVersionLabel className="mt-0 text-pour-2xs" />
        </div>
      ) : null}
    </div>
  )
}

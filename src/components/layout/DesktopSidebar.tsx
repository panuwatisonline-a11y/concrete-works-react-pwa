import { type ElementType } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, Code2, GitBranch, Briefcase,
  ChevronRight, Activity, Star, Files,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { theme, BRAND_TAGLINE, icon, ICON_STROKE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { isNavToActive } from '@/lib/navActive'

interface NavItem {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const mainLinks: NavItem[] = [
  { to: APP_HOME, label: 'สถานะ', icon: Activity, end: true },
  { to: '/requests/new', label: 'จองคอนกรีต', icon: PlusCircle },
  { to: '/preview/forms', label: 'ตัวอย่างแบบฟอร์ม', icon: Files },
  { to: '/profile', label: 'โปรไฟล์', icon: User },
]

const REQUESTS_MINE = '/requests?view=latest&scope=mine' as const

const [homeMainLink, ...restMainLinks] = mainLinks

const adminMenuLinks: NavItem[] = [
  { to: '/admin/users', label: 'Users Settings', icon: Users },
  { to: '/admin/client', label: 'Client', icon: Building2 },
  { to: '/admin/location', label: 'Location', icon: MapPin },
  { to: '/admin/concrete-works', label: 'Works', icon: HardHat },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mixed Code', icon: FlaskConical },
  { to: '/admin/abc-code', label: 'ABC', icon: Code2 },
  { to: '/admin/wbs-code', label: 'WBS', icon: GitBranch },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
]

function sidebarNavClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-full px-4 py-2.5 transition-colors duration-200',
    type.nav,
    active ? theme.navPillActive : theme.navPillInactive,
  )
}

export function DesktopSidebar() {
  const { profile, role, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const resetFilter = useFilterStore((s) => s.resetFilter)
  const HomeNavIcon = homeMainLink.icon

  const displayName = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || 'ผู้ใช้'
  const subtitle = user?.email ?? profile?.role ?? '—'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'relative hidden h-full min-h-0 w-[288px] shrink-0 flex-col',
        theme.sidebarSurface,
        'md:flex',
      )}
    >
      <NavLink
        to={APP_HOME}
        className={() =>
          cn(
            'flex items-center gap-3 border-b border-[color:var(--glass-border-subtle)] px-6 pb-5 pt-7 outline-none transition-colors',
            'hover:bg-[rgba(17,24,39,0.04)] focus-visible:bg-[rgba(17,24,39,0.04)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9ca3af]/40',
            isNavToActive(APP_HOME, location) ? 'bg-[var(--pour-accent-muted)]' : null,
          )
        }
        aria-label="Concrete Works — ไปหน้าสถานะหลัก"
      >
        <img
          src="/pwa-192x192.png"
          alt="Concrete Works logo"
          className="h-11 w-11 shrink-0 rounded-2xl object-contain"
          aria-hidden
        />
        <span className="min-w-0">
          <span className={cn('block truncate leading-tight', type.bodyStrong, theme.brandWordmark)}>
            Concrete Works
          </span>
          <span className={cn('mt-0.5 block', type.tagline)}>{BRAND_TAGLINE}</span>
        </span>
      </NavLink>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <p className={cn(theme.navSectionLabel, 'mb-3 px-3 tracking-[0.15em]')}>MENU</p>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
          <NavLink
            key={homeMainLink.to}
            to={homeMainLink.to}
            end={homeMainLink.end}
            className={() => sidebarNavClass(isNavToActive(homeMainLink.to, location))}
          >
            <HomeNavIcon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
            {homeMainLink.label}
          </NavLink>
          <NavLink
            to={REQUESTS_MINE}
            onClick={() => resetFilter()}
            className={() => sidebarNavClass(isNavToActive(REQUESTS_MINE, location))}
          >
            <Star
              className={cn(icon.sm, 'text-amber-500 opacity-95')}
              strokeWidth={ICON_STROKE}
              fill="currentColor"
              aria-hidden
            />
            รายการของฉัน
          </NavLink>
          {role === 'admin' ? (
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => sidebarNavClass(isActive)}
            >
              <LayoutDashboard className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
              Dashboard
            </NavLink>
          ) : null}
          {restMainLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={() => sidebarNavClass(isNavToActive(to, location))}
            >
              <Icon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
              {label}
            </NavLink>
          ))}
        </nav>

        {role === 'admin' && (
          <>
            <p className={cn(theme.navSectionLabel, 'mb-3 mt-8 px-3 tracking-[0.15em]')}>Admin</p>
            <nav aria-label="เมนูผู้ดูแล" className="flex flex-col gap-1">
              {adminMenuLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => sidebarNavClass(isActive)}>
                  <Icon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="border-t border-[color:var(--glass-border-subtle)] p-5">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[rgba(17,24,39,0.03)] p-3 backdrop-blur-md">
          <UserAvatar profile={profile} avatarUrl={user?.user_metadata?.avatar_url as string | undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <p className={cn('truncate', type.bodyStrong)}>{displayName}</p>
            <p className={cn('truncate', type.caption)}>{subtitle}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#9ca3af] transition hover:bg-[rgba(17,24,39,0.05)] hover:text-[#374151]"
            title="โปรไฟล์"
            aria-label="ไปที่โปรไฟล์"
          >
            <ChevronRight className={icon.sm} strokeWidth={ICON_STROKE} aria-hidden />
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-2xl border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] font-semibold text-[#374151] shadow-sm backdrop-blur-sm hover:bg-[var(--glass-bg-strong)]"
          onClick={handleLogout}
        >
          <LogOut className={cn(icon.xs, 'mr-2')} strokeWidth={ICON_STROKE} />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  )
}

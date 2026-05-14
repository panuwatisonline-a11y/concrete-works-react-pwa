import { type ElementType } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, Code2, GitBranch, Briefcase,
  Search, ChevronRight, Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { theme, BRAND_TAGLINE } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { isNavToActive } from '@/lib/navActive'

interface NavItem {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const mainLinks: NavItem[] = [
  { to: '/requests?view=summary', label: 'สถานะ', icon: Activity, end: true },
  { to: '/requests/new', label: 'จองคอนกรีต', icon: PlusCircle },
  { to: '/profile', label: 'โปรไฟล์', icon: User },
]

const adminLinks: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users Settings', icon: Users },
  { to: '/admin/client', label: 'Client', icon: Building2 },
  { to: '/admin/location', label: 'Location', icon: MapPin },
  { to: '/admin/concrete-works', label: 'Works', icon: HardHat },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mix', icon: FlaskConical },
  { to: '/admin/abc-code', label: 'ABC', icon: Code2 },
  { to: '/admin/wbs-code', label: 'WBS', icon: GitBranch },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
]

function sidebarNavClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
    active ? theme.navPillActive : theme.navPillInactive,
  )
}

export function DesktopSidebar() {
  const { profile, role, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const setRequestFiltersOpen = useFilterStore((s) => s.setRequestFiltersOpen)

  const displayName = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || 'ผู้ใช้'
  const subtitle = user?.email ?? profile?.role ?? '—'

  function goToSearch() {
    navigate('/requests?view=latest')
    setRequestFiltersOpen(true)
  }

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
      <div className="border-b border-[#e2e6ec]/90 px-6 pb-5 pt-7">
        <Link to="/requests?view=latest" className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              theme.iconTileBrand,
            )}
          >
            <Briefcase className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className={cn('block truncate text-sm leading-tight', theme.brandWordmark)}>
              Concrete Works
            </span>
            <span className="mt-0.5 block text-[10px] font-medium leading-snug tracking-wide text-[#9ca3af] md:text-[11px]">
              {BRAND_TAGLINE}
            </span>
          </span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">เมนู</p>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-1">
          {mainLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={() => sidebarNavClass(isNavToActive(to, location))}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', 'opacity-95')} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={goToSearch}
            className={cn(sidebarNavClass(false), 'w-full text-left')}
          >
            <Search className="h-[18px] w-[18px] shrink-0 opacity-95" strokeWidth={1.75} />
            ค้นหา / ตัวกรอง
          </button>
        </nav>

        {role === 'admin' && (
          <>
            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Admin</p>
            <nav aria-label="เมนูผู้ดูแล" className="flex flex-col gap-1">
              {adminLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => sidebarNavClass(isActive)}>
                  <Icon className="h-[18px] w-[18px] shrink-0 opacity-95" strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className="border-t border-[#e2e6ec]/80 p-5">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#e2e6ec]/60 bg-gradient-to-br from-[#f0f2f5]/90 to-white p-3 shadow-inner shadow-[#e2e6ec]/40">
          <UserAvatar profile={profile} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#111827]">{displayName}</p>
            <p className="truncate text-xs text-[#6b7280]">{subtitle}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#374151]"
            title="โปรไฟล์"
            aria-label="ไปที่โปรไฟล์"
          >
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-2xl border-[#e2e6ec] bg-white font-semibold text-[#374151] shadow-sm hover:bg-[#f5f6f8]"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  )
}

import { type ElementType, useCallback, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, TestTube2, Code2, GitBranch, Briefcase, Gauge,
  ChevronLeft, ChevronRight, Activity, Star, Files,
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

const cstConsoleLink: NavItem = { to: '/cst', label: 'CST', icon: FlaskConical }

const adminMenuLinks: NavItem[] = [
  { to: '/admin/users', label: 'Users Settings', icon: Users },
  { to: '/admin/client', label: 'Client', icon: Building2 },
  { to: '/admin/location', label: 'Location', icon: MapPin },
  { to: '/admin/concrete-works', label: 'Works', icon: HardHat },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mixed Code', icon: TestTube2 },
  { to: '/admin/abc-code', label: 'ABC', icon: Code2 },
  { to: '/admin/wbs-code', label: 'WBS', icon: GitBranch },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/cst-machine', label: 'CST Machine', icon: Gauge },
]

function adminConsoleLinks(role: string | null | undefined): NavItem[] {
  if (role === 'admin') return [cstConsoleLink, ...adminMenuLinks]
  if (role === 'manager') return [cstConsoleLink]
  return []
}

const SIDEBAR_COLLAPSED_KEY = 'cw-desktop-sidebar-collapsed'

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Expanded — flat rows like mobile drawer (no bordered pill per item) */
function expandedNavClass(active: boolean) {
  return cn(
    theme.navLink,
    'rounded-xl py-2.5',
    active
      ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
      : 'text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-accent-muted)]',
  )
}

function collapsedNavClass(active: boolean) {
  return cn(
    'flex w-full min-h-9 items-center justify-start rounded-lg py-1.5 pl-1.5 pr-1 text-left transition-colors duration-200',
    type.navCompact,
    active
      ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
      : 'text-[color:var(--pour-ink-1)] hover:bg-[rgba(17,24,39,0.06)] hover:text-[color:var(--pour-ink-0)]',
  )
}

function isAdminLinkActive(to: string, location: ReturnType<typeof useLocation>) {
  if (to === '/cst') return location.pathname.startsWith('/cst')
  return isNavToActive(to, location)
}

interface CollapsedTextNavProps {
  to: string
  label: string
  end?: boolean
  active: boolean
  onClick?: () => void
}

function CollapsedTextNav({ to, label, end, active, onClick }: CollapsedTextNavProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={() => collapsedNavClass(active)}
    >
      <span className="line-clamp-2 w-full break-words text-left text-[11px] leading-snug">{label}</span>
    </NavLink>
  )
}

export function DesktopSidebar() {
  const { profile, role, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const resetFilter = useFilterStore((s) => s.resetFilter)
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)

  const displayName = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || 'ผู้ใช้'
  const subtitle = user?.email ?? profile?.role ?? '—'
  const adminLinks = adminConsoleLinks(role)
  const HomeNavIcon = homeMainLink.icon

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (collapsed) {
    const mainNavItems: CollapsedTextNavProps[] = [
      {
        to: homeMainLink.to,
        label: homeMainLink.label,
        end: homeMainLink.end,
        active: isNavToActive(homeMainLink.to, location),
      },
      {
        to: REQUESTS_MINE,
        label: 'รายการของฉัน',
        active: isNavToActive(REQUESTS_MINE, location),
        onClick: () => resetFilter(),
      },
      ...(role === 'admin'
        ? [{
            to: '/admin',
            label: 'Dashboard',
            end: true,
            active: location.pathname === '/admin',
          }]
        : []),
      ...restMainLinks.map((item) => ({
        to: item.to,
        label: item.label,
        end: item.end,
        active: isNavToActive(item.to, location),
      })),
    ]

    const adminNavItems: CollapsedTextNavProps[] = adminLinks.map((item) => ({
      to: item.to,
      label: item.label,
      end: item.end,
      active: isAdminLinkActive(item.to, location),
    }))

    return (
      <aside
        data-sidebar-mode="collapsed"
        className={cn(
          'relative hidden h-full min-h-0 w-36 shrink-0 flex-col transition-[width] duration-300 ease-in-out',
          theme.sidebarSurface,
          'md:flex',
        )}
      >
        <div className="relative shrink-0 border-b border-[color:var(--glass-border-subtle)] px-1.5 pb-2.5 pt-3">
          <NavLink
            to={APP_HOME}
            title="Concrete Works"
            aria-label="Concrete Works — ไปหน้าสถานะหลัก"
            className={() =>
              cn(
                'flex w-full flex-col items-start gap-0.5 rounded-lg px-1.5 py-1 outline-none transition-colors',
                isNavToActive(APP_HOME, location)
                  ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                  : 'text-[color:var(--pour-ink-1)] hover:bg-[rgba(17,24,39,0.05)]',
              )
            }
          >
            <img
              src="/pwa-192x192.png"
              alt=""
              className="h-6 w-6 rounded-md object-contain"
              aria-hidden
            />
            <span className="text-[10px] font-bold leading-tight">หน้าหลัก</span>
          </NavLink>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute -right-2.5 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--glass-border-subtle)] bg-white text-[color:var(--pour-ink-3)] shadow-sm transition hover:border-[color:var(--glass-edge)] hover:text-[color:var(--pour-accent)]"
            aria-expanded={false}
            aria-label="ขยายเมนูด้านข้าง"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain py-2">
          <nav aria-label="เมนูหลัก" className="flex flex-col gap-0.5 px-1.5">
            {mainNavItems.map((item) => (
              <CollapsedTextNav key={item.to} {...item} />
            ))}
          </nav>

          {adminNavItems.length > 0 ? (
            <nav
              aria-label="เมนูผู้ดูแล"
              className="mt-2 flex flex-col gap-0.5 border-t border-[color:var(--glass-border-subtle)] px-1.5 pt-2"
            >
              {adminNavItems.map((item) => (
                <CollapsedTextNav key={item.to} {...item} />
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-0.5 border-t border-[color:var(--glass-border-subtle)] p-1.5 pb-2">
          <CollapsedTextNav
            to="/profile"
            label="โปรไฟล์"
            active={isNavToActive('/profile', location)}
          />
          <button
            type="button"
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className={collapsedNavClass(false)}
            onClick={handleLogout}
          >
            <span className="w-full text-left text-[11px] leading-snug">ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      data-sidebar-mode="expanded"
      className={cn(
        'relative hidden h-full min-h-0 w-[288px] shrink-0 flex-col transition-[width] duration-300 ease-in-out',
        theme.sidebarSurface,
        'md:flex',
      )}
    >
      <div className="relative border-b border-[color:var(--glass-border-subtle)]">
        <NavLink
          to={APP_HOME}
          className={() =>
            cn(
              'flex items-center gap-3 px-6 pb-5 pt-7 pr-14 outline-none transition-colors',
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
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-2.5 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--glass-border-subtle)] bg-white text-[color:var(--pour-ink-3)] shadow-sm transition hover:border-[color:var(--glass-edge)] hover:text-[color:var(--pour-accent)]"
          aria-expanded
          aria-label="ยุบเมนูด้านข้าง"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <p className={cn(theme.navSectionLabel, 'mb-3 px-3 tracking-[0.15em]')}>MENU</p>
        <nav aria-label="เมนูหลัก" className="flex flex-col gap-0.5">
          <NavLink
            key={homeMainLink.to}
            to={homeMainLink.to}
            end={homeMainLink.end}
            className={() => expandedNavClass(isNavToActive(homeMainLink.to, location))}
          >
            <HomeNavIcon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
            {homeMainLink.label}
          </NavLink>
          <NavLink
            to={REQUESTS_MINE}
            onClick={() => resetFilter()}
            className={() => expandedNavClass(isNavToActive(REQUESTS_MINE, location))}
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
            <NavLink to="/admin" end className={({ isActive }) => expandedNavClass(isActive)}>
              <LayoutDashboard className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
              Dashboard
            </NavLink>
          ) : null}
          {restMainLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={() => expandedNavClass(isNavToActive(to, location))}
            >
              <Icon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
              {label}
            </NavLink>
          ))}
        </nav>

        {adminLinks.length > 0 ? (
          <>
            <p className={cn(theme.navSectionLabel, 'mb-3 mt-8 px-3 tracking-[0.15em]')}>Admin</p>
            <nav aria-label="เมนูผู้ดูแล" className="flex flex-col gap-0.5">
              {adminLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={() => expandedNavClass(isAdminLinkActive(to, location))}
                >
                  <Icon className={cn(icon.sm, 'opacity-95')} strokeWidth={ICON_STROKE} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>
        ) : null}
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

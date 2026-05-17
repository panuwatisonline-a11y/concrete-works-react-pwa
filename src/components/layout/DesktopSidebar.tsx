import { type ElementType, type FocusEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, TestTube2, Code2, GitBranch, Briefcase, Gauge,
  ChevronLeft, ChevronRight, Activity, Star, Files, ClipboardList, Pin, PinOff, BarChart3,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { theme, BRAND_TAGLINE, icon, ICON_STROKE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { isNavToActive } from '@/lib/navActive'
import { CollapsibleNavSection } from '@/components/layout/CollapsibleNavSection'

interface NavItem {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const mainLinks: NavItem[] = [
  { to: APP_HOME, label: 'สถานะ', icon: Activity, end: true },
  { to: '/requests/new', label: 'จองคอนกรีต', icon: PlusCircle },
  { to: '/requests/booking-summary', label: 'สรุปรายการจอง', icon: ClipboardList },
  { to: '/preview/forms', label: 'ตัวอย่างแบบฟอร์ม', icon: Files },
  { to: '/profile', label: 'โปรไฟล์', icon: User },
]

const REQUESTS_MINE = '/requests?view=latest&scope=mine' as const

const [homeMainLink, ...restMainLinks] = mainLinks

const cstConsoleLinks: NavItem[] = [
  { to: '/cst', label: 'CST', icon: FlaskConical },
  { to: '/cst/concrete-summary', label: 'Concrete Summary', icon: BarChart3 },
]

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
  if (role === 'admin') return [...cstConsoleLinks, ...adminMenuLinks]
  if (role === 'manager') return [...cstConsoleLinks]
  return []
}

const SIDEBAR_COLLAPSED_KEY = 'cw-desktop-sidebar-collapsed'
const SIDEBAR_AUTOHIDE_KEY = 'cw-desktop-sidebar-autohide'
const SIDEBAR_LEAVE_DELAY_MS = 320

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function readSidebarAutoHide(): boolean {
  try {
    const v = localStorage.getItem(SIDEBAR_AUTOHIDE_KEY)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

function sidebarShellClass(collapsed: boolean, isPeek: boolean) {
  return cn(
    'relative hidden h-full min-h-0 shrink-0 flex-col transition-[width] duration-300 ease-in-out',
    theme.sidebarSurface,
    'pour-desktop:flex',
    isPeek ? 'w-3 overflow-hidden' : collapsed ? 'w-36' : 'w-[260px]',
  )
}

/** Expanded — flat rows like mobile drawer (no bordered pill per item) */
function expandedNavClass(active: boolean) {
  return cn(
    theme.navLink,
    active
      ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
      : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )
}

function collapsedNavClass(active: boolean) {
  return cn(
    'flex w-full min-h-9 items-center justify-start rounded-lg py-1.5 pl-1.5 pr-1 text-left transition-colors duration-200',
    type.navCompact,
    active
      ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
      : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )
}

function isAdminLinkActive(to: string, location: ReturnType<typeof useLocation>) {
  if (to === '/cst') return location.pathname === '/cst'
  if (to === '/cst/concrete-summary') return location.pathname.startsWith('/cst/concrete-summary')
  return isNavToActive(to, location)
}

interface CollapsedTextNavProps {
  to: string
  label: string
  end?: boolean
  active: boolean
  onClick?: () => void
}

const sidebarEdgeBtnClass =
  'flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-[color:var(--pour-ink-3)] shadow-sm transition hover:border-[color:var(--glass-edge)] hover:text-[color:var(--pour-ink-0)]'

function SidebarHeaderControls({
  autoHide,
  onToggleAutoHide,
  collapseExpanded,
  onToggleCollapse,
  className,
}: {
  autoHide: boolean
  onToggleAutoHide: () => void
  collapseExpanded: boolean
  onToggleCollapse: () => void
  className?: string
}) {
  return (
    <div
      className={cn('absolute z-20 flex flex-col gap-1.5', className)}
      role="group"
      aria-label="ควบคุมเมนูด้านข้าง"
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className={sidebarEdgeBtnClass}
        aria-expanded={collapseExpanded}
        aria-label={collapseExpanded ? 'ยุบเมนูด้านข้าง' : 'ขยายเมนูด้านข้าง'}
      >
        {collapseExpanded ? (
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={onToggleAutoHide}
        className={sidebarEdgeBtnClass}
        aria-pressed={!autoHide}
        aria-label={autoHide ? 'ปักหมุดเมนู — ไม่ซ่อนอัตโนมัติ' : 'เปิดซ่อนเมนูอัตโนมัติ'}
        title={autoHide ? 'ปักหมุดเมนู' : 'ซ่อนเมนูอัตโนมัติ'}
      >
        {autoHide ? (
          <PinOff className="h-3 w-3" strokeWidth={ICON_STROKE} aria-hidden />
        ) : (
          <Pin className="h-3 w-3" strokeWidth={ICON_STROKE} aria-hidden />
        )}
      </button>
    </div>
  )
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
  const [autoHide, setAutoHide] = useState(readSidebarAutoHide)
  const [hovered, setHovered] = useState(false)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayName = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || 'ผู้ใช้'
  const subtitle = user?.email ?? profile?.role ?? '—'
  const adminLinks = adminConsoleLinks(role)
  const HomeNavIcon = homeMainLink.icon
  const adminSectionActive =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/cst')

  const isPeek = autoHide && !hovered

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const handleSidebarEnter = useCallback(() => {
    clearLeaveTimer()
    setHovered(true)
  }, [clearLeaveTimer])

  const handleSidebarLeave = useCallback(() => {
    if (!autoHide) return
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(() => {
      setHovered(false)
      leaveTimerRef.current = null
    }, SIDEBAR_LEAVE_DELAY_MS)
  }, [autoHide, clearLeaveTimer])

  const handleSidebarBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (!autoHide) return
      const next = e.relatedTarget
      if (next && e.currentTarget.contains(next as Node)) return
      handleSidebarLeave()
    },
    [autoHide, handleSidebarLeave],
  )

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer])

  const sidebarInteraction = {
    onMouseEnter: handleSidebarEnter,
    onMouseLeave: handleSidebarLeave,
    onFocusCapture: () => {
      if (autoHide) setHovered(true)
    },
    onBlurCapture: handleSidebarBlur,
  }

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

  const toggleAutoHide = useCallback(() => {
    setAutoHide((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_AUTOHIDE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      if (!next) {
        clearLeaveTimer()
        setHovered(true)
      }
      return next
    })
  }, [clearLeaveTimer])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (isPeek) {
    return (
      <aside
        {...sidebarInteraction}
        data-sidebar-mode="peek"
        className={sidebarShellClass(collapsed, true)}
        aria-label="เมนูหลัก — วางเมาส์เพื่อแสดง"
      >
        <div
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center border-r border-[color:var(--pour-line)] bg-[color:var(--pour-sidebar)]"
          title="แสดงเมนู"
        >
          <ChevronRight className="h-4 w-4 text-[color:var(--pour-ink-3)]" strokeWidth={ICON_STROKE} aria-hidden />
        </div>
      </aside>
    )
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
        {...sidebarInteraction}
        data-sidebar-mode="collapsed"
        className={sidebarShellClass(true, false)}
      >
        <div className="relative shrink-0 border-b border-[color:var(--glass-border-subtle)] p-2.5 pr-9">
          <NavLink
            to={APP_HOME}
            title="Concrete Works"
            aria-label="Concrete Works — ไปหน้าสถานะหลัก"
            className={() =>
              cn(
                theme.sidebarBrandPanel,
                'flex w-full flex-col items-start gap-1 p-2.5 pr-1',
                isNavToActive(APP_HOME, location) && theme.sidebarBrandPanelActive,
              )
            }
          >
            <span className={cn(theme.sidebarBrandLogoWrap, 'h-10 w-10')} aria-hidden>
              <img src="/pwa-512x512.png" alt="" className={theme.sidebarBrandLogo} />
            </span>
            <span className="text-[10px] font-bold leading-tight text-[color:var(--pour-ink-0)]">หน้าหลัก</span>
          </NavLink>
          <SidebarHeaderControls
            autoHide={autoHide}
            onToggleAutoHide={toggleAutoHide}
            collapseExpanded={false}
            onToggleCollapse={toggleCollapsed}
            className="-right-2.5 top-5"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain py-2.5">
          <nav aria-label="เมนูหลัก" className="flex flex-col gap-1 px-2.5">
            {mainNavItems.map((item) => (
              <CollapsedTextNav key={item.to} {...item} />
            ))}
          </nav>

          {adminNavItems.length > 0 ? (
            <nav
              aria-label="เมนูผู้ดูแล"
              className="mt-2 flex flex-col gap-1 border-t border-[color:var(--glass-border-subtle)] px-2.5 pt-2.5"
            >
              {adminNavItems.map((item) => (
                <CollapsedTextNav key={item.to} {...item} />
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1 border-t border-[color:var(--glass-border-subtle)] px-2.5 py-2.5 pb-3">
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
      {...sidebarInteraction}
      data-sidebar-mode="expanded"
      className={sidebarShellClass(false, false)}
    >
      <div className="relative border-b border-[color:var(--glass-border-subtle)] p-3 pr-9">
        <NavLink
          to={APP_HOME}
          className={() =>
            cn(
              theme.sidebarBrandPanel,
              'flex items-center gap-3 p-4 pr-2',
              isNavToActive(APP_HOME, location) && theme.sidebarBrandPanelActive,
            )
          }
          aria-label="Concrete Works — ไปหน้าสถานะหลัก"
        >
          <span className={cn(theme.sidebarBrandLogoWrap, 'h-[3.25rem] w-[3.25rem]')}>
            <img
              src="/pwa-512x512.png"
              alt=""
              className={theme.sidebarBrandLogo}
              aria-hidden
            />
          </span>
          <span className="min-w-0">
            <span className={theme.sidebarBrandTitle}>Concrete Works</span>
            <span className={theme.sidebarBrandTagline}>{BRAND_TAGLINE}</span>
          </span>
        </NavLink>
        <SidebarHeaderControls
          autoHide={autoHide}
          onToggleAutoHide={toggleAutoHide}
          collapseExpanded
          onToggleCollapse={toggleCollapsed}
          className="-right-2.5 top-7"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <CollapsibleNavSection
          title="MENU"
          defaultOpen={!adminSectionActive}
          headerClassName="px-3 tracking-[0.15em]"
          panelClassName="pb-1"
        >
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
        </CollapsibleNavSection>

        {adminLinks.length > 0 ? (
          <CollapsibleNavSection
            title="ADMIN"
            defaultOpen={adminSectionActive}
            headerClassName="px-3 tracking-[0.15em]"
            panelClassName="pb-1"
          >
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
          </CollapsibleNavSection>
        ) : null}
      </div>

      <div className="border-t border-[color:var(--pour-line)] p-4">
        <ThemeToggle className="mb-3" />
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-[color:var(--pour-bg-2)] p-3">
          <UserAvatar profile={profile} avatarUrl={user?.user_metadata?.avatar_url as string | undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <p className={cn('truncate', type.bodyStrong)}>{displayName}</p>
            <p className={cn('truncate', type.caption)}>{subtitle}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[color:var(--pour-ink-3)] transition hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]"
            title="โปรไฟล์"
            aria-label="ไปที่โปรไฟล์"
          >
            <ChevronRight className={icon.sm} strokeWidth={ICON_STROKE} aria-hidden />
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-lg border-[color:var(--pour-line)] bg-transparent font-semibold text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]"
          onClick={handleLogout}
        >
          <LogOut className={cn(icon.xs, 'mr-2')} strokeWidth={ICON_STROKE} />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  )
}

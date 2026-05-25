import {
  type FocusEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import type { SvgIconComponent } from '@mui/icons-material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import Dashboard from '@mui/icons-material/Dashboard'
import Star from '@mui/icons-material/Star'
import PushPin from '@mui/icons-material/PushPin'
import PushPinOutlined from '@mui/icons-material/PushPinOutlined'
import { AppIcon } from '@/components/icons/AppIcon'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { SidebarAccountFooter } from '@/components/layout/SidebarAccountFooter'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { APP_HOME } from '@/lib/appHome'
import { theme, BRAND_TAGLINE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { adminConsoleLinks } from '@/lib/adminNav'
import { mainNavLinks } from '@/lib/mainNav'
import { canManageUsers } from '@/lib/permissions'
import { isNavToActive } from '@/lib/navActive'
import { CollapsibleNavSection } from '@/components/layout/CollapsibleNavSection'
import { AppVersionLabel } from '@/components/layout/AppVersionLabel'
import { pourPcUi, usePourPcScale } from '@/lib/pourPcScale'

interface NavItem {
  to: string
  label: string
  icon: SvgIconComponent
  end?: boolean
}

const REQUESTS_MINE = '/requests?view=latest&scope=mine' as const

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

function sidebarWidthPx(collapsed: boolean, isPeek: boolean, pxW: (n: number) => number): number {
  if (isPeek) return Math.round(pxW(12))
  return Math.round(collapsed ? pxW(144) : pxW(260))
}

function SidebarShell({
  width,
  mode,
  interaction,
  children,
}: {
  width: number
  mode: string
  interaction: Record<string, unknown>
  children: ReactNode
}) {
  return (
    <Drawer
      variant="permanent"
      className="relative hidden h-full min-h-0 shrink-0 pour-desktop:flex"
      sx={{
        width,
        flexShrink: 0,
        transition: 'width 300ms ease-in-out',
        '& .MuiDrawer-paper': {
          width,
          position: 'relative',
          overflow: 'visible',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'width 300ms ease-in-out',
        },
      }}
      open
    >
      <Box
        {...interaction}
        data-sidebar-mode={mode}
        sx={{ display: 'flex', height: '100%', minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}
      >
        {children}
      </Box>
    </Drawer>
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
    'pour-interactive pour-nav-item flex w-full min-h-9 items-center justify-start rounded-lg py-1.5 pl-1.5 pr-1 text-left transition-colors duration-200',
    type.navCompact,
    active
      ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
      : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )
}

function isAdminLinkActive(to: string, location: ReturnType<typeof useLocation>) {
  if (to === '/cst') return location.pathname === '/cst'
  if (to === '/cst/concrete-summary') return location.pathname.startsWith('/cst/concrete-summary')
  if (to === '/admin/loss-concrete') return location.pathname.startsWith('/admin/loss-concrete')
  return isNavToActive(to, location)
}

interface CollapsedTextNavProps {
  to: string
  label: string
  end?: boolean
  active: boolean
  onClick?: () => void
}

function SidebarHeaderControls({
  autoHide,
  onToggleAutoHide,
  collapseExpanded,
  onToggleCollapse,
}: {
  autoHide: boolean
  onToggleAutoHide: () => void
  collapseExpanded: boolean
  onToggleCollapse: () => void
}) {
  const collapseLabel = collapseExpanded ? 'ยุบเมนูด้านข้าง' : 'ขยายเมนูด้านข้าง'
  const pinLabel = autoHide ? 'ปักหมุดเมนู — ไม่ซ่อนอัตโนมัติ' : 'ซ่อนเมนูอัตโนมัติ'

  return (
    <Box
      role="group"
      aria-label="ควบคุมเมนูด้านข้าง"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        flexShrink: 0,
        zIndex: 2,
      }}
    >
      <Tooltip title={collapseLabel} placement="right">
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          aria-expanded={collapseExpanded}
          aria-label={collapseLabel}
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <AppIcon icon={collapseExpanded ? ChevronLeft : ChevronRight} size="xs" sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={autoHide ? 'ปักหมุดเมนู' : 'ซ่อนเมนูอัตโนมัติ'} placement="right">
        <IconButton
          size="small"
          onClick={onToggleAutoHide}
          aria-pressed={!autoHide}
          aria-label={pinLabel}
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: autoHide ? 'action.selected' : 'background.paper',
            boxShadow: 1,
          }}
        >
          <AppIcon icon={autoHide ? PushPinOutlined : PushPin} size="xs" sx={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
    </Box>
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
      <span className="line-clamp-2 w-full break-words text-left text-pour-xs leading-snug">{label}</span>
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
  const mainLinks = mainNavLinks(role)
  const homeMainLink = mainLinks[0]!
  const restMainLinks = mainLinks.slice(1)
  const adminLinks = adminConsoleLinks(role)
  const HomeNavIcon = homeMainLink.icon
  const adminSectionActive =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/cst')

  const isPeek = autoHide && !hovered
  const pc = usePourPcScale()
  const peekWidth = sidebarWidthPx(collapsed, true, pc.pxW)
  const collapsedWidth = sidebarWidthPx(true, false, pc.pxW)
  const expandedWidth = sidebarWidthPx(false, false, pc.pxW)

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
      <SidebarShell width={peekWidth} interaction={sidebarInteraction} mode="peek">
        <Box
          aria-label="เมนูหลัก — วางเมาส์เพื่อแสดง"
          title="แสดงเมนู"
          sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon icon={ChevronRight} size="sm" className="opacity-60" />
        </Box>
      </SidebarShell>
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
      ...(canManageUsers(role)
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
      <SidebarShell width={collapsedWidth} interaction={sidebarInteraction} mode="collapsed">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
            shrink: 0,
            borderBottom: 1,
            borderColor: 'divider',
            p: 1.25,
          }}
        >
          <NavLink
            to={APP_HOME}
            title="Concrete Works"
            aria-label="Concrete Works — ไปหน้าสถานะหลัก"
            className={() =>
              cn(
                theme.sidebarBrandPanel,
                'flex min-w-0 flex-1 flex-col items-start gap-1 p-1.5',
                isNavToActive(APP_HOME, location) && theme.sidebarBrandPanelActive,
              )
            }
          >
            <span className={cn(theme.sidebarBrandLogoWrap, 'h-10 w-10')} aria-hidden>
              <img src="/pwa-512x512.png" alt="" className={theme.sidebarBrandLogo} />
            </span>
            <span className="text-pour-2xs font-bold leading-tight text-[color:var(--pour-ink-0)]">หน้าหลัก</span>
          </NavLink>
          <SidebarHeaderControls
            autoHide={autoHide}
            onToggleAutoHide={toggleAutoHide}
            collapseExpanded={false}
            onToggleCollapse={toggleCollapsed}
          />
        </Box>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain py-2.5',
            pourPcUi.sidebarNav,
          )}
        >
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
            <span className="w-full text-left text-pour-xs leading-snug">ออกจากระบบ</span>
          </button>
          <AppVersionLabel className="mt-1.5 text-pour-2xs" />
        </div>
      </SidebarShell>
    )
  }

  return (
    <SidebarShell width={expandedWidth} interaction={sidebarInteraction} mode="expanded">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.75,
          borderBottom: 1,
          borderColor: 'divider',
          p: 1.5,
        }}
      >
        <NavLink
          to={APP_HOME}
          className={() =>
            cn(
              theme.sidebarBrandPanel,
              'flex min-w-0 flex-1 items-center gap-3 p-2.5',
              isNavToActive(APP_HOME, location) && theme.sidebarBrandPanelActive,
            )
          }
          aria-label="Concrete Works — ไปหน้าสถานะหลัก"
        >
          <span className={cn(theme.sidebarBrandLogoWrap, 'h-[3.25rem] w-[3.25rem] shrink-0')}>
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
        />
      </Box>

      <div
        className={cn(
          'min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5',
          pourPcUi.sidebarNav,
        )}
      >
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
              <AppIcon icon={HomeNavIcon} size="sm" className="opacity-95" />
              {homeMainLink.label}
            </NavLink>
            <NavLink
              to={REQUESTS_MINE}
              onClick={() => resetFilter()}
              className={() => expandedNavClass(isNavToActive(REQUESTS_MINE, location))}
            >
              <AppIcon icon={Star} size="sm" className="text-amber-500 opacity-95" sx={{ color: 'inherit' }} />
              รายการของฉัน
            </NavLink>
            {canManageUsers(role) ? (
              <NavLink to="/admin" end className={({ isActive }) => expandedNavClass(isActive)}>
                <AppIcon icon={Dashboard} size="sm" className="opacity-95" />
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
                <AppIcon icon={Icon} size="sm" className="opacity-95" />
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
                  <AppIcon icon={Icon} size="sm" className="opacity-95" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </CollapsibleNavSection>
        ) : null}
      </div>

      <SidebarAccountFooter
        displayName={displayName}
        subtitle={subtitle}
        profile={profile}
        avatarUrl={user?.user_metadata?.avatar_url as string | undefined}
        onLogout={handleLogout}
        showProfileLink
      />
    </SidebarShell>
  )
}

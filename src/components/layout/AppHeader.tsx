import { useLayoutEffect, useRef, useState, type ElementType } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, Code2, GitBranch, Briefcase, Gauge,
  Search, Star, Activity, Files, ClipboardList,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { APP_HOME } from '@/lib/appHome'
import { POUR_DESKTOP_MEDIA } from '@/lib/pourLayout'
import { theme, BRAND_TAGLINE, icon, ICON_STROKE, type, anim } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { isNavToActive } from '@/lib/navActive'
import { CollapsibleNavSection } from '@/components/layout/CollapsibleNavSection'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

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

const cstConsoleLink: NavItem = { to: '/cst', label: 'CST', icon: FlaskConical }

/** เมนูตั้งค่าใน drawer Admin (ไม่รวม Dashboard — แสดงแถบบนมือถือ + หมวดหลักใน drawer) */
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
  { to: '/admin/cst-machine', label: 'CST Machine', icon: Gauge },
]

function adminConsoleLinks(role: string | null | undefined): NavItem[] {
  if (role === 'admin') return [cstConsoleLink, ...adminMenuLinks]
  if (role === 'manager') return [cstConsoleLink]
  return []
}

/** แถบหน้าหลักบนมือถือ — แทน bottom tab */
function MobilePrimaryNav() {
  const location = useLocation()
  const { role } = useAuthStore()
  const resetFilter = useFilterStore((s) => s.resetFilter)
  const q = new URLSearchParams(location.search)
  const isMineTab = location.pathname === '/requests' && q.get('scope') === 'mine'
  const isStatusTab =
    location.pathname === '/requests' && q.get('view') === 'summary' && q.get('scope') !== 'mine'
  const isAdminArea = location.pathname.startsWith('/admin')
  const pill = (active: boolean) =>
    cn(
      'pour-interactive inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2',
      theme.navPillMobile,
      active ? theme.navPillActive : theme.navPillInactive,
    )

  return (
    <nav aria-label="เมนูหลัก" className={cn(theme.primaryNavStrip, 'pour-desktop:hidden')}>
      <div className={cn('mx-auto flex w-full min-w-0 max-w-none items-center gap-1.5 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', theme.primaryNavStripPad)}>
        <Link to="/requests?view=summary" className={pill(isStatusTab)} aria-current={isStatusTab ? 'page' : undefined}>
          <Activity className={icon.sm} strokeWidth={ICON_STROKE} aria-hidden />
          สถานะ
        </Link>
        <Link
          to="/requests?view=latest&scope=mine"
          className={pill(isMineTab)}
          aria-current={isMineTab ? 'page' : undefined}
          onClick={() => resetFilter()}
        >
          <Star className={cn(icon.sm, 'text-amber-500')} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />
          รายการของฉัน
        </Link>
        {role === 'admin' ? (
          <Link
            to="/admin"
            className={pill(isAdminArea)}
            aria-current={isAdminArea ? 'page' : undefined}
          >
            <LayoutDashboard className={icon.sm} strokeWidth={ICON_STROKE} aria-hidden />
            Dashboard
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

export function AppHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, role, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const setRequestFiltersOpen = useFilterStore((s) => s.setRequestFiltersOpen)

  const displayName = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || 'ผู้ใช้'
  const profileSubtitle = user?.email ?? profile?.role ?? '—'
  const adminSectionActive =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/cst')

  async function handleLogout() {
    await supabase.auth.signOut()
    setDrawerOpen(false)
    navigate('/login')
  }

  function goToSearch() {
    navigate('/requests?view=latest')
    setRequestFiltersOpen(true)
  }

  useLayoutEffect(() => {
    const root = document.documentElement
    const el = headerRef.current
    const clear = () => root.style.removeProperty('--pour-mobile-header-h')

    if (!el) {
      clear()
      return clear
    }

    const mq = window.matchMedia(POUR_DESKTOP_MEDIA)
    const sync = () => {
      if (mq.matches) {
        clear()
        return
      }
      root.style.setProperty('--pour-mobile-header-h', `${el.offsetHeight}px`)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    mq.addEventListener('change', sync)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', sync)
      clear()
    }
  }, [role])

  return (
    <>
      <header
        ref={headerRef}
        className={cn('sticky top-0 z-40 shrink-0 pour-desktop:hidden', theme.headerBar)}
      >
        {/* Mobile wireframe header: เมนู | ชื่อซ้าย | ค้นหา */}
        <div className={cn('mx-auto grid min-h-[48px] w-full min-w-0 max-w-none grid-cols-[2.5rem_1fr_2.5rem] items-center gap-x-1 gap-y-0 pour-desktop:hidden', theme.headerBarMobile)}>
          <button
            type="button"
            className={cn(
              'pour-interactive inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-start rounded-xl border border-transparent text-[color:var(--pour-ink-2)] hover:border-[color:var(--glass-border-subtle)] hover:bg-[color:var(--pour-accent-muted)] hover:text-[color:var(--pour-accent)]',
            )}
            onClick={() => setDrawerOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu className={icon.lg} strokeWidth={ICON_STROKE} />
          </button>
          <Link
            to={APP_HOME}
            className="min-w-0 justify-self-start px-0.5 text-left no-underline"
          >
            <span className={cn('block', type.bodyStrong, theme.brandWordmark)}>Concrete Works</span>
            <span className={cn('mt-0.5 block', type.tagline)}>{BRAND_TAGLINE}</span>
          </Link>
          <button
            type="button"
            onClick={goToSearch}
            className={cn('h-9 w-9 shrink-0 justify-self-end', theme.iconButtonChrome)}
            aria-label="ค้นหาและตัวกรอง"
          >
            <Search className={icon.sm} strokeWidth={ICON_STROKE} />
          </button>
        </div>

        {!location.pathname.startsWith('/requests') ? <MobilePrimaryNav /> : null}
      </header>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-[min(20rem,92vw)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border border-y-0 border-l-0 p-0 sm:max-w-none',
            theme.drawerPanel,
          )}
        >
          <DialogHeader className={cn('px-5 py-4 text-left', theme.drawerHeader)}>
            <DialogTitle className="sr-only">เมนู</DialogTitle>
            <div className="flex items-center justify-between gap-2">
              <Link
                to={APP_HOME}
                onClick={() => setDrawerOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-3 no-underline"
                aria-label="Concrete Works — ไปหน้าสถานะหลัก"
              >
                <span className={cn(theme.sidebarBrandLogoWrap, 'h-10 w-10')} aria-hidden>
                  <img src="/pwa-512x512.png" alt="" className={theme.sidebarBrandLogo} />
                </span>
                <span className="min-w-0">
                  <span className={cn('block', type.bodyStrong, theme.brandWordmark)}>Concrete Works</span>
                  <span className={cn('mt-0.5 block', type.tagline)}>{BRAND_TAGLINE}</span>
                </span>
              </Link>
              <button
                type="button"
                className="shrink-0 rounded-lg p-2 text-[color:var(--pour-ink-3)] hover:bg-[color:var(--pour-accent-muted)] hover:text-[color:var(--pour-accent)]"
                onClick={() => setDrawerOpen(false)}
                aria-label="ปิดเมนู"
              >
                <X className={icon.md} strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </DialogHeader>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
            <CollapsibleNavSection title="MENU" defaultOpen={!adminSectionActive} panelClassName="space-y-1 pb-1">
              {mainLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setDrawerOpen(false)}
                  className={() =>
                    cn(
                      theme.navLink,
                      isNavToActive(to, location)
                        ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                        : 'text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-accent-muted)]',
                    )
                  }
                >
                  <Icon className={icon.md} strokeWidth={ICON_STROKE} />
                  {label}
                </NavLink>
              ))}
              {role === 'admin' ? (
                <NavLink
                  to="/admin"
                  end
                  onClick={() => setDrawerOpen(false)}
                  className={() =>
                    cn(
                      theme.navLink,
                      isNavToActive('/admin', location)
                        ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                        : 'text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-accent-muted)]',
                    )
                  }
                >
                  <LayoutDashboard className={icon.md} strokeWidth={ICON_STROKE} />
                  Dashboard
                </NavLink>
              ) : null}
            </CollapsibleNavSection>

            {adminConsoleLinks(role).length > 0 ? (
              <CollapsibleNavSection title="ADMIN" className="pt-1" defaultOpen={adminSectionActive} panelClassName="space-y-1 pb-1">
                {adminConsoleLinks(role).map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setDrawerOpen(false)}
                      className={() =>
                        cn(
                          theme.navLink,
                          (to === '/cst'
                            ? location.pathname.startsWith('/cst')
                            : isNavToActive(to, location))
                            ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                            : 'text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-accent-muted)]',
                        )
                      }
                    >
                      <Icon className={icon.md} strokeWidth={ICON_STROKE} />
                      {label}
                    </NavLink>
                ))}
              </CollapsibleNavSection>
            ) : null}
          </nav>

          <div className="border-t border-[color:var(--glass-border-subtle)] p-4">
            <ThemeToggle className="mb-3" />
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] p-3 backdrop-blur-md">
              <UserAvatar
                profile={profile}
                avatarUrl={user?.user_metadata?.avatar_url as string | undefined}
                size="sm"
                className="shrink-0 ring-2 ring-[color:var(--glass-border-subtle)]"
              />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate', type.bodyStrong)}>{displayName}</p>
                <p className={cn('truncate', type.caption)}>{profileSubtitle}</p>
              </div>
            </div>
            <Button variant="outline" className="h-10 w-full rounded-xl border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] backdrop-blur-sm" onClick={handleLogout}>
              <LogOut className={cn(icon.xs, 'mr-2')} strokeWidth={ICON_STROKE} />
              ออกจากระบบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}

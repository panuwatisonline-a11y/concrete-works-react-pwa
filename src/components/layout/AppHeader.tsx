import { useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Menu from '@mui/icons-material/Menu'
import Close from '@mui/icons-material/Close'
import Logout from '@mui/icons-material/Logout'
import Dashboard from '@mui/icons-material/Dashboard'
import Search from '@mui/icons-material/Search'
import { AppIcon } from '@/components/icons/AppIcon'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { POUR_DESKTOP_MEDIA } from '@/lib/pourLayout'
import { theme, BRAND_TAGLINE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { adminConsoleLinks } from '@/lib/adminNav'
import { mainNavLinks } from '@/lib/mainNav'
import { canManageUsers, isSuperAdmin } from '@/lib/permissions'
import { isNavToActive } from '@/lib/navActive'
import { CollapsibleNavSection } from '@/components/layout/CollapsibleNavSection'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { SuperAdminJobFilter } from '@/components/layout/SuperAdminJobFilter'
import { AppVersionLabel } from '@/components/layout/AppVersionLabel'

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
  const drawerMainLinks = mainNavLinks(role)

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
      <Box
        component="header"
        ref={headerRef}
        className="sticky top-0 z-40 shrink-0 pour-desktop:hidden"
        sx={{
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* Mobile wireframe header: เมนู | ชื่อซ้าย | ค้นหา */}
        <div className={cn('mx-auto grid min-h-[48px] w-full min-w-0 max-w-none grid-cols-[2.5rem_1fr_2.5rem] items-center gap-x-1 gap-y-0 pour-desktop:hidden', theme.headerBarMobile)}>
          <button
            type="button"
            className={cn(
              'pour-interactive pour-nav-item inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-start rounded-xl border border-transparent text-[color:var(--pour-ink-2)] hover:border-[color:var(--glass-border-subtle)] hover:bg-[color:var(--pour-accent-muted)] hover:text-[color:var(--pour-accent)]',
            )}
            onClick={() => setDrawerOpen(true)}
            aria-label="เปิดเมนู"
          >
            <AppIcon icon={Menu} size="lg" />
          </button>
          <Link
            to={APP_HOME}
            className="pour-interactive pour-nav-item min-w-0 justify-self-start rounded-lg px-0.5 py-1 text-left no-underline"
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
            <AppIcon icon={Search} size="sm" />
          </button>
        </div>
        {isSuperAdmin(role) ? (
          <div className="border-t border-[color:var(--glass-border-subtle)] px-3 pb-2 pt-1.5 pour-desktop:hidden">
            <SuperAdminJobFilter variant="mobile" />
          </div>
        ) : null}
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 'min(20rem, 92vw)',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
          <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography component="h2" className="sr-only">
              เมนู
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Link
                to={APP_HOME}
                onClick={() => setDrawerOpen(false)}
                className="pour-interactive pour-nav-item flex min-w-0 flex-1 items-center gap-3 rounded-lg no-underline"
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
              <IconButton aria-label="ปิดเมนู" onClick={() => setDrawerOpen(false)} size="small">
                <AppIcon icon={Close} size="md" />
              </IconButton>
            </Box>
          </Box>

          {isSuperAdmin(role) ? (
            <div className="border-b border-[color:var(--glass-border-subtle)] px-4 py-3 pour-desktop:hidden">
              <SuperAdminJobFilter variant="mobile" />
            </div>
          ) : null}

          <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }} className="space-y-4">
            <CollapsibleNavSection title="MENU" defaultOpen={!adminSectionActive} panelClassName="space-y-1 pb-1">
              {drawerMainLinks.map(({ to, label, icon: Icon, end }) => (
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
                  <AppIcon icon={Icon} size="md" />
                  {label}
                </NavLink>
              ))}
              {canManageUsers(role) ? (
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
                  <AppIcon icon={Dashboard} size="md" />
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
                            ? location.pathname === '/cst'
                            : to === '/cst/concrete-summary'
                              ? location.pathname.startsWith('/cst/concrete-summary')
                              : isNavToActive(to, location))
                            ? 'bg-[color:var(--pour-accent-muted)] text-[color:var(--pour-accent)]'
                            : 'text-[color:var(--pour-ink-1)] hover:bg-[color:var(--pour-accent-muted)]',
                        )
                      }
                    >
                      <AppIcon icon={Icon} size="md" />
                      {label}
                    </NavLink>
                ))}
              </CollapsibleNavSection>
            ) : null}
          </Box>

          <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
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
              <AppIcon icon={Logout} size="xs" className="mr-2" />
              ออกจากระบบ
            </Button>
            <AppVersionLabel />
          </Box>
      </Drawer>

    </>
  )
}

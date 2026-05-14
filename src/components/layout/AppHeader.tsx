import { useState, type ElementType } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, LogOut, PlusCircle, User, LayoutDashboard, Users,
  Building2, MapPin, HardHat, Layers, FlaskConical, Code2, GitBranch, Briefcase,
  Search, Star, Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

/** แถบหน้าหลักบนมือถือ — แทน bottom tab */
function MobilePrimaryNav() {
  const location = useLocation()
  const q = new URLSearchParams(location.search)
  const isMineTab = location.pathname === '/requests' && q.get('scope') === 'mine'
  const isStatusTab =
    location.pathname === '/requests' && q.get('view') === 'summary' && q.get('scope') !== 'mine'

  const pill = (active: boolean) =>
    cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
      active ? theme.navPillActive : theme.navPillInactive,
    )

  return (
    <nav aria-label="เมนูหลัก" className={cn(theme.primaryNavStrip, 'md:hidden')}>
      <div className="mx-auto flex w-full min-w-0 max-w-none items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link to="/requests?view=summary" className={pill(isStatusTab)} aria-current={isStatusTab ? 'page' : undefined}>
          <Activity className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          สถานะ
        </Link>
        <Link
          to="/requests?view=latest&scope=mine"
          className={pill(isMineTab)}
          aria-current={isMineTab ? 'page' : undefined}
        >
          <Star className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.5} fill="currentColor" aria-hidden />
          รายการของฉัน
        </Link>
      </div>
    </nav>
  )
}

export function AppHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, role } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const setRequestFiltersOpen = useFilterStore((s) => s.setRequestFiltersOpen)

  async function handleLogout() {
    await supabase.auth.signOut()
    setDrawerOpen(false)
    navigate('/login')
  }

  function goToSearch() {
    navigate('/requests?view=latest')
    setRequestFiltersOpen(true)
  }

  return (
    <>
      <header className={cn('sticky top-0 z-40 md:hidden', theme.headerBar)}>
        {/* Mobile wireframe header: เมนู | ชื่อกลาง | ค้นหา */}
        <div className="mx-auto grid min-h-[44px] w-full min-w-0 max-w-none grid-cols-[2.5rem_1fr_2.5rem] items-center gap-x-1 gap-y-0 px-2 py-1.5 md:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-start rounded-xl text-[#374151] transition hover:bg-[#f0f2f5] hover:shadow-sm active:scale-95"
            onClick={() => setDrawerOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <Link
            to="/requests?view=latest"
            className="min-w-0 justify-self-center px-0.5 text-center no-underline"
          >
            <span className={cn('block text-sm', theme.brandWordmark)}>Concrete Works</span>
            <span className="mt-0.5 block text-[9px] font-medium leading-snug tracking-wide text-[#9ca3af] sm:text-[10px]">
              {BRAND_TAGLINE}
            </span>
          </Link>
          <button
            type="button"
            onClick={goToSearch}
            className={cn('h-9 w-9 shrink-0 justify-self-end', theme.iconButtonChrome)}
            aria-label="ค้นหาและตัวกรอง"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        <MobilePrimaryNav />
      </header>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-[min(20rem,92vw)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border border-y-0 border-l-0 border-[#e2e6ec] bg-white p-0 sm:max-w-none"
        >
          <DialogHeader className="border-b border-[#e2e6ec] bg-[#f5f6f8]/80 p-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-bold tracking-tight text-[#111827]">เมนู</DialogTitle>
              <button
                type="button"
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f0f2f5]"
                onClick={() => setDrawerOpen(false)}
                aria-label="ปิด"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-left text-xs font-normal text-[#6b7280]">
              {[profile?.fname, profile?.lname].filter(Boolean).join(' ') || profile?.role}
            </p>
          </DialogHeader>

          <nav className="flex-1 overflow-y-auto p-2">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">หลัก</p>
            <div className="space-y-0.5">
              {mainLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setDrawerOpen(false)}
                  className={() =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
                      isNavToActive(to, location)
                        ? 'bg-[rgba(37,99,235,0.10)] text-[#2563eb]'
                        : 'text-[#374151] hover:bg-[#f5f6f8]',
                    )
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
            </div>

            {role === 'admin' && (
              <>
                <p className="mt-4 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                  Admin
                </p>
                <div className="space-y-0.5">
                  {adminLinks.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
                          isActive
                        ? 'bg-[rgba(37,99,235,0.10)] text-[#2563eb]'
                        : 'text-[#374151] hover:bg-[#f5f6f8]',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </nav>

          <div className="border-t border-[#e2e6ec] p-3">
            <Button variant="outline" className="h-10 w-full rounded-xl border-[#e2e6ec]" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
              ออกจากระบบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}

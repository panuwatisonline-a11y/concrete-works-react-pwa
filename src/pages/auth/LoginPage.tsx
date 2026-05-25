import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { auth, theme, BRAND_TAGLINE } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { SvgIconComponent } from '@mui/icons-material'
import ListAlt from '@mui/icons-material/ListAlt'
import LocalShipping from '@mui/icons-material/LocalShipping'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Scale from '@mui/icons-material/Scale'
import TrendingDown from '@mui/icons-material/TrendingDown'
import BarChart from '@mui/icons-material/BarChart'
import Science from '@mui/icons-material/Science'
import Description from '@mui/icons-material/Description'
import Notifications from '@mui/icons-material/Notifications'
import CloudOff from '@mui/icons-material/CloudOff'
import { AppIcon } from '@/components/icons/AppIcon'

const features: { icon: SvgIconComponent; text: string }[] = [
  { icon: ListAlt, text: 'จองและจัดการคำขอคอนกรีต' },
  { icon: LocalShipping, text: 'ติดตามสถานะคอนกรีตแบบ Real-Time' },
  { icon: CalendarMonth, text: 'สรุปการจองและแผนงานเท' },
  { icon: Scale, text: 'Concrete Balance' },
  { icon: TrendingDown, text: 'Loss Concrete' },
  { icon: BarChart, text: 'Monthly Concrete Summary' },
  { icon: Science, text: 'บันทึกผลทดสอบกำลังอัดคอนกรีตพร้อมรายงาน (CST)' },
  { icon: Description, text: 'Checklist ก่อนเทคอนกรีต' },
  { icon: Notifications, text: 'ระบบ Push Notification' },
  { icon: CloudOff, text: 'ระบบ Offline Sync' },
]

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { user, profile, profileHydrated } = useAuthStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !profileHydrated) return
    if (!profile?.employee_id) {
      navigate('/complete-profile', { replace: true })
    } else if (profile.status === 'approved' || profile.role === 'admin' || profile.role === 'super_admin') {
      navigate(APP_HOME, { replace: true })
    } else {
      navigate('/pending-approval', { replace: true })
    }
  }, [user, profile, profileHydrated, navigate])

  async function handleGoogleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) {
      toast.error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto overscroll-y-contain bg-[color:var(--pour-bg)] pour-desktop:h-dvh pour-desktop:max-h-dvh pour-desktop:flex-row pour-desktop:overflow-hidden">
      <div className="relative hidden min-h-0 shrink-0 overflow-hidden p-8 pour-desktop:flex pour-desktop:h-full pour-desktop:w-[42%] pour-wide:p-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/login-sidebar-bg.png')] bg-cover bg-center bg-no-repeat"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0d1117]/90 via-[#1e1e1e]/85 to-[#1a2836]/90"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 pour-wide:gap-8">
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <img src="/pwa-192x192.png" alt="" className="h-10 w-10 rounded-xl object-contain" aria-hidden />
              <span className="text-xl font-bold tracking-tight text-white">Concrete Works</span>
            </div>
            <div className="mt-4 max-w-md rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm pour-wide:mt-5">
              <p className="text-sm font-semibold leading-snug text-white/95">{BRAND_TAGLINE}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
            <h1 className="mb-3 text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white pour-wide:mb-4 pour-wide:text-[2rem]">
              Application จัดการงานคอนกรีต
            </h1>
            <p className="mb-5 text-[14px] leading-relaxed text-white/70 pour-wide:mb-6 pour-wide:text-[15px]">
              จองคอนกรีต, ติดตามสถานะ, สร้างรายงาน
            </p>
            <div className="space-y-3 pour-wide:space-y-4">
              {features.map(({ icon: FeatureIcon, text }, i) => (
                <div key={i} className="flex items-start gap-3 text-[13px] leading-snug text-white/90 pour-wide:text-[14px]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <AppIcon icon={FeatureIcon} size="sm" />
                  </span>
                  <span className="min-w-0 pt-1">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-white/10 pt-4 pour-wide:pt-5">
            <div className="flex min-w-0 items-center gap-2 text-[12px] text-white/55">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              ระบบพร้อมใช้งาน
            </div>
            <div className="ml-auto flex w-full max-w-[15.25rem] shrink-0 flex-col items-end gap-2 sm:max-w-[16.25rem]">
              <img
                src="/templates/checksheet-logo.png"
                alt="STECON"
                className="h-9 w-auto max-w-[164px] object-contain object-right [filter:brightness(1.35)_saturate(0.72)_contrast(0.88)_opacity(0.85)]"
              />
              <div className="w-full text-right text-pretty">
                <p className="text-[10.5px] font-semibold leading-snug tracking-[-0.01em] text-white/78 sm:text-[11.5px]">
                  Sino-Thai Engineering and Construction
                </p>
                <p className="mt-0.5 text-[10px] font-normal leading-snug text-white/58 sm:text-[11px]">
                  Public Company Limited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(auth.shell, 'min-h-0 shrink-0 pour-desktop:min-h-0 pour-desktop:overflow-y-auto')}>
        <div className={auth.card}>
          <div className="mb-8 flex items-center gap-3 pour-desktop:hidden">
            <img src="/pwa-192x192.png" alt="" className="h-10 w-10 rounded-xl object-contain" aria-hidden />
            <span className={cn(theme.sidebarBrandTitle, 'text-lg')}>Concrete Works</span>
          </div>

          <h2 className={auth.title}>ยินดีต้อนรับ</h2>
          <p className={auth.subtitle}>เข้าสู่ระบบด้วยบัญชี Google เพื่อจัดการงานคอนกรีต</p>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="h-12 w-full rounded-xl border-[color:var(--glass-border)] bg-[color:var(--glass-bg-muted)] text-sm font-semibold text-[color:var(--pour-ink-0)] hover:bg-[color:var(--glass-bg-strong)]"
          >
            <GoogleIcon />
            <span className="ml-3">{loading ? 'กำลังเชื่อมต่อ…' : 'เข้าสู่ระบบด้วย Google'}</span>
          </Button>

          <p className="mt-6 text-center text-xs text-pour-subtle">เฉพาะบัญชี google เท่านั้น</p>
        </div>
      </div>
    </div>
  )
}

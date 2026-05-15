import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Truck, Scale, TrendingDown, BarChart3 } from 'lucide-react'

const features = [
  { icon: Truck, text: 'ติดตามสถานะคอนกรีตแบบ Real-Time' },
  { icon: Scale, text: 'Concrete Balance' },
  { icon: TrendingDown, text: 'Loss Concrete' },
  { icon: BarChart3, text: 'Monthly Concrete Summary' },
]

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
    } else if (profile.status === 'approved' || profile.role === 'admin') {
      navigate(APP_HOME, { replace: true })
    } else {
      navigate('/pending-approval', { replace: true })
    }
  }, [user, profile, profileHydrated, navigate])

  async function handleGoogleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      toast.error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ')
      setLoading(false)
    }
  }

  const formPanel = (
    <div className={cn('flex flex-1 items-center justify-center px-6 py-10', theme.shell)}>
      <div className="pour-glass pour-page-enter w-full max-w-95 rounded-2xl p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3 md:hidden">
          <img
            src="/pwa-192x192.png"
            alt="Concrete Works logo"
            className="h-10 w-10 rounded-xl object-contain"
            aria-hidden
          />
          <span className="text-xl font-bold tracking-tight text-[#111827]">Concrete Works</span>
        </div>

        <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">ยินดีต้อนรับ</h2>
        <p className="mb-8 text-sm text-[#6b7280]">เข้าสู่ระบบด้วยบัญชี Google เพื่อจัดการงานคอนกรีต</p>

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="h-12 w-full rounded-xl border border-(--glass-border-subtle) bg-white text-sm font-semibold text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-[#f9fafb] active:bg-[#f3f4f6]"
        >
          <GoogleIcon />
          <span className="ml-3">{loading ? 'กำลังเชื่อมต่อ…' : 'เข้าสู่ระบบด้วย Google'}</span>
        </Button>

        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          เฉพาะบัญชี google เท่านั้น
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-y-auto overscroll-y-contain md:flex-row md:overflow-hidden">
      {/* Left brand panel — desktop only */}
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#134e4a_0%,#0f766e_48%,#042f2e_100%)] p-12 md:flex md:w-[42%]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="loginHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth="1.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginHatch)"/>
        </svg>

        <div className="relative">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Concrete Works logo"
              className="h-10 w-10 rounded-xl object-contain"
              aria-hidden
            />
            <span className="text-xl font-bold tracking-tight text-white">Concrete Works</span>
          </div>
          <div className="mt-5 max-w-md rounded-lg border border-white/15 bg-white/6 px-4 py-3 backdrop-blur-[2px]">
            <p className="text-sm font-semibold leading-snug text-white/95">
              Quality Management and Innovation Section
            </p>
          </div>
        </div>

        <div className="relative">
          <h1 className="mb-4 text-[2rem] font-bold leading-[1.15] tracking-tight text-white">
            Application จัดการงานคอนกรีต (Prototype)
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-white/75">
            จองคอนกรีต, ติดตามสถานะ, สร้างรายงาน
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-[14px] text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[12px] text-white/55">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          ระบบพร้อมใช้งาน
        </div>
      </div>

      {formPanel}
    </div>
  )
}

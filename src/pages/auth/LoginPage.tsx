import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_HOME } from '@/lib/appHome'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Briefcase, Truck, ArrowRight, Scale, TrendingDown, BarChart3 } from 'lucide-react'
import type { Profile } from '@/types/app.types'

const schema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

type FormData = z.infer<typeof schema>

const features = [
  { icon: Truck, text: 'ติดตามสถานะคอนกรีตแบบ Real-Time' },
  { icon: Scale, text: 'Concrete Balance' },
  { icon: TrendingDown, text: 'Loss Concrete' },
  { icon: BarChart3, text: 'Monthly Concrete Summary' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { user, setUser, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    if (user) navigate(APP_HOME, { replace: true })
  }, [user, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    setUser(authData.user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    setProfile(profile as Profile | null)

    navigate(APP_HOME)
    setLoading(false)
  }

  const formPanel = (
    <div className="pour-shell flex flex-1 items-center justify-center px-6 py-10">
      <div className="pour-glass pour-page-enter w-full max-w-[380px] rounded-2xl p-6 sm:p-8">
        {/* Mobile-only logo */}
        <div className="mb-8 flex items-center gap-3 md:hidden">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', theme.iconTileBrand)}>
            <Briefcase className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-xl font-bold tracking-tight text-[#111827]">Concrete Works</span>
        </div>

        <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">ยินดีต้อนรับ</h2>
        <p className="mb-8 text-sm text-[#6b7280]">เข้าสู่ระบบเพื่อจองคอนกรีตและจัดการงานคอนกรีต</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              อีเมล
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              className="font-pour-mono h-11 text-sm"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                รหัสผ่าน
              </Label>
              <a className="cursor-pointer text-xs font-medium text-[color:var(--pour-accent)] hover:text-[color:var(--pour-accent-hover)] hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 text-sm"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
          </div>

          <div
            className="flex cursor-pointer items-center gap-2.5"
            onClick={() => setRemember(!remember)}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${
                remember ? 'border-[color:var(--pour-accent)] bg-[color:var(--pour-accent)]' : 'border-[color:var(--glass-border-subtle)] bg-white'
              }`}
            >
              {remember && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-[#374151]">อยู่ในระบบในอุปกรณ์นี้</span>
          </div>

          <Button
            type="submit"
            className="mt-1 h-11 w-full rounded-xl bg-[color:var(--pour-accent)] text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12),0_4px_14px_rgba(0,0,0,0.1)] hover:bg-[color:var(--pour-accent-hover)]"
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ…' : (
              <>เข้าสู่ระบบ <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} /></>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6b7280]">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="font-semibold text-[color:var(--pour-accent)] hover:text-[color:var(--pour-accent-hover)] hover:underline">
            สมัครใช้งาน
          </Link>
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-y-auto overscroll-y-contain md:flex-row md:overflow-hidden">
      {/* Left brand panel — desktop only */}
      <div
        className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#525252_0%,#262626_50%,#0a0a0a_100%)] p-12 md:flex md:w-[42%]"
      >
        {/* Hatch overlay */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="loginHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth="1.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginHatch)"/>
        </svg>

        {/* Logo + Quality Management and Innovation */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
              <Briefcase className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">Concrete Works</span>
          </div>
          <div className="mt-5 max-w-md rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur-[2px]">
            <p className="text-sm font-semibold leading-snug text-white/95">
              Quality Management and Innovation Section
            </p>
          </div>
        </div>

        {/* Copy */}
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

        {/* Status footer */}
        <div className="relative flex items-center gap-2 text-[12px] text-white/55">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          ระบบพร้อมใช้งาน
        </div>
      </div>

      {formPanel}
    </div>
  )
}

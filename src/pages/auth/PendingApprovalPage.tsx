import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { APP_HOME } from '@/lib/appHome'
import { Clock } from 'lucide-react'

export function PendingApprovalPage() {
  const navigate = useNavigate()
  const { user, profile, profileHydrated } = useAuthStore()

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    if (!profileHydrated) return
    if (!profile?.employee_id) { navigate('/complete-profile', { replace: true }); return }
    if (profile.status === 'approved' || profile.role === 'admin') {
      navigate(APP_HOME, { replace: true })
    }
  }, [user, profile, profileHydrated, navigate])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const name = [profile?.fname, profile?.lname].filter(Boolean).join(' ') || profile?.employee_id || ''

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[color:var(--pour-bg)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-8 text-center shadow-[var(--glass-shadow-sm)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-950/50">
          <Clock className="h-7 w-7 text-amber-500" strokeWidth={1.75} />
        </div>

        <h1 className="mb-2 text-xl font-bold text-[color:var(--pour-ink-0)]">รอการอนุมัติ</h1>
        <p className="mb-1 text-sm text-pour-muted">
          {name ? `สวัสดี ${name} —` : ''} บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ
        </p>
        <p className="mb-8 text-sm text-pour-muted">
          กรุณารอการแจ้งเตือนจาก Admin แล้วลองเข้าสู่ระบบใหม่อีกครั้ง
        </p>

        <Button
          variant="outline"
          className="w-full rounded-xl border-[color:var(--glass-border-subtle)] text-sm text-[color:var(--pour-ink-1)]"
          onClick={handleSignOut}
        >
          ออกจากระบบ
        </Button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import type { ClientItem, Job, Profile } from '@/types/app.types'
import { APP_HOME } from '@/lib/appHome'
import { app, layout, rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const schema = z.object({
  employee_id: z.string().min(1, 'กรุณาระบุรหัสพนักงาน'),
  fname: z.string().min(1, 'กรุณาระบุชื่อ'),
  lname: z.string().min(1, 'กรุณาระบุนามสกุล'),
  phone: z.string().optional(),
  client_id: z.string().optional(),
  job_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function CompleteProfilePage() {
  const navigate = useNavigate()
  const { user, profile, profileHydrated, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientItem[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (profileHydrated && profile?.employee_id) {
      navigate(APP_HOME, { replace: true })
    }
  }, [user, profile, profileHydrated, navigate])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase.from('Client').select('*').order('client_name').then(({ data }) => {
      setClients(data ?? [])
    })
    void supabase.from('Jobs').select('*').order('job_name').then(({ data }) => {
      setJobs(data ?? [])
    })
  }, [])

  const meta = user?.user_metadata ?? {}
  const defaultFname = (meta.given_name as string | undefined) ?? (meta.full_name as string | undefined)?.split(' ')[0] ?? ''
  const defaultLname = (meta.family_name as string | undefined) ?? (meta.full_name as string | undefined)?.split(' ').slice(1).join(' ') ?? ''

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fname: defaultFname,
      lname: defaultLname,
      client_id: '',
      job_id: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!isSupabaseConfigured || !user) {
      toast.error('ยังตั้งค่า Supabase ไม่ครบ')
      return
    }

    setLoading(true)

    const { data: existing, error: existingErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', data.employee_id)
      .maybeSingle()

    if (existingErr) {
      console.warn('profiles precheck:', existingErr.message)
    } else if (existing) {
      toast.error('รหัสพนักงานนี้ถูกใช้แล้ว')
      setLoading(false)
      return
    }

    const clientId = data.client_id ? parseInt(data.client_id, 10) : null
    const jobId = data.job_id ? parseInt(data.job_id, 10) : null
    const clientName = clientId ? (clients.find((c) => c.id === clientId)?.client_name ?? null) : null

    const profileRow = {
      id: user.id,
      employee_id: data.employee_id,
      fname: data.fname,
      lname: data.lname,
      phone: data.phone || null,
      client_id: clientId,
      client_name: clientName,
      job_id: jobId,
      role: 'user' as const,
    }

    const { error: profileErr } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' })

    if (profileErr) {
      toast.error(
        profileErr.message.includes('duplicate') || profileErr.code === '23505'
          ? 'รหัสพนักงานหรือบัญชีนี้มีในระบบแล้ว'
          : `บันทึกโปรไฟล์ไม่สำเร็จ: ${profileErr.message}`,
      )
      setLoading(false)
      return
    }

    const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(
      freshProfile
        ? (freshProfile as Profile)
        : {
            id: user.id,
            employee_id: profileRow.employee_id,
            fname: profileRow.fname,
            lname: profileRow.lname,
            phone: profileRow.phone,
            role: 'user',
            client_id: profileRow.client_id,
            client_name: profileRow.client_name,
            job_id: profileRow.job_id,
            created_at: new Date().toISOString(),
          },
    )

    toast.success('บันทึกโปรไฟล์สำเร็จ')
    navigate(APP_HOME, { replace: true })
    setLoading(false)
  }

  return (
    <div className={app.shellScroll}>
      <div className={app.shellInner}>
        <Card className="w-full max-w-md">
          <CardHeader className={cn(rq.cardHeader, 'space-y-1 text-center')}>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-[#111827]">Concrete Works</CardTitle>
            <CardDescription className="text-sm text-[#6b7280]">
              กรอกข้อมูลเพื่อเริ่มใช้งาน — ทำเพียงครั้งเดียว
            </CardDescription>
            {user?.email && (
              <p className="text-xs text-[#9ca3af]">{user.email}</p>
            )}
          </CardHeader>
          <CardContent className={rq.cardContent}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className={layout.formGrid2}>
                <div className="space-y-1.5">
                  <Label>ชื่อ *</Label>
                  <Input placeholder="ชื่อ" {...register('fname')} />
                  {errors.fname && <p className="text-xs text-rose-600">{errors.fname.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>นามสกุล *</Label>
                  <Input placeholder="นามสกุล" {...register('lname')} />
                  {errors.lname && <p className="text-xs text-rose-600">{errors.lname.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>รหัสพนักงาน *</Label>
                <Input placeholder="P04851" {...register('employee_id')} />
                {errors.employee_id && <p className="text-xs text-rose-600">{errors.employee_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>เบอร์โทร</Label>
                <Input placeholder="0830836564" {...register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>บริษัท / Contractor</Label>
                <Select
                  value={watch('client_id') || undefined}
                  onValueChange={(v) => setValue('client_id', v)}
                >
                  <SelectTrigger><SelectValue placeholder="เลือกบริษัท" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>โครงการ</Label>
                <Select
                  value={watch('job_id') || undefined}
                  onValueChange={(v) => setValue('job_id', v)}
                >
                  <SelectTrigger><SelectValue placeholder="เลือกโครงการ" /></SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>{j.job_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl font-semibold shadow-[0_1px_2px_var(--pour-accent-ring),0_4px_14px_rgba(0,0,0,0.1)]"
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : 'เริ่มใช้งาน'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-[#9ca3af]">
              ไม่ใช่บัญชีของคุณ?{' '}
              <Link
                to="/login"
                className="font-semibold text-(--pour-accent) hover:text-(--pour-accent-hover) hover:underline"
                onClick={() => supabase.auth.signOut()}
              >
                ออกจากระบบ
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

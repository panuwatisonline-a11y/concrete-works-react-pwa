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
import { app } from '@/lib/requestUi'

const schema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
  employee_id: z.string().min(1, 'กรุณาระบุรหัสพนักงาน'),
  fname: z.string().min(1, 'กรุณาระบุชื่อ'),
  lname: z.string().min(1, 'กรุณาระบุนามสกุล'),
  phone: z.string().optional(),
  client_id: z.string().optional(),
  job_id: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { user, setUser, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientItem[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    if (user) navigate('/requests', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void supabase.from('Client').select('*').order('client_name').then(({ data }) => {
      setClients(data ?? [])
    })
    void supabase.from('Jobs').select('*').order('job_name').then(({ data }) => {
      setJobs(data ?? [])
    })
  }, [])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { client_id: '', job_id: '' },
  })

  async function onSubmit(data: FormData) {
    if (!isSupabaseConfigured) {
      toast.error('ยังตั้งค่า Supabase ไม่ครบ — ตรวจสอบ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY')
      return
    }

    setLoading(true)

    const { data: existing, error: existingErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', data.employee_id)
      .maybeSingle()

    if (existingErr) {
      console.warn('profiles precheck (employee_id):', existingErr.message)
    } else if (existing) {
      toast.error('รหัสพนักงานนี้ถูกใช้แล้ว')
      setLoading(false)
      return
    }

    const clientId = data.client_id ? parseInt(data.client_id, 10) : null
    const jobId = data.job_id ? parseInt(data.job_id, 10) : null
    let clientName: string | null = null
    if (clientId) {
      const client = clients.find((c) => c.id === clientId)
      clientName = client?.client_name ?? null
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          employee_id: data.employee_id,
          fname: data.fname,
          lname: data.lname,
          phone: data.phone ?? '',
          role: 'user',
          client_id: clientId != null ? String(clientId) : '',
          job_id: jobId != null ? String(jobId) : '',
          client_name: clientName ?? '',
        },
      },
    })

    if (error || !authData.user) {
      toast.error(error?.message ?? 'เกิดข้อผิดพลาด')
      setLoading(false)
      return
    }

    const profileRow = {
      id: authData.user.id,
      employee_id: data.employee_id,
      fname: data.fname,
      lname: data.lname,
      phone: data.phone || null,
      client_id: clientId,
      client_name: clientName,
      job_id: jobId,
      role: 'user' as const,
    }

    if (authData.session) {
      const { error: profileErr } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' })
      if (profileErr) {
        console.error('profiles upsert:', profileErr.message)
        toast.error(
          profileErr.message.includes('duplicate') || profileErr.code === '23505'
            ? 'รหัสพนักงานหรือบัญชีนี้มีในระบบแล้ว'
            : `บันทึกโปรไฟล์ไม่สำเร็จ: ${profileErr.message}`,
        )
        setLoading(false)
        return
      }

      setUser(authData.user)
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
      if (freshProfile) {
        setProfile(freshProfile as Profile)
      } else {
        setProfile({
          id: authData.user.id,
          employee_id: profileRow.employee_id,
          fname: profileRow.fname,
          lname: profileRow.lname,
          phone: profileRow.phone,
          role: 'user',
          client_id: profileRow.client_id,
          client_name: profileRow.client_name,
          job_id: profileRow.job_id,
          created_at: new Date().toISOString(),
        })
      }
      toast.success('สมัครสำเร็จ')
      navigate('/requests', { replace: true })
      setLoading(false)
      return
    }

    toast.success(
      'สมัครแล้ว — กดลิงก์ยืนยันในอีเมลแล้วค่อยเข้าสู่ระบบ หรือปิดการยืนยันอีเมลใน Supabase (Authentication → Providers → Email) เพื่อเข้าใช้ได้ทันทีหลังสมัคร',
    )
    navigate('/login')
    setLoading(false)
  }

  return (
    <div className={app.shell}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 border-b border-[#e2e6ec]/90 bg-[#f5f6f8]/50 pb-4 text-center">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-[#111827]">Concrete Works</CardTitle>
          <CardDescription className="text-sm text-[#6b7280]">สมัครใช้งาน Application งานคอนกรีต</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 md:pt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>อีเมล *</Label>
              <Input type="email" placeholder="email@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>รหัสผ่าน *</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>ยืนยันรหัสผ่าน *</Label>
              <Input type="password" placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>}
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-semibold shadow-[0_1px_2px_rgba(37,99,235,0.25),0_4px_12px_rgba(37,99,235,0.18)]"
              disabled={loading}
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครใช้งาน'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[#6b7280]">
            มีบัญชีแล้ว?{' '}
            <Link to="/login" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

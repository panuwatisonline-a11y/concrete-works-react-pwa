import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import type { ClientItem } from '@/types/app.types'
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
}).refine((d) => d.password === d.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientItem[]>([])

  useEffect(() => {
    supabase.from('Client').select('*').order('client_name').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', data.employee_id)
      .maybeSingle()

    if (existing) {
      toast.error('รหัสพนักงานนี้ถูกใช้แล้ว')
      setLoading(false)
      return
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error || !authData.user) {
      toast.error(error?.message ?? 'เกิดข้อผิดพลาด')
      setLoading(false)
      return
    }

    const clientId = data.client_id ? parseInt(data.client_id) : null
    let clientName: string | null = null
    if (clientId) {
      const client = clients.find((c) => c.id === clientId)
      clientName = client?.client_name ?? null
    }

    await supabase.from('profiles').insert({
      id: authData.user.id,
      employee_id: data.employee_id,
      fname: data.fname,
      lname: data.lname,
      phone: data.phone || null,
      client_id: clientId,
      client_name: clientName,
      role: 'user',
    })

    toast.success('สมัครสำเร็จ กรุณาเข้าสู่ระบบ')
    navigate('/login')
  }

  return (
    <div className={app.shell}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 border-b border-[#e2e6ec]/90 bg-[#f5f6f8]/50 pb-3 text-center">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-[#111827]">Concrete Works</CardTitle>
          <CardDescription className="text-sm text-[#6b7280]">สมัครใช้งาน</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
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
              <Input placeholder="EMP-001" {...register('employee_id')} />
              {errors.employee_id && <p className="text-xs text-rose-600">{errors.employee_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input placeholder="0812345678" {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>บริษัท / Contractor</Label>
              <Select onValueChange={(v) => setValue('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="เลือกบริษัท" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>
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

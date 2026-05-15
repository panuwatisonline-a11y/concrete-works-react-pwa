import { useState, useEffect, useCallback } from 'react'
import { loadProfile } from '@/hooks/useAuth'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Profile } from '@/types/app.types'
import { layout, rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { Pencil } from 'lucide-react'

const profileSchema = z.object({
  fname: z.string().min(1, 'กรุณาระบุชื่อ'),
  lname: z.string().min(1, 'กรุณาระบุนามสกุล'),
  phone: z.string().optional(),
  job_id: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuthStore()
  const { jobs } = useMasterDataStore()
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fname: '',
      lname: '',
      phone: '',
      job_id: '',
    },
  })

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id)
  }, [user?.id])

  usePullToRefreshOnLoad(refreshProfile)

  useEffect(() => {
    if (!profile) return
    reset({
      fname: profile.fname ?? '',
      lname: profile.lname ?? '',
      phone: profile.phone ?? '',
      job_id: profile.job_id ? String(profile.job_id) : '',
    })
  }, [profile, reset])

  async function onSaveProfile(data: ProfileForm) {
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({
      fname: data.fname,
      lname: data.lname,
      phone: data.phone || null,
      job_id: data.job_id ? parseInt(data.job_id) : null,
    }).eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...data, job_id: data.job_id ? parseInt(data.job_id) : null } as Profile)
      toast.success('บันทึกสำเร็จ')
      setEditingProfile(false)
    } else {
      toast.error('เกิดข้อผิดพลาด')
    }
    setSavingProfile(false)
  }

  function cancelProfileEdit() {
    if (!profile) return
    reset({
      fname: profile.fname ?? '',
      lname: profile.lname ?? '',
      phone: profile.phone ?? '',
      job_id: profile.job_id ? String(profile.job_id) : '',
    })
    setEditingProfile(false)
  }

  const jobName =
    profile?.job_id != null ? jobs.find((j) => j.id === profile.job_id)?.job_name : undefined

  const roleLabels: Record<string, string> = { admin: 'Admin', manager: 'Manager', user: 'User' }

  return (
    <div className={rq.pageNarrow}>
      <RequestScreenHeader
        title="โปรไฟล์"
        subtitle="ข้อมูลบัญชีและการตั้งค่า"
        onBack={() => navigate(-1)}
        right={
          !editingProfile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-[#ccf0ed] text-[#374151]"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              แก้ไข
            </Button>
          ) : null
        }
      />

      <Card className={rq.card}>
        <div className={cn(rq.cardHeader, 'rounded-t-2xl')}>
          <div className="flex items-center gap-5">
            <div className="shrink-0 rounded-full bg-gradient-to-tr from-blue-400 via-blue-500 to-indigo-600 p-[3px] shadow-sm">
              <div className="rounded-full bg-white p-[2px]">
                <UserAvatar profile={profile} avatarUrl={user?.user_metadata?.avatar_url as string | undefined} size="lg" className="h-[4.5rem] w-[4.5rem] border-0" />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-lg font-bold text-[#111827]">
                {[profile?.fname, profile?.lname].filter(Boolean).join(' ') || profile?.employee_id || 'โปรไฟล์'}
              </p>
              <p className="text-sm text-[#6b7280]">{profile?.employee_id}</p>
              <Badge variant="secondary" className="border border-[#ccf0ed] bg-[#dcfce7] text-xs font-semibold text-[#374151]">
                {roleLabels[profile?.role ?? ''] ?? profile?.role}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className={cn(rq.cardContent, 'space-y-4')}>
          {editingProfile ? (
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
              <div className={layout.formGrid2}>
                <div className="space-y-1.5">
                  <Label>ชื่อ *</Label>
                  <Input className="rounded-xl" {...register('fname')} />
                  {errors.fname && <p className="text-xs text-rose-600">{errors.fname.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>นามสกุล *</Label>
                  <Input className="rounded-xl" {...register('lname')} />
                  {errors.lname && <p className="text-xs text-rose-600">{errors.lname.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>เบอร์โทร</Label>
                <Input className="rounded-xl" {...register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>โครงการ</Label>
                <Select value={watch('job_id') || undefined} onValueChange={(v) => setValue('job_id', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="เลือกโครงการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => <SelectItem key={j.id} value={String(j.id)}>{j.job_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className={cn(layout.formGrid2, 'rounded-xl bg-[#f5f6f8]/90 px-3 py-3 text-sm ring-1 ring-[#ccf0ed]/80')}>
                <div>
                  <p className={rq.label}>บริษัท</p>
                  <p className="font-medium text-[#111827]">{profile?.client_name ?? '-'}</p>
                </div>
                <div>
                  <p className={rq.label}>วันที่สมัคร</p>
                  <p className="font-medium text-[#111827]">{formatDate(profile?.created_at)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-[#ccf0ed]/80 pt-4">
                <Button type="submit" size="sm" className="rounded-xl shadow-sm shadow-teal-500/20" disabled={savingProfile}>
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#ccf0ed]"
                  onClick={cancelProfileEdit}
                  disabled={savingProfile}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className={layout.formGrid2}>
                <div>
                  <p className={cn(rq.label, 'mb-1')}>ชื่อ</p>
                  <p className="font-medium text-[#111827]">{profile?.fname?.trim() || '-'}</p>
                </div>
                <div>
                  <p className={cn(rq.label, 'mb-1')}>นามสกุล</p>
                  <p className="font-medium text-[#111827]">{profile?.lname?.trim() || '-'}</p>
                </div>
              </div>
              <div>
                <p className={cn(rq.label, 'mb-1')}>เบอร์โทร</p>
                <p className="font-medium text-[#111827]">{profile?.phone?.trim() || '-'}</p>
              </div>
              <div>
                <p className={cn(rq.label, 'mb-1')}>โครงการ</p>
                <p className="font-medium text-[#111827]">{jobName?.trim() || '-'}</p>
              </div>
              <div className={cn(layout.formGrid2, 'rounded-xl bg-[#f5f6f8]/90 px-3 py-3 text-sm ring-1 ring-[#ccf0ed]/80')}>
                <div>
                  <p className={rq.label}>บริษัท</p>
                  <p className="font-medium text-[#111827]">{profile?.client_name ?? '-'}</p>
                </div>
                <div>
                  <p className={rq.label}>วันที่สมัคร</p>
                  <p className="font-medium text-[#111827]">{formatDate(profile?.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

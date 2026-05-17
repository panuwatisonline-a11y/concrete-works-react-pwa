import { useCallback, useEffect, useState } from 'react'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { cn } from '@/lib/utils'
import { layout, rq } from '@/lib/requestUi'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import type { Request } from '@/types/app.types'

const schema = z.object({
  casting_date: z.string().min(1),
  request_time: z.string().min(1),
  mixcode_id: z.string().min(1),
  volume_request: z.string().min(1, 'Please enter Request Volume (cu.m)'),
  volume_dwg: z.string().optional(),
  sample_qty: z.string().optional(),
  remarks: z.string().optional(),
  structure_no: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RequestEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { filter, setFilter } = useFilterStore()
  const { mixcodes } = useMasterDataStore()
  const [request, setRequest] = useState<Request | null>(null)
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, control, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) })

  useDesktopSearchRegistration({
    placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const loadRequest = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('Request').select('*').eq('id', id).single()
    if (!data) return
    const r = data as Request
    if (r.status_id !== 1 || r.booked_by !== user?.id) {
      navigate(`/requests/${id}`)
      return
    }
    setRequest(r)
    setBeforeImage(r.before_image)
    reset({
      casting_date: r.casting_date ?? '',
      request_time: r.request_time ?? '',
      mixcode_id: r.mixcode_id ? String(r.mixcode_id) : '',
      volume_request: r.volume_request ? String(r.volume_request) : '',
      volume_dwg: r.volume_dwg ? String(r.volume_dwg) : '',
      sample_qty: r.sample_qty ? String(r.sample_qty) : '',
      remarks: r.remarks ?? '',
      structure_no: r.structure_no ?? '',
    })
  }, [id, user?.id, reset, navigate])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  usePullToRefreshOnLoad(loadRequest)

  async function onSubmit(data: FormData) {
    if (!id || !request) return
    setSubmitting(true)
    const { error } = await supabase.from('Request').update({
      casting_date: data.casting_date,
      request_time: data.request_time,
      mixcode_id: parseInt(data.mixcode_id),
      volume_request: parseFloat(data.volume_request),
      volume_dwg: data.volume_dwg ? parseFloat(data.volume_dwg) : null,
      sample_qty: data.sample_qty ? parseInt(data.sample_qty) : null,
      remarks: data.remarks || null,
      structure_no: data.structure_no || null,
      before_image: beforeImage,
    }).eq('id', id)

    if (!error) {
      toast.success('บันทึกสำเร็จ')
      await notifyRequestListChanged()
      navigate(`/requests/${id}`)
    } else {
      toast.error('เกิดข้อผิดพลาด')
    }
    setSubmitting(false)
  }

  if (!request) {
    return (
      <div className={rq.pageNarrow}>
        <div className="flex flex-col items-center justify-center py-20">
          <div className={rq.spinner} />
          <p className="mt-3 text-sm text-pour-muted">กำลังโหลด…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={rq.pageNarrow}>
      <RequestScreenHeader title="แก้ไขคำขอ" subtitle="แก้ไขได้เมื่อสถานะรอตรวจสอบเท่านั้น" onBack={() => navigate(-1)} />

      <Card className={rq.card}>
        <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
          <CardTitle className={rq.cardTitle}>รายละเอียดการจอง</CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.cardContent, 'space-y-4')}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className={layout.formGrid2}>
              <div className="space-y-1.5">
                <Label>วันเท *</Label>
                <Input type="date" {...register('casting_date')} />
              </div>
              <div className="space-y-1.5">
                <Label>เวลา *</Label>
                <Input type="time" {...register('request_time')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mixcode *</Label>
              <Controller
                name="mixcode_id"
                control={control}
                render={({ field }) => (
                  <MixcodePicker value={field.value} onChange={field.onChange} mixcodes={mixcodes} />
                )}
              />
            </div>
            <div className={layout.formGrid2}>
              <div className="space-y-1.5">
                <Label>DWG volume (cu.m)</Label>
                <Input type="number" step="0.01" {...register('volume_dwg')} />
              </div>
              <div className="space-y-1.5">
                <Label>Request Volume (cu.m) *</Label>
                <Input type="number" step="0.01" {...register('volume_request')} />
              </div>
            </div>
            <div className={layout.formGrid2}>
              <div className="space-y-1.5">
                <Label>Structure No.</Label>
                <Input {...register('structure_no')} />
              </div>
              <div className="space-y-1.5">
                <Label>จำนวนตัวอย่าง</Label>
                <Input type="number" {...register('sample_qty')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea rows={3} {...register('remarks')} />
            </div>
            <div className="space-y-1.5">
              <Label>รูปก่อนเท</Label>
              <ImageUpload value={beforeImage ?? undefined} onChange={(url) => setBeforeImage(url)} folder="before" />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--pour-surface-border)]/80 pt-5">
              <Button type="submit" className="rounded-xl shadow-md shadow-[color:var(--pour-accent)]/20" disabled={submitting}>
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl border-[color:var(--pour-surface-border)]" onClick={() => navigate(-1)}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

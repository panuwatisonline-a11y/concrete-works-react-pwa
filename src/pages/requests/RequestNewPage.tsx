import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatDate, cn } from '@/lib/utils'
import { ensureBookedRequestLog } from '@/lib/requestLogService'
import { APP_HOME } from '@/lib/appHome'
import { parseStructureListTokens, structureListsIntersect, structureHasCompatibleMixcode } from '@/lib/structureListTokens'
import { rq } from '@/lib/requestUi'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { MixcodePicker } from '@/components/requests/MixcodePicker'

const schema = z.object({
  client_id: z.string().min(1, 'กรุณาเลือก Client'),
  location_id: z.string().min(1, 'กรุณาเลือก Location'),
  concrete_work_id: z.string().min(1, 'กรุณาเลือก Concrete Work'),
  structure_id: z.string().min(1, 'กรุณาเลือก Structure'),
  structure_no: z.string().optional(),
  abc_code_id: z.string().optional(),
  wbs_code_id: z.string().optional(),
  casting_date: z.string().min(1, 'กรุณาเลือกวันเท'),
  request_time: z.string().min(1, 'กรุณาระบุเวลา'),
  mixcode_id: z.string().min(1, 'กรุณาเลือก Mixcode'),
  volume_request: z.string().min(1, 'Please enter Request Volume (cu.m)'),
  volume_dwg: z.string().optional(),
  sample_qty: z.string().optional(),
  remarks: z.string().optional(),
  before_image: z.string().optional(),
})

type FormData = z.infer<typeof schema>

/** ค่าเริ่มต้น `<input type="date">` ตามปฏิทินท้องถิ่น (ไม่ใช้ UTC จาก toISOString) */
function dateInputYYYYMMDDLocal(offsetDays: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function requestTimeToInputValue(t: string | null | undefined): string {
  if (t == null || String(t).trim() === '') return '09:00'
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t).trim())
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '09:00'
}

const STEPS = ['ข้อมูลงาน', 'ข้อมูลการเท', 'รูปภาพ & ยืนยัน']

export function RequestNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuthStore()
  const { clients, locations, concreteWorks, structures, mixcodes, abcCodes, wbsCodes } = useMasterDataStore()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const [beforeImage, setBeforeImage] = useState<string | null>(null)

  const { control, register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: profile?.client_id ? String(profile.client_id) : '',
      location_id: '',
      concrete_work_id: '',
      structure_id: '',
      structure_no: '',
      abc_code_id: '',
      wbs_code_id: '',
      casting_date: dateInputYYYYMMDDLocal(2),
      request_time: '09:00',
      mixcode_id: '',
      volume_request: '',
      volume_dwg: '',
      sample_qty: '',
      remarks: '',
      before_image: '',
    },
  })

  const watchConcreteWork = watch('concrete_work_id')
  const watchStructureId = watch('structure_id')
  const selectedCW = concreteWorks.find((cw) => String(cw.id) === watchConcreteWork)
  const selectedStructure = structures.find((s) => String(s.id) === watchStructureId)

  const filteredStructures = useMemo(() => {
    if (!selectedCW) return structures
    return structures.filter((s) =>
      structureHasCompatibleMixcode(s.structure_name, selectedCW, mixcodes),
    )
  }, [structures, selectedCW, mixcodes])

  /** Mixcode: intersect กับ Concrete Work แล้วจึงกรองตามโครงสร้างที่เลือก */
  const filteredMixcodes = useMemo(() => {
    if (!selectedCW) return mixcodes
    return mixcodes.filter((m) => {
      if (!structureListsIntersect(m.structure_list, selectedCW.structure_list)) return false
      if (!selectedStructure) return true
      const allowed = parseStructureListTokens(m.structure_list)
      if (allowed.length === 0) return true
      return allowed.includes(selectedStructure.structure_name)
    })
  }, [mixcodes, selectedCW, selectedStructure])

  useEffect(() => {
    const cur = getValues('mixcode_id')
    if (!cur) return
    if (!filteredMixcodes.some((m) => String(m.id) === cur)) {
      setValue('mixcode_id', '')
    }
  }, [filteredMixcodes, getValues, setValue])

  useEffect(() => {
    const cur = getValues('structure_id')
    if (!cur) return
    if (!filteredStructures.some((s) => String(s.id) === cur)) {
      setValue('structure_id', '')
    }
  }, [filteredStructures, getValues, setValue])

  useEffect(() => {
    const cloneId = (location.state as { cloneFromRequestId?: string } | null)?.cloneFromRequestId?.trim()
    if (!cloneId || !user?.id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('Request')
        .select(`
          id,
          status_id,
          booked_by,
          client_id,
          location_id,
          concrete_work_id,
          structure_id,
          structure_no,
          abc_code_id,
          wbs_code_id,
          casting_date,
          request_time,
          mixcode_id,
          volume_request,
          volume_dwg,
          sample_qty,
          remarks,
          before_image
        `)
        .eq('id', cloneId)
        .single()

      if (cancelled) return
      if (error || !data) {
        toast.error('โหลดข้อมูลคำขอเดิมไม่สำเร็จ')
        navigate('/requests/new', { replace: true, state: {} })
        return
      }
      if (data.booked_by !== user.id) {
        toast.error('ใช้ได้เฉพาะคำขอที่คุณจองไว้')
        navigate('/requests/new', { replace: true, state: {} })
        return
      }
      if (data.status_id !== 6 && data.status_id !== 7) {
        toast.error('สร้างซ้ำได้เฉพาะคำขอที่ Reject หรือยกเลิกแล้ว')
        navigate('/requests/new', { replace: true, state: {} })
        return
      }

      reset({
        client_id: data.client_id != null ? String(data.client_id) : '',
        location_id: data.location_id != null ? String(data.location_id) : '',
        concrete_work_id: data.concrete_work_id != null ? String(data.concrete_work_id) : '',
        structure_id: data.structure_id != null ? String(data.structure_id) : '',
        structure_no: data.structure_no ?? '',
        abc_code_id: data.abc_code_id != null ? String(data.abc_code_id) : '',
        wbs_code_id: data.wbs_code_id != null ? String(data.wbs_code_id) : '',
        casting_date: (data.casting_date && String(data.casting_date).trim()) || dateInputYYYYMMDDLocal(2),
        request_time: requestTimeToInputValue(data.request_time),
        mixcode_id: data.mixcode_id != null ? String(data.mixcode_id) : '',
        volume_request: data.volume_request != null ? String(data.volume_request) : '',
        volume_dwg: data.volume_dwg != null ? String(data.volume_dwg) : '',
        sample_qty: data.sample_qty != null ? String(data.sample_qty) : '',
        remarks: data.remarks ?? '',
        before_image: '',
      })
      setBeforeImage(data.before_image?.trim() || null)
      navigate('/requests/new', { replace: true, state: {} })
      toast.success('นำข้อมูลจากคำขอเดิมมาแล้ว โปรดตรวจสอบและอัปเดตวันเทก่อนส่ง')
    })()
    return () => {
      cancelled = true
    }
  }, [location.state, user?.id, reset, navigate])

  async function onSubmit(data: FormData) {
    if (step !== 2 || !user || submitLockRef.current) return
    submitLockRef.current = true
    setSubmitting(true)
    try {
      const { data: req, error } = await supabase.from('Request').insert({
        status_id: 1,
        booked_by: user.id,
        booked_at: new Date().toISOString(),
        request_date: new Date().toISOString().split('T')[0],
        client_id: parseInt(data.client_id),
        location_id: parseInt(data.location_id),
        concrete_work_id: parseInt(data.concrete_work_id),
        structure_id: parseInt(data.structure_id),
        structure_no: data.structure_no || null,
        abc_code_id: data.abc_code_id ? parseInt(data.abc_code_id) : null,
        wbs_code_id: data.wbs_code_id ? parseInt(data.wbs_code_id) : null,
        casting_date: data.casting_date,
        request_time: data.request_time,
        mixcode_id: parseInt(data.mixcode_id),
        volume_request: data.volume_request ? parseFloat(data.volume_request) : null,
        volume_dwg: data.volume_dwg ? parseFloat(data.volume_dwg) : null,
        sample_qty: data.sample_qty ? parseInt(data.sample_qty) : null,
        remarks: data.remarks || null,
        before_image: beforeImage,
      }).select().single()

      if (error || !req) {
        toast.error('เกิดข้อผิดพลาด')
        return
      }

      const { error: logErr } = await ensureBookedRequestLog(req.id, user.id)
      if (logErr) {
        toast.error('บันทึกประวัติไม่สำเร็จ')
        return
      }

      toast.success('ส่งคำขอเรียบร้อย')
      navigate(`/requests/${req.id}`)
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const nextStep = async () => {
    const vals = getValues()
    const step1Fields: Array<keyof FormData> = ['client_id', 'location_id', 'concrete_work_id', 'structure_id']
    const step2Fields: Array<keyof FormData> = ['casting_date', 'request_time', 'mixcode_id', 'volume_request']
    const fieldsToCheck = step === 0 ? step1Fields : step2Fields
    const hasErrors = fieldsToCheck.some((f) => !vals[f])
    if (!hasErrors) setStep(step + 1)
    else toast.error('กรุณากรอกข้อมูลให้ครบ')
  }

  const stepFields = (s: number) => {
    if (s === 0) return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Client *</Label>
          <Controller name="client_id" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก Client" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.client_id && <p className="text-xs text-rose-600">{errors.client_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Location *</Label>
          <Controller name="location_id" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก Location" /></SelectTrigger>
              <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.full_location ?? l.location1}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.location_id && <p className="text-xs text-rose-600">{errors.location_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Concrete Work *</Label>
          <Controller name="concrete_work_id" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('structure_id', '') }}>
              <SelectTrigger><SelectValue placeholder="เลือก Concrete Work" /></SelectTrigger>
              <SelectContent>{concreteWorks.map((cw) => <SelectItem key={cw.id} value={String(cw.id)}>{cw.concrete_work}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.concrete_work_id && <p className="text-xs text-rose-600">{errors.concrete_work_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Structure *</Label>
            <Controller name="structure_id" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="เลือก Structure" /></SelectTrigger>
                <SelectContent>{filteredStructures.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.structure_name}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.structure_id && <p className="text-xs text-rose-600">{errors.structure_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Structure No.</Label>
            <Input placeholder="C-001" {...register('structure_no')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>ABC Code</Label>
          <Controller name="abc_code_id" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก ABC Code" /></SelectTrigger>
              <SelectContent>{abcCodes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_abc}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>WBS Code</Label>
          <Controller name="wbs_code_id" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก WBS Code" /></SelectTrigger>
              <SelectContent>{wbsCodes.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.full_wbs}</SelectItem>)}</SelectContent>
            </Select>
          )} />
        </div>
      </div>
    )

    if (s === 1) return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>วันเท *</Label>
            <Input type="date" {...register('casting_date')} />
            {errors.casting_date && <p className="text-xs text-rose-600">{errors.casting_date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>เวลา *</Label>
            <Input type="time" {...register('request_time')} />
            {errors.request_time && <p className="text-xs text-rose-600">{errors.request_time.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Mixcode *</Label>
          <Controller
            name="mixcode_id"
            control={control}
            render={({ field }) => (
              <MixcodePicker
                value={field.value}
                onChange={field.onChange}
                mixcodes={filteredMixcodes}
                emptyMessage={
                  mixcodes.length > 0 && filteredMixcodes.length === 0
                    ? 'ไม่มี Mixcode ที่ตรงกับงานคอนกรีตและโครงสร้างที่เลือก'
                    : undefined
                }
              />
            )}
          />
          {errors.mixcode_id && <p className="text-xs text-rose-600">{errors.mixcode_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>DWG volume (cu.m)</Label>
            <Input type="number" step="0.01" {...register('volume_dwg')} />
          </div>
          <div className="space-y-1.5">
            <Label>Request Volume (cu.m) *</Label>
            <Input type="number" step="0.01" {...register('volume_request')} />
            {errors.volume_request && <p className="text-xs text-rose-600">{errors.volume_request.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>จำนวนตัวอย่าง (ก้อน)</Label>
          <Input type="number" {...register('sample_qty')} />
        </div>

        <div className="space-y-1.5">
          <Label>หมายเหตุ</Label>
          <Textarea rows={3} {...register('remarks')} />
        </div>
      </div>
    )

    const vals = getValues()
    const client = clients.find((c) => String(c.id) === vals.client_id)
    const location = locations.find((l) => String(l.id) === vals.location_id)
    const structure = structures.find((s) => String(s.id) === vals.structure_id)
    const mixcode = mixcodes.find((m) => String(m.id) === vals.mixcode_id)

    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>รูปก่อนเท</Label>
          <ImageUpload value={beforeImage ?? undefined} onChange={(url) => setBeforeImage(url)} folder="before" />
        </div>

        <Card className={rq.cardMuted}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>สรุปข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.cardContent, 'space-y-1.5 text-sm')}>
            {[
              ['Client', client?.client_name],
              ['Location', location?.full_location ?? location?.location1],
              ['Structure', `${structure?.structure_name ?? '-'} ${vals.structure_no ? `(${vals.structure_no})` : ''}`],
              ['วันเท', formatDate(vals.casting_date)],
              ['เวลา', vals.request_time],
              ['Mixcode', mixcode?.mixcode],
              ['Request Volume (cu.m)', vals.volume_request ? `${vals.volume_request} cu.m` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className={cn('w-24 shrink-0', rq.label)}>{label}</span>
                <span className={cn('min-w-0', rq.value)}>{value ?? '-'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={rq.pageNarrow}>
      <RequestScreenHeader
        title="สร้างคำขอใหม่"
        subtitle={`ขั้นตอนที่ ${step + 1} จาก ${STEPS.length}`}
        onBack={() => navigate(-1)}
      />

      <div className="flex gap-0 rounded-2xl border border-[#e2e6ec] bg-white/80 px-2 py-3 shadow-sm shadow-black/[0.04] ring-1 ring-white/70 md:px-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 items-center">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold md:h-7 md:w-7 md:text-xs',
                i <= step ? rq.stepActive : rq.stepIdle,
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                'ml-1 truncate text-[10px] md:ml-1.5 md:text-xs',
                i === step ? 'font-semibold text-[#111827]' : 'text-[#9ca3af]',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn('mx-1 h-px flex-1 rounded-full md:mx-2 md:h-0.5', i < step ? rq.stepLineDone : rq.stepLineTodo)}
              />
            )}
          </div>
        ))}
      </div>

      <Card className={rq.card}>
        <CardContent className={rq.cardContent}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {stepFields(step)}

            <div className="mt-8 flex justify-between gap-2 border-t border-[#e2e6ec]/80 pt-5">
              {step > 0 ? (
                <Button type="button" variant="outline" className="rounded-xl border-[#e2e6ec]" onClick={() => setStep(step - 1)}>
                  ย้อนกลับ
                </Button>
              ) : (
                <Button type="button" variant="outline" className="rounded-xl border-[#e2e6ec]" onClick={() => navigate(APP_HOME)}>
                  ยกเลิก
                </Button>
              )}
              {step < 2 ? (
                <Button type="button" className="rounded-xl shadow-md shadow-blue-500/25" onClick={nextStep}>
                  ถัดไป
                </Button>
              ) : (
                <Button
                  type="button"
                  className="rounded-xl shadow-md shadow-blue-500/25"
                  disabled={submitting}
                  onClick={() => { void handleSubmit(onSubmit)() }}
                >
                  {submitting ? 'กำลังส่ง...' : 'ยืนยันการขอ'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

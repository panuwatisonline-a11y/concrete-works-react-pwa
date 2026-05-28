import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useForm, Controller, useWatch, type ControllerRenderProps, type UseFormTrigger } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { runOrQueueMutation } from '@/lib/offline/actions'
import { cacheRequestDetail } from '@/lib/offline/cache'
import { runCreateRequestMutation } from '@/lib/requestMutations'
import { fetchScopedRowById, insertJobIdFromAuth } from '@/lib/jobScopeQueries'
import type { RequestWithRelations } from '@/types/app.types'
import { useAuthStore } from '@/stores/authStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect, mapSearchableOptions } from '@/components/ui/searchable-select'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatDate, cn, formatVolumeCuM } from '@/lib/utils'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { markLocalRequestMutation, triggerRequestPushNotify } from '@/lib/requestPushNotify'
import { APP_HOME } from '@/lib/appHome'
import { canBookConcrete } from '@/lib/permissions'
import { structureHasCompatibleMixcode } from '@/lib/structureListTokens'
import { validateMixcodeForBooking } from '@/lib/mixcodeBookingFilter'
import { deleteStoredImage } from '@/lib/imageUpload'
import { useBookingMixcodePicker } from '@/hooks/useBookingMixcodePicker'
import { layout, rq } from '@/lib/requestUi'
import { scrollToFirstInvalidFormField } from '@/lib/formScrollToError'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import { RequireStrengthSelect } from '@/components/requests/RequireStrengthSelect'
import {
  listMixcodeStrengthOptions,
  mixcodeStrengthLabelForOptionValue,
  mixcodeStrengthOptionValueForStoredStrength,
  parseMixcodeStrengthOptionValue,
  DWG_STRENGTH_FIELD_LABEL,
  DWG_STRENGTH_REQUIRED_MESSAGE,
} from '@/lib/mixcodeStrengthOptions'

const schema = z.object({
  client_id: z.string().min(1, 'กรุณาเลือก User Group'),
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
  strength: z.string().min(1, DWG_STRENGTH_REQUIRED_MESSAGE),
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

const STEP_VALIDATE_FIELDS: Record<number, Array<keyof FormData>> = {
  0: ['client_id', 'concrete_work_id', 'structure_id', 'location_id'],
  1: ['casting_date', 'request_time', 'strength', 'mixcode_id', 'volume_request'],
}

function fieldWrapClass(message?: string) {
  return cn(
    'space-y-1.5 rounded-xl transition-shadow',
    message && 'ring-2 ring-rose-500/35 ring-offset-2 ring-offset-[color:var(--pour-bg)]',
  )
}

function withFieldRevalidate<TFieldName extends keyof FormData>(
  name: TFieldName,
  field: ControllerRenderProps<FormData, TFieldName>,
  trigger: UseFormTrigger<FormData>,
  extra?: (value: FormData[TFieldName]) => void,
) {
  return (value: FormData[TFieldName]) => {
    extra?.(value)
    field.onChange(value)
    queueMicrotask(() => {
      void trigger(name)
    })
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p data-field-error className="text-xs text-rose-600">{message}</p>
}

const STEP_BAR_SHELL = cn(
  'pour-contain w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] px-3 py-3 shadow-sm shadow-black/[0.04] ring-1 ring-inset ring-white/70',
)

function RequestStepCircle({ index, step }: { index: number; step: number }) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center justify-self-center rounded-full text-xs font-bold',
        index <= step ? rq.stepActive : rq.stepIdle,
      )}
    >
      {index + 1}
    </div>
  )
}

function RequestStepConnector({ done, className }: { done: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'h-0.5 min-h-0 min-w-0 self-center rounded-full',
        done ? rq.stepLineDone : rq.stepLineTodo,
        className,
      )}
      aria-hidden
    />
  )
}

/** มือถือ/iOS: grid ตัวเลข+เส้น · เดสก์ท็อป+เมาส์: แถบพร้อมชื่อขั้นตอน */
function RequestNewStepBar({ step }: { step: number }) {
  return (
    <>
      <div
        className={cn(STEP_BAR_SHELL, 'grid items-center gap-x-2 pour-pointer-fine:hidden')}
        style={{ gridTemplateColumns: '1.75rem minmax(0,1fr) 1.75rem minmax(0,1fr) 1.75rem' }}
        aria-label="ขั้นตอน"
      >
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <RequestStepCircle index={i} step={step} />
            {i < STEPS.length - 1 ? <RequestStepConnector done={i < step} className="w-full" /> : null}
          </Fragment>
        ))}
      </div>

      <div className={cn(STEP_BAR_SHELL, 'hidden gap-0 pour-pointer-fine:flex')} aria-label="ขั้นตอน">
        {STEPS.map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 basis-0 items-center overflow-hidden">
            <RequestStepCircle index={i} step={step} />
            <span
              className={cn(
                'ml-2 min-w-0 flex-1 basis-0 truncate text-xs leading-tight',
                i === step ? 'font-semibold text-[color:var(--pour-ink-0)]' : 'text-pour-subtle',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <RequestStepConnector done={i < step} className="mx-2 min-w-4 flex-1" />
            ) : null}
          </div>
        ))}
      </div>
    </>
  )
}

export function RequestNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, role } = useAuthStore()
  const { clients, locations, concreteWorks, structures, mixcodes, abcCodes, wbsCodes, statuses } =
    useMasterDataStore()
  const [step, setStep] = useState(0)
  const [showStepErrors, setShowStepErrors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)
  const submittedRef = useRef(false)
  const beforeImageRef = useRef<string | null>(null)
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [beforeImageUploading, setBeforeImageUploading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  beforeImageRef.current = beforeImage

  useEffect(() => {
    return () => {
      if (!submittedRef.current && beforeImageRef.current?.trim()) {
        deleteStoredImage(beforeImageRef.current)
      }
    }
  }, [])

  const { control, register, handleSubmit, watch, setValue, getValues, reset, trigger, clearErrors, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    reValidateMode: 'onChange',
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
      strength: '',
      volume_dwg: '',
      sample_qty: '',
      remarks: '',
      before_image: '',
    },
  })

  const watchConcreteWork = watch('concrete_work_id')
  const watchStructureId = watch('structure_id')
  const watchStrength = useWatch({ control, name: 'strength', defaultValue: '' })
  const selectedCW = concreteWorks.find((cw) => String(cw.id) === watchConcreteWork)
  const selectedStructure = structures.find((s) => String(s.id) === watchStructureId)

  const filteredStructures = useMemo(() => {
    if (!selectedCW) return structures
    return structures.filter((s) =>
      structureHasCompatibleMixcode(s.structure_name, selectedCW, mixcodes),
    )
  }, [structures, selectedCW, mixcodes])

  const {
    scopeMixcodes,
    pickerMixcodes,
    mixcodePickerLocked,
    pickerEmptyMessage,
  } = useBookingMixcodePicker({
    mixcodes,
    concreteWork: selectedCW,
    structure: selectedStructure,
    dwgStrengthOption: watchStrength,
    getMixcodeId: () => getValues('mixcode_id'),
    setMixcodeId: (id) => setValue('mixcode_id', id),
    scopeEmptyMessage: 'ไม่มี Mixcode ที่ตรงกับงานคอนกรีตและโครงสร้างที่เลือก',
  })

  useEffect(() => {
    const cur = getValues('strength')
    if (!cur) return
    const opts = listMixcodeStrengthOptions(scopeMixcodes)
    if (!opts.some((o) => o.value === cur)) setValue('strength', '')
  }, [scopeMixcodes, getValues, setValue])

  useEffect(() => {
    const cur = getValues('structure_id')
    if (!cur) return
    if (!filteredStructures.some((s) => String(s.id) === cur)) {
      setValue('structure_id', '', { shouldValidate: false })
      clearErrors('structure_id')
    }
  }, [filteredStructures, getValues, setValue, clearErrors])

  useEffect(() => {
    const cloneId = (location.state as { cloneFromRequestId?: string } | null)?.cloneFromRequestId?.trim()
    if (!cloneId || !user?.id) return
    let cancelled = false
    void (async () => {
      const { data, error } = await fetchScopedRowById<{
        id: string
        status_id: number
        booked_by: string | null
        client_id: number | null
        location_id: number | null
        concrete_work_id: number | null
        structure_id: number | null
        structure_no: string | null
        abc_code_id: number | null
        wbs_code_id: number | null
        casting_date: string | null
        request_time: string | null
        mixcode_id: number | null
        volume_request: number | null
        strength: number | null
        volume_dwg: number | null
        sample_qty: number | null
        remarks: string | null
        before_image: string | null
      }>('Request', cloneId, `
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
          strength,
          volume_dwg,
          sample_qty,
          remarks,
          before_image
        `)

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
        strength: mixcodeStrengthOptionValueForStoredStrength(data.strength, mixcodes),
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
  }, [location.state, user?.id, reset, navigate, mixcodes])

  async function onSubmit(data: FormData) {
    if (step !== 2 || !user || submitLockRef.current) return
    const mixErr = validateMixcodeForBooking(data.mixcode_id, mixcodes, data.strength)
    if (mixErr) {
      toast.error(mixErr)
      return
    }
    submitLockRef.current = true
    setSubmitting(true)
    try {
      const requestId = crypto.randomUUID()
      const row = {
        id: requestId,
        status_id: 1,
        job_id: insertJobIdFromAuth(),
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
        strength: parseMixcodeStrengthOptionValue(data.strength),
        volume_dwg: data.volume_dwg ? parseFloat(data.volume_dwg) : null,
        sample_qty: data.sample_qty ? parseInt(data.sample_qty) : null,
        remarks: data.remarks || null,
        before_image: beforeImage,
      }

      const ok = await runOrQueueMutation({
        kind: 'create_request',
        requestId,
        userId: user.id,
        payload: { requestId, row },
        online: async () => {
          markLocalRequestMutation(requestId)
          const r = await runCreateRequestMutation(user.id, { requestId, row })
          if (!r.ok) {
            toast.error(r.message || 'เกิดข้อผิดพลาด')
            return false
          }
          const id = r.requestId ?? requestId
          toast.success('ส่งคำขอเรียบร้อย')
          await notifyRequestListChanged()
          triggerRequestPushNotify({ requestId: id, eventType: 'INSERT', actorUserId: user.id })
          navigate(`/requests/${id}`)
          return true
        },
        queuedMessage: 'บันทึกคำขอในคิว — จะส่งเมื่อเชื่อมต่อได้',
      })

      if (!ok) return

      submittedRef.current = true

      const client = clients.find((c) => c.id === row.client_id)
      const location = locations.find((l) => l.id === row.location_id)
      const cw = concreteWorks.find((c) => c.id === row.concrete_work_id)
      const structure = structures.find((s) => s.id === row.structure_id)
      const mixcode = mixcodes.find((m) => m.id === row.mixcode_id)
      const optimistic = {
        ...row,
        status: statuses.find((s) => s.id === 1),
        client: client ? { id: client.id, client_name: client.client_name } : undefined,
        location: location
          ? { id: location.id, full_location: location.full_location, location1: location.location1 }
          : undefined,
        concrete_work: cw ? { id: cw.id, concrete_work: cw.concrete_work } : undefined,
        structure: structure ? { id: structure.id, structure_name: structure.structure_name } : undefined,
        mixcode: mixcode
          ? {
              id: mixcode.id,
              mixcode: mixcode.mixcode,
              strength: mixcode.strength,
              slump: mixcode.slump,
              strength_type: mixcode.strength_type,
              supplier: mixcode.supplier,
            }
          : undefined,
        booked_by_profile: {
          id: user.id,
          fname: profile?.fname ?? null,
          lname: profile?.lname ?? null,
          employee_id: profile?.employee_id ?? null,
          phone: profile?.phone ?? null,
          role: profile?.role ?? 'user',
          status: profile?.status ?? 'approved',
          client_id: profile?.client_id ?? null,
          client_name: profile?.client_name ?? null,
          job_id: profile?.job_id ?? null,
          inspector_id: profile?.inspector_id ?? null,
          created_at: profile?.created_at ?? '',
        },
      } as RequestWithRelations

      await cacheRequestDetail(requestId, optimistic, [], [])
      await notifyRequestListChanged()
      navigate(`/requests/${requestId}`)
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fieldsToCheck = STEP_VALIDATE_FIELDS[step]
    if (!fieldsToCheck) return
    const ok = await trigger(fieldsToCheck)
    if (ok) {
      setShowStepErrors(false)
      setStep(step + 1)
      return
    }
    setShowStepErrors(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const msg = scrollToFirstInvalidFormField(fieldsToCheck, formRef.current)
        toast.error(msg ?? 'กรุณากรอกข้อมูลให้ครบ')
      })
    })
  }

  const visibleFieldError = (name: keyof FormData) =>
    showStepErrors ? errors[name]?.message : undefined

  const stepFields = (s: number) => {
    if (s === 0) return (
      <div className="space-y-4">
        <div data-form-field="client_id" className={fieldWrapClass(visibleFieldError('client_id'))}>
          <Label>User Group *</Label>
          <Controller name="client_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={withFieldRevalidate('client_id', field, trigger)}
              placeholder="เลือก User Group"
              aria-invalid={Boolean(visibleFieldError('client_id'))}
              options={mapSearchableOptions(clients, (c) => String(c.id), (c) => c.client_name)}
            />
          )} />
          <FieldError message={visibleFieldError('client_id')} />
        </div>

        <div className="space-y-1.5">
          <Label>ABC Code</Label>
          <Controller name="abc_code_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="เลือก ABC Code"
              options={mapSearchableOptions(abcCodes, (c) => String(c.id), (c) => c.full_abc ?? '')}
            />
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>WBS Code</Label>
          <Controller name="wbs_code_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value ?? ''}
              onValueChange={field.onChange}
              placeholder="เลือก WBS Code"
              options={mapSearchableOptions(wbsCodes, (w) => String(w.id), (w) => w.full_wbs ?? '')}
            />
          )} />
        </div>

        <div data-form-field="concrete_work_id" className={fieldWrapClass(visibleFieldError('concrete_work_id'))}>
          <Label>Concrete Work *</Label>
          <Controller name="concrete_work_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={withFieldRevalidate('concrete_work_id', field, trigger, () => {
                setValue('structure_id', '', { shouldValidate: false })
                clearErrors('structure_id')
              })}
              placeholder="เลือก Concrete Work"
              aria-invalid={Boolean(visibleFieldError('concrete_work_id'))}
              options={mapSearchableOptions(concreteWorks, (cw) => String(cw.id), (cw) => cw.concrete_work)}
            />
          )} />
          <FieldError message={visibleFieldError('concrete_work_id')} />
        </div>

        <div data-form-field="structure_id" className={fieldWrapClass(visibleFieldError('structure_id'))}>
          <Label>Structure *</Label>
          <Controller name="structure_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={withFieldRevalidate('structure_id', field, trigger)}
              placeholder="เลือก Structure"
              aria-invalid={Boolean(visibleFieldError('structure_id'))}
              options={mapSearchableOptions(filteredStructures, (s) => String(s.id), (s) => s.structure_name)}
            />
          )} />
          <FieldError message={visibleFieldError('structure_id')} />
        </div>

        <div data-form-field="location_id" className={fieldWrapClass(visibleFieldError('location_id'))}>
          <Label>Location *</Label>
          <Controller name="location_id" control={control} render={({ field }) => (
            <SearchableSelect
              value={field.value}
              onValueChange={withFieldRevalidate('location_id', field, trigger)}
              placeholder="เลือก Location"
              aria-invalid={Boolean(visibleFieldError('location_id'))}
              options={mapSearchableOptions(
                locations,
                (l) => String(l.id),
                (l) => l.full_location ?? l.location1,
              )}
            />
          )} />
          <FieldError message={visibleFieldError('location_id')} />
        </div>

        <div className="space-y-1.5">
          <Label>Structure No.</Label>
          <Input placeholder="C-001" {...register('structure_no')} />
        </div>
      </div>
    )

    if (s === 1) return (
      <div className="space-y-4">
        <div className={layout.formGrid2}>
          <div data-form-field="casting_date" className={fieldWrapClass(visibleFieldError('casting_date'))}>
            <Label>วันเท *</Label>
            <Input type="date" aria-invalid={Boolean(visibleFieldError('casting_date'))} {...register('casting_date', { onChange: () => { void trigger('casting_date') } })} />
            <FieldError message={visibleFieldError('casting_date')} />
          </div>
          <div data-form-field="request_time" className={fieldWrapClass(visibleFieldError('request_time'))}>
            <Label>เวลา *</Label>
            <Input type="time" aria-invalid={Boolean(visibleFieldError('request_time'))} {...register('request_time', { onChange: () => { void trigger('request_time') } })} />
            <FieldError message={visibleFieldError('request_time')} />
          </div>
        </div>

        <div data-form-field="strength" className={fieldWrapClass(visibleFieldError('strength'))}>
          <Label>{DWG_STRENGTH_FIELD_LABEL} *</Label>
          <Controller
            name="strength"
            control={control}
            render={({ field }) => (
              <RequireStrengthSelect value={field.value} onChange={withFieldRevalidate('strength', field, trigger)} mixcodes={scopeMixcodes} />
            )}
          />
          <FieldError message={visibleFieldError('strength')} />
        </div>

        <div data-form-field="mixcode_id" className={fieldWrapClass(visibleFieldError('mixcode_id'))}>
          <Label>Mixcode *</Label>
          <Controller
            name="mixcode_id"
            control={control}
            render={({ field }) => (
              <MixcodePicker
                value={field.value}
                onChange={withFieldRevalidate('mixcode_id', field, trigger)}
                mixcodes={pickerMixcodes}
                disabled={mixcodePickerLocked}
                dwgStrengthOption={watchStrength}
                emptyMessage={pickerEmptyMessage}
              />
            )}
          />
          <FieldError message={visibleFieldError('mixcode_id')} />
        </div>

        <div className={layout.formGrid2}>
          <div className="space-y-1.5">
            <Label>DWG volume (cu.m)</Label>
            <Input type="number" step="0.01" {...register('volume_dwg')} />
          </div>
          <div data-form-field="volume_request" className={fieldWrapClass(visibleFieldError('volume_request'))}>
            <Label>Request Volume (cu.m) *</Label>
            <Input type="number" step="0.01" aria-invalid={Boolean(visibleFieldError('volume_request'))} {...register('volume_request', { onChange: () => { void trigger('volume_request') } })} />
            <FieldError message={visibleFieldError('volume_request')} />
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
          <ImageUpload
            value={beforeImage ?? undefined}
            onChange={(url) => setBeforeImage(url)}
            onUploadingChange={setBeforeImageUploading}
            folder="before"
          />
        </div>

        <Card className={rq.cardMutedForm}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>สรุปข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.cardContent, 'space-y-1.5 text-sm')}>
            {[
              ['User Group', client?.client_name],
              ['Location', location?.full_location ?? location?.location1],
              ['Structure', `${structure?.structure_name ?? '-'} ${vals.structure_no ? `(${vals.structure_no})` : ''}`],
              ['วันเท', formatDate(vals.casting_date)],
              ['เวลา', vals.request_time],
              ['Mixcode', mixcode?.mixcode],
              [DWG_STRENGTH_FIELD_LABEL, mixcodeStrengthLabelForOptionValue(vals.strength, mixcodes)],
              ['Request Volume (cu.m)', formatVolumeCuM(vals.volume_request)],
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

  if (!canBookConcrete(role)) {
    return <Navigate to={APP_HOME} replace />
  }

  return (
    <div className={rq.page}>
      <RequestScreenHeader
        title="สร้างคำขอใหม่"
        subtitle={`${STEPS[step]} · ขั้นตอนที่ ${step + 1}/${STEPS.length}`}
        onBack={() => navigate(-1)}
      />

      <RequestNewStepBar step={step} />

      <Card className={rq.cardForm}>
        <CardContent className={rq.cardContent}>
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className={cn(
              'pour-form-fields',
              'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pour-pointer-fine:pb-0',
            )}
          >
            {stepFields(step)}
          </form>

          <div
            className={cn(
              'flex justify-between gap-2 border-t border-[color:var(--pour-surface-border)]/80',
              'fixed inset-x-0 bottom-0 z-30 bg-[color:var(--pour-bg)]/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm',
              'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]',
              'pour-pointer-fine:static pour-pointer-fine:z-auto pour-pointer-fine:mt-8 pour-pointer-fine:border-t pour-pointer-fine:bg-transparent pour-pointer-fine:px-0 pour-pointer-fine:py-0 pour-pointer-fine:pt-5 pour-pointer-fine:shadow-none pour-pointer-fine:backdrop-blur-none',
            )}
          >
            {step > 0 ? (
              <Button type="button" variant="outline" className="rounded-xl border-[color:var(--pour-surface-border)]" onClick={() => { setShowStepErrors(false); setStep(step - 1) }}>
                ย้อนกลับ
              </Button>
            ) : (
              <Button type="button" variant="outline" className="rounded-xl border-[color:var(--pour-surface-border)]" onClick={() => navigate(APP_HOME)}>
                ยกเลิก
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" className="rounded-xl shadow-md shadow-[color:var(--pour-accent)]/20" onClick={nextStep}>
                ถัดไป
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl shadow-md shadow-[color:var(--pour-accent)]/20"
                disabled={submitting || beforeImageUploading}
                onClick={() => { void handleSubmit(onSubmit)() }}
              >
                {submitting ? 'กำลังส่ง...' : 'ยืนยันการขอ'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

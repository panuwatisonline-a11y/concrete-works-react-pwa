import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDataSyncOnTables } from '@/hooks/useDataSyncOnTables'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { runOrQueueMutation } from '@/lib/offline/actions'
import { runUpdateRequestMutation } from '@/lib/requestMutations'
import { fetchScopedRowById } from '@/lib/jobScopeQueries'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { PageLoadError } from '@/components/shared/PageLoadError'
import { PageLoadingStatus } from '@/components/shared/PageLoadingStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { cn } from '@/lib/utils'
import { fieldWrapClass, FieldErrorMessage } from '@/lib/formFieldUi'
import { layout, rq } from '@/lib/requestUi'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import { RequireStrengthSelect } from '@/components/requests/RequireStrengthSelect'
import {
  listMixcodeStrengthOptions,
  mixcodeStrengthOptionValueForStoredStrength,
  parseMixcodeStrengthOptionValue,
  DWG_STRENGTH_FIELD_LABEL,
  DWG_STRENGTH_REQUIRED_MESSAGE,
} from '@/lib/mixcodeStrengthOptions'
import { validateMixcodeForBooking } from '@/lib/mixcodeBookingFilter'
import { useBookingMixcodePicker } from '@/hooks/useBookingMixcodePicker'
import { purgeOrphanUploadedImage } from '@/lib/requestImageCleanup'
import type { Request } from '@/types/app.types'

const schema = z.object({
  casting_date: z.string().min(1, 'กรุณาเลือกวันเท'),
  request_time: z.string().min(1, 'กรุณาระบุเวลา'),
  mixcode_id: z.string().min(1, 'กรุณาเลือก Mixcode'),
  volume_request: z.string().min(1, 'กรุณาระบุ Request Volume (cu.m)'),
  strength: z.string().min(1, DWG_STRENGTH_REQUIRED_MESSAGE),
  volume_dwg: z.string().optional(),
  sample_qty: z.string().optional(),
  remarks: z.string().optional(),
  structure_no: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const EDIT_PREFIX = 'request-edit'

function editFieldId(name: keyof FormData) {
  return `${EDIT_PREFIX}-${name}`
}

function editErrorId(name: keyof FormData) {
  return `${EDIT_PREFIX}-${name}-error`
}

function editLabelId(name: keyof FormData) {
  return `${EDIT_PREFIX}-${name}-label`
}

function editFieldA11y(name: keyof FormData, message?: string) {
  const errorId = editErrorId(name)
  return {
    fieldId: editFieldId(name),
    labelId: editLabelId(name),
    errorId,
    describedBy: message ? errorId : undefined,
    invalid: Boolean(message),
  }
}

export function RequestEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { filter, setFilter } = useFilterStore()
  const { mixcodes, concreteWorks, structures } = useMasterDataStore()
  const [request, setRequest] = useState<Request | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const requestRef = useRef<Request | null>(null)
  const beforeImageRef = useRef<string | null>(null)
  requestRef.current = request
  beforeImageRef.current = beforeImage

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchStrength = watch('strength')
  const selectedCW = useMemo(
    () => concreteWorks.find((cw) => cw.id === request?.concrete_work_id),
    [concreteWorks, request?.concrete_work_id],
  )
  const selectedStructure = useMemo(
    () => structures.find((s) => s.id === request?.structure_id),
    [structures, request?.structure_id],
  )

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
    scopeEmptyMessage: 'ไม่มี Mixcode ที่ตรงกับงานคอนกรีตและโครงสร้างของรายการนี้',
  })

  useEffect(() => {
    const cur = getValues('strength')
    if (!cur) return
    const opts = listMixcodeStrengthOptions(scopeMixcodes)
    if (!opts.some((o) => o.value === cur)) setValue('strength', '')
  }, [scopeMixcodes, getValues, setValue])

  useDesktopSearchRegistration({
    placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const loadRequest = useCallback(async () => {
    if (!id) {
      setLoadError('ไม่พบรหัสคำขอ')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await fetchScopedRowById<Request>('Request', id, '*')
      if (error) throw new Error(error.message)
      if (!data) throw new Error('ไม่พบข้อมูลคำขอ')
      const r = data
      if (r.status_id !== 1 || r.booked_by !== user?.id) {
        navigate(`/requests/${id}`, { replace: true })
        return
      }
      setRequest(r)
      setBeforeImage(r.before_image)
      reset({
        casting_date: r.casting_date ?? '',
        request_time: r.request_time ?? '',
        mixcode_id: r.mixcode_id ? String(r.mixcode_id) : '',
        volume_request: r.volume_request ? String(r.volume_request) : '',
        strength: mixcodeStrengthOptionValueForStoredStrength(r.strength, mixcodes),
        volume_dwg: r.volume_dwg ? String(r.volume_dwg) : '',
        sample_qty: r.sample_qty ? String(r.sample_qty) : '',
        remarks: r.remarks ?? '',
        structure_no: r.structure_no ?? '',
      })
    } catch (e) {
      setRequest(null)
      setLoadError(e instanceof Error ? e.message : 'โหลดคำขอไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [id, user?.id, reset, navigate, mixcodes])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  useEffect(() => {
    return () => {
      purgeOrphanUploadedImage(beforeImageRef.current, requestRef.current?.before_image)
    }
  }, [])

  useDataSyncOnTables(['Request', '*'], (detail) => {
    if (!id) return
    if (detail.table === '*' || detail.requestId == null || detail.requestId === id) {
      void loadRequest()
    }
  })

  usePullToRefreshOnLoad(loadRequest)

  async function onSubmit(data: FormData) {
    if (!id || !request) return
    const mixErr = validateMixcodeForBooking(data.mixcode_id, mixcodes, data.strength)
    if (mixErr) {
      toast.error(mixErr)
      return
    }
    setSubmitting(true)
    const patch = {
      casting_date: data.casting_date,
      request_time: data.request_time,
      mixcode_id: parseInt(data.mixcode_id),
      volume_request: parseFloat(data.volume_request),
      strength: parseMixcodeStrengthOptionValue(data.strength),
      volume_dwg: data.volume_dwg ? parseFloat(data.volume_dwg) : null,
      sample_qty: data.sample_qty ? parseInt(data.sample_qty) : null,
      remarks: data.remarks || null,
      structure_no: data.structure_no || null,
      before_image: beforeImage,
    }

    try {
      const ok = await runOrQueueMutation({
        kind: 'update_request',
        requestId: id,
        userId: user?.id ?? '',
        payload: { patch },
        online: async () => {
          const r = await runUpdateRequestMutation(id, { patch })
          if (!r.ok) {
            toast.error('เกิดข้อผิดพลาด')
            return false
          }
          toast.success('บันทึกสำเร็จ')
          await notifyRequestListChanged()
          navigate(`/requests/${id}`)
          return true
        },
      })
      if (ok) navigate(`/requests/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="แก้ไขคำขอ" onBack={() => navigate(-1)} />
        <PageLoadingStatus />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="แก้ไขคำขอ" onBack={() => navigate(-1)} />
        <PageLoadError message={loadError} onRetry={() => void loadRequest()} className="mt-4" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className={rq.page}>
        <RequestScreenHeader title="แก้ไขคำขอ" onBack={() => navigate(-1)} />
        <p className="py-16 text-center text-sm text-pour-muted">ไม่พบข้อมูล</p>
      </div>
    )
  }

  return (
    <div className={rq.page}>
      <RequestScreenHeader title="แก้ไขคำขอ" subtitle="แก้ไขได้เมื่อสถานะรอตรวจสอบเท่านั้น" onBack={() => navigate(-1)} />

      <Card className={rq.cardForm}>
        <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
          <CardTitle className={rq.cardTitle}>รายละเอียดการจอง</CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.cardContent, 'space-y-4')}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className={layout.formGrid2}>
              {(() => {
                const a11y = editFieldA11y('casting_date', errors.casting_date?.message)
                return (
                  <div data-form-field="casting_date" className={fieldWrapClass(errors.casting_date?.message)}>
                    <Label htmlFor={a11y.fieldId}>วันเท *</Label>
                    <Input
                      id={a11y.fieldId}
                      type="date"
                      aria-invalid={a11y.invalid}
                      aria-describedby={a11y.describedBy}
                      {...register('casting_date')}
                    />
                    <FieldErrorMessage id={a11y.errorId} message={errors.casting_date?.message} />
                  </div>
                )
              })()}
              {(() => {
                const a11y = editFieldA11y('request_time', errors.request_time?.message)
                return (
                  <div data-form-field="request_time" className={fieldWrapClass(errors.request_time?.message)}>
                    <Label htmlFor={a11y.fieldId}>เวลา *</Label>
                    <Input
                      id={a11y.fieldId}
                      type="time"
                      aria-invalid={a11y.invalid}
                      aria-describedby={a11y.describedBy}
                      {...register('request_time')}
                    />
                    <FieldErrorMessage id={a11y.errorId} message={errors.request_time?.message} />
                  </div>
                )
              })()}
            </div>
            {(() => {
              const a11y = editFieldA11y('strength', errors.strength?.message)
              return (
                <div data-form-field="strength" className={fieldWrapClass(errors.strength?.message)}>
                  <Label id={a11y.labelId} htmlFor={a11y.fieldId}>
                    {DWG_STRENGTH_FIELD_LABEL} *
                  </Label>
                  <Controller
                    name="strength"
                    control={control}
                    render={({ field }) => (
                      <RequireStrengthSelect
                        id={a11y.fieldId}
                        value={field.value}
                        onChange={field.onChange}
                        mixcodes={scopeMixcodes}
                        aria-invalid={a11y.invalid}
                        aria-describedby={a11y.describedBy}
                      />
                    )}
                  />
                  <FieldErrorMessage id={a11y.errorId} message={errors.strength?.message} />
                </div>
              )
            })()}
            {(() => {
              const a11y = editFieldA11y('mixcode_id', errors.mixcode_id?.message)
              return (
                <div data-form-field="mixcode_id" className={fieldWrapClass(errors.mixcode_id?.message)}>
                  <Label id={a11y.labelId} htmlFor={a11y.fieldId}>
                    Mixcode *
                  </Label>
                  <Controller
                    name="mixcode_id"
                    control={control}
                    render={({ field }) => (
                      <MixcodePicker
                        id={a11y.fieldId}
                        aria-labelledby={a11y.labelId}
                        aria-describedby={a11y.describedBy}
                        aria-invalid={a11y.invalid}
                        value={field.value}
                        onChange={field.onChange}
                        mixcodes={pickerMixcodes}
                        disabled={mixcodePickerLocked}
                        dwgStrengthOption={watchStrength}
                        emptyMessage={pickerEmptyMessage}
                      />
                    )}
                  />
                  <FieldErrorMessage id={a11y.errorId} message={errors.mixcode_id?.message} />
                </div>
              )
            })()}
            <div className={layout.formGrid2}>
              <div className="space-y-1.5">
                <Label htmlFor={editFieldId('volume_dwg')}>DWG volume (cu.m)</Label>
                <Input id={editFieldId('volume_dwg')} type="number" step="0.01" {...register('volume_dwg')} />
              </div>
              {(() => {
                const a11y = editFieldA11y('volume_request', errors.volume_request?.message)
                return (
                  <div data-form-field="volume_request" className={fieldWrapClass(errors.volume_request?.message)}>
                    <Label htmlFor={a11y.fieldId}>Request Volume (cu.m) *</Label>
                    <Input
                      id={a11y.fieldId}
                      type="number"
                      step="0.01"
                      aria-invalid={a11y.invalid}
                      aria-describedby={a11y.describedBy}
                      {...register('volume_request')}
                    />
                    <FieldErrorMessage id={a11y.errorId} message={errors.volume_request?.message} />
                  </div>
                )
              })()}
            </div>
            <div className={layout.formGrid2}>
              <div className="space-y-1.5">
                <Label htmlFor={editFieldId('structure_no')}>Structure No.</Label>
                <Input id={editFieldId('structure_no')} {...register('structure_no')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={editFieldId('sample_qty')}>จำนวนตัวอย่าง</Label>
                <Input id={editFieldId('sample_qty')} type="number" {...register('sample_qty')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={editFieldId('remarks')}>หมายเหตุ</Label>
              <Textarea id={editFieldId('remarks')} rows={3} {...register('remarks')} />
            </div>
            <div className="space-y-1.5">
              <Label id={`${EDIT_PREFIX}-before-image-label`}>รูปก่อนเท</Label>
              <ImageUpload value={beforeImage ?? undefined} onChange={(url) => setBeforeImage(url)} folder="before" />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--pour-surface-border)]/80 pt-5">
              <Button
                type="submit"
                className="rounded-xl shadow-md shadow-[color:var(--pour-accent)]/20"
                disabled={submitting}
                aria-busy={submitting}
              >
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

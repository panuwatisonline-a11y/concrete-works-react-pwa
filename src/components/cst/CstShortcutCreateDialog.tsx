import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_CONTENT_ELEVATED_Z,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import { useAuthStore } from '@/stores/authStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { createCstShortcutRequest } from '@/lib/cstShortcutCreate'
import { parseStructureListTokens, structureHasCompatibleMixcode, structureListsIntersect } from '@/lib/structureListTokens'
import { cn, formatDate, formatVolumeCuM } from '@/lib/utils'
import { layout, modal, rq } from '@/lib/requestUi'
import type { AbcCode, ClientItem, ConcreteWork, LocationItem, MixedCode, Structure, WbsCode } from '@/types/app.types'

const CST_SHORTCUT_OVERLAY = 'z-[260]'
const CST_SHORTCUT_CONTENT = cn('!z-[270]', modal.xl, modal.shell)

const schema = z.object({
  client_id: z.string().min(1, 'กรุณาเลือก Client'),
  abc_code_id: z.string().optional(),
  wbs_code_id: z.string().optional(),
  concrete_work_id: z.string().min(1, 'กรุณาเลือก Concrete Work'),
  location_id: z.string().min(1, 'กรุณาเลือก Location'),
  structure_id: z.string().min(1, 'กรุณาเลือก Structure'),
  structure_no: z.string().optional(),
  casting_date: z.string().min(1, 'กรุณาเลือกวันเท'),
  mixcode_id: z.string().min(1, 'กรุณาเลือก Mixcode'),
  volume_confirm: z.string().min(1, 'กรุณาระบุ Confirm Volume'),
})

type FormData = z.infer<typeof schema>

const STEPS = ['ข้อมูลงาน', 'ข้อมูลการเท & ยืนยัน']

function dateInputYYYYMMDDLocal(offsetDays = 0): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ShortcutStepBar({ step }: { step: number }) {
  const shell = cn(
    'pour-contain w-full min-w-0 overflow-hidden rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] px-3 py-2.5',
  )
  return (
    <>
      <ShortcutStepBarMobile step={step} shell={shell} />
      <ShortcutStepBarDesktop step={step} shell={shell} />
    </>
  )
}

function StepCircle({ index, step }: { index: number; step: number }) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        index <= step ? rq.stepActive : rq.stepIdle,
      )}
    >
      {index + 1}
    </div>
  )
}

function StepConnector({ done, className }: { done: boolean; className?: string }) {
  return (
    <div
      className={cn('h-0.5 min-h-0 min-w-0 self-center rounded-full', done ? rq.stepLineDone : rq.stepLineTodo, className)}
      aria-hidden
    />
  )
}

function ShortcutStepBarMobile({ step, shell }: { step: number; shell: string }) {
  return (
    <div
      className={cn(shell, 'grid items-center gap-x-2 pour-pointer-fine:hidden')}
      style={{ gridTemplateColumns: '1.75rem minmax(0,1fr) 1.75rem' }}
      aria-label="ขั้นตอน"
    >
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          <StepCircle index={i} step={step} />
          {i < STEPS.length - 1 ? <StepConnector done={i < step} className="w-full" /> : null}
        </Fragment>
      ))}
    </div>
  )
}

function ShortcutStepBarDesktop({ step, shell }: { step: number; shell: string }) {
  return (
    <div className={cn(shell, 'hidden gap-0 pour-pointer-fine:flex')} aria-label="ขั้นตอน">
      {STEPS.map((label, i) => (
        <div key={label} className="flex min-w-0 flex-1 basis-0 items-center overflow-hidden">
          <StepCircle index={i} step={step} />
          <span
            className={cn(
              'ml-2 min-w-0 flex-1 basis-0 truncate text-xs leading-tight',
              i === step ? 'font-semibold text-[color:var(--pour-ink-0)]' : 'text-pour-subtle',
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 ? <StepConnector done={i < step} className="mx-2 min-w-4 flex-1" /> : null}
        </div>
      ))}
    </div>
  )
}

type Step0Props = {
  control: Control<FormData>
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  clients: ClientItem[]
  abcCodes: AbcCode[]
  wbsCodes: WbsCode[]
  concreteWorks: ConcreteWork[]
  locations: LocationItem[]
  filteredStructures: Structure[]
  setValue: UseFormSetValue<FormData>
}

function CstShortcutStep0Fields({
  control,
  register,
  errors,
  clients,
  abcCodes,
  wbsCodes,
  concreteWorks,
  locations,
  filteredStructures,
  setValue,
}: Step0Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Client *</Label>
        <Controller
          name="client_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก Client" /></SelectTrigger>
              <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.client_id ? <p className="text-xs text-rose-600">{errors.client_id.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label>ABC Code</Label>
        <Controller
          name="abc_code_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก ABC Code" /></SelectTrigger>
              <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                {abcCodes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.full_abc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>WBS Code</Label>
        <Controller
          name="wbs_code_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก WBS Code" /></SelectTrigger>
              <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                {wbsCodes.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.full_wbs}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Concrete Work *</Label>
        <Controller
          name="concrete_work_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                setValue('structure_id', '')
                setValue('mixcode_id', '')
              }}
            >
              <SelectTrigger><SelectValue placeholder="เลือก Concrete Work" /></SelectTrigger>
              <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                {concreteWorks.map((cw) => (
                  <SelectItem key={cw.id} value={String(cw.id)}>{cw.concrete_work}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.concrete_work_id ? <p className="text-xs text-rose-600">{errors.concrete_work_id.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label>Location *</Label>
        <Controller
          name="location_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="เลือก Location" /></SelectTrigger>
              <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.full_location ?? l.location1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.location_id ? <p className="text-xs text-rose-600">{errors.location_id.message}</p> : null}
      </div>

      <div className={layout.formGrid2}>
        <div className="space-y-1.5">
          <Label>Structure *</Label>
          <Controller
            name="structure_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="เลือก Structure" /></SelectTrigger>
                <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                  {filteredStructures.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.structure_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.structure_id ? <p className="text-xs text-rose-600">{errors.structure_id.message}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label>Structure No.</Label>
          <Input placeholder="C-001" {...register('structure_no')} />
        </div>
      </div>
    </div>
  )
}

type Step1Props = {
  control: Control<FormData>
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  filteredMixcodes: MixedCode[]
  mixcodes: MixedCode[]
  summary: {
    client?: string
    abc?: string
    wbs?: string
    concrete?: string
    location?: string
    structure?: string
    structureNo?: string
    castingDate: string
    mixcode?: string
    volumeConfirm: string
  }
}

function CstShortcutStep1Fields({ control, register, errors, filteredMixcodes, mixcodes, summary }: Step1Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Casting date *</Label>
        <Input type="date" {...register('casting_date')} />
        {errors.casting_date ? <p className="text-xs text-rose-600">{errors.casting_date.message}</p> : null}
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
        {errors.mixcode_id ? <p className="text-xs text-rose-600">{errors.mixcode_id.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label>Confirm Volume (cu.m) *</Label>
        <Input type="number" step="0.01" {...register('volume_confirm')} />
        {errors.volume_confirm ? <p className="text-xs text-rose-600">{errors.volume_confirm.message}</p> : null}
      </div>

      <Card className={rq.cardMuted}>
        <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
          <CardTitle className={rq.cardTitle}>สรุปข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.cardContent, 'space-y-1.5 text-sm')}>
          {[
            ['Client', summary.client],
            ['ABC Code', summary.abc],
            ['WBS Code', summary.wbs],
            ['Concrete Work', summary.concrete],
            ['Location', summary.location],
            ['Structure', `${summary.structure ?? '-'}${summary.structureNo ? ` (${summary.structureNo})` : ''}`],
            ['Casting date', formatDate(summary.castingDate)],
            ['Mixcode', summary.mixcode],
            ['Confirm Volume (cu.m)', formatVolumeCuM(summary.volumeConfirm)],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className={cn('w-28 shrink-0', rq.label)}>{label}</span>
              <span className={cn('min-w-0', rq.value)}>{value ?? '-'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export type CstShortcutCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CstShortcutCreateDialog({ open, onOpenChange, onCreated }: CstShortcutCreateDialogProps) {
  const { user, profile } = useAuthStore()
  const { clients, locations, concreteWorks, structures, mixcodes, abcCodes, wbsCodes } = useMasterDataStore()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)

  const { control, register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: profile?.client_id ? String(profile.client_id) : '',
      abc_code_id: '',
      wbs_code_id: '',
      concrete_work_id: '',
      location_id: '',
      structure_id: '',
      structure_no: '',
      casting_date: dateInputYYYYMMDDLocal(0),
      mixcode_id: '',
      volume_confirm: '',
    },
  })

  useEffect(() => {
    if (!open) {
      setStep(0)
      reset({
        client_id: profile?.client_id ? String(profile.client_id) : '',
        abc_code_id: '',
        wbs_code_id: '',
        concrete_work_id: '',
        location_id: '',
        structure_id: '',
        structure_no: '',
        casting_date: dateInputYYYYMMDDLocal(0),
        mixcode_id: '',
        volume_confirm: '',
      })
    }
  }, [open, profile?.client_id, reset])

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
    if (!filteredMixcodes.some((m) => String(m.id) === cur)) setValue('mixcode_id', '')
  }, [filteredMixcodes, getValues, setValue])

  useEffect(() => {
    const cur = getValues('structure_id')
    if (!cur) return
    if (!filteredStructures.some((s) => String(s.id) === cur)) setValue('structure_id', '')
  }, [filteredStructures, getValues, setValue])

  async function onSubmit(data: FormData) {
    if (step !== 1 || !user?.id || submitLockRef.current) return
    const vol = parseFloat(data.volume_confirm)
    if (Number.isNaN(vol) || vol <= 0) {
      toast.error('กรุณาระบุ Confirm Volume ที่ถูกต้อง')
      return
    }
    submitLockRef.current = true
    setSubmitting(true)
    try {
      const result = await createCstShortcutRequest(
        {
          client_id: parseInt(data.client_id, 10),
          abc_code_id: data.abc_code_id ? parseInt(data.abc_code_id, 10) : null,
          wbs_code_id: data.wbs_code_id ? parseInt(data.wbs_code_id, 10) : null,
          concrete_work_id: parseInt(data.concrete_work_id, 10),
          location_id: parseInt(data.location_id, 10),
          structure_id: parseInt(data.structure_id, 10),
          structure_no: data.structure_no?.trim() || null,
          casting_date: data.casting_date,
          mixcode_id: parseInt(data.mixcode_id, 10),
          volume_confirm: vol,
        },
        user.id,
      )
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('บันทึกรายการ Complete เรียบร้อย — แสดงในรายการจองและ CST')
      onOpenChange(false)
      onCreated?.()
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const nextStep = () => {
    const vals = getValues()
    const step0Fields: Array<keyof FormData> = [
      'client_id',
      'concrete_work_id',
      'location_id',
      'structure_id',
    ]
    const hasErrors = step0Fields.some((f) => !vals[f]?.trim())
    if (!hasErrors) setStep(1)
    else toast.error('กรุณากรอกข้อมูลให้ครบ')
  }

  const vals = getValues()
  const client = clients.find((c) => String(c.id) === vals.client_id)
  const location = locations.find((l) => String(l.id) === vals.location_id)
  const structure = structures.find((s) => String(s.id) === vals.structure_id)
  const mixcode = mixcodes.find((m) => String(m.id) === vals.mixcode_id)
  const abc = abcCodes.find((c) => String(c.id) === vals.abc_code_id)
  const wbs = wbsCodes.find((w) => String(w.id) === vals.wbs_code_id)
  const concrete = concreteWorks.find((cw) => String(cw.id) === vals.concrete_work_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={CST_SHORTCUT_OVERLAY} className={CST_SHORTCUT_CONTENT} showCloseButton>
        <DialogHeader className={modal.header}>
          <DialogTitle className={modal.title}>เพิ่มรายการ CST (Complete)</DialogTitle>
          <DialogDescription className="text-sm text-pour-muted">
            {STEPS[step]} · ขั้นตอนที่ {step + 1}/{STEPS.length} — แสดงในรายการจองและ CST · ไม่ได้จองผ่านระบบ
          </DialogDescription>
        </DialogHeader>

        <div className={modal.body}>
          <ShortcutStepBar step={step} />

          <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
            {step === 0 ? (
              <CstShortcutStep0Fields
                control={control}
                register={register}
                errors={errors}
                clients={clients}
                abcCodes={abcCodes}
                wbsCodes={wbsCodes}
                concreteWorks={concreteWorks}
                locations={locations}
                filteredStructures={filteredStructures}
                setValue={setValue}
              />
            ) : (
              <CstShortcutStep1Fields
                control={control}
                register={register}
                errors={errors}
                filteredMixcodes={filteredMixcodes}
                mixcodes={mixcodes}
                summary={{
                  client: client?.client_name,
                  abc: abc?.full_abc ?? undefined,
                  wbs: wbs?.full_wbs ?? undefined,
                  concrete: concrete?.concrete_work,
                  location: location?.full_location ?? location?.location1,
                  structure: structure?.structure_name,
                  structureNo: vals.structure_no,
                  castingDate: vals.casting_date,
                  mixcode: mixcode?.mixcode,
                  volumeConfirm: vals.volume_confirm,
                }}
              />
            )}
          </form>
        </div>

        <DialogFooter className={modal.footer}>
          {step > 0 ? (
            <Button type="button" variant="outline" size="modalAction" onClick={() => setStep(step - 1)} disabled={submitting}>
              ย้อนกลับ
            </Button>
          ) : (
            <Button type="button" variant="outline" size="modalAction" onClick={() => onOpenChange(false)} disabled={submitting}>
              ยกเลิก
            </Button>
          )}
          {step < 1 ? (
            <Button type="button" size="modalAction" onClick={nextStep}>
              ถัดไป
            </Button>
          ) : (
            <Button
              type="button"
              size="modalAction"
              disabled={submitting}
              onClick={() => { void handleSubmit(onSubmit)() }}
            >
              {submitting ? 'กำลังบันทึก...' : 'ยืนยันเพิ่มรายการ'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

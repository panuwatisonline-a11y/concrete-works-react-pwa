import { useCallback, useEffect, useState, type FocusEvent } from 'react'
import { toast } from 'sonner'
import { Printer, Loader2, Plus, Trash2, X } from 'lucide-react'
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
  SELECT_CONTENT_ELEVATED_Z,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CST_SAMPLE_TYPE_OPTIONS,
  cstComputedPreviewRows,
  cstDefaultSampleLabel,
  CST_DECIMAL_PLACES,
  cstFormValuesFromRecord,
  formatCstNumericInput,
  cstGroupAveragesFromView,
  CST_MAX_SAMPLES,
  CST_SAMPLE_GROUPS,
  CST_SAMPLES_PER_GROUP,
  cstInferVisibleGroupCount,
  cstRecordPayloadFromForm,
  cstSampleHasData,
  removeCstSampleGroup,
  defaultCstFormValues,
  needsCylinderDimensions,
  validateCstVisibleGroupSamples,
  type CstFormValues,
} from '@/lib/cstForm'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  deleteCstRecord,
  fetchCompressionMachines,
  fetchCstByRequestAndAge,
  fetchCstViewByRequestAndAge,
  resolveCstReportNoForRequest,
  upsertCstRecord,
} from '@/lib/cstData'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { localPrintCstReport, warmCstReportTemplateCache } from '@/lib/cstPrint'
import { cstReportNoFromSuffix, cstReportNoPrefix, cstReportNoSuffix } from '@/lib/cstReportNo'
import { cstStrengthUnitLabel } from '@/lib/cstStrengthReportTemplate'
import { cn, shortId } from '@/lib/utils'
import { layout, modal, rq } from '@/lib/requestUi'
import { CstRequestPourInfo } from '@/components/requests/CstRequestPourInfo'
import type { CstTestAge, RequestWithRelations } from '@/types/app.types'
import type { CstViewRow } from '@/types/database.cst.types'

const CST_OVERLAY = 'z-[260]'
const CST_CONTENT = cn('!z-[270]', modal.xl)
/**
 * ฟิลด์คู่ (วันทดสอบ / เครื่องอัด) — คอลัมน์เดียวบนมือถือ (รวม iPhone แนวนอน)
 * สองคอลัมน์เมื่อมี pointer ละเอียด (เมาส์) — ไม่ใช้ pour-desktop เพราะ landscape บน iPhone ทำให้ชนกัน
 */
const CST_META_GRID = 'grid min-w-0 grid-cols-1 gap-3 pour-pointer-fine:grid-cols-2'
const CST_META_FULL_SPAN = 'pour-pointer-fine:col-span-2'
const CST_CONFIRM_OVERLAY = 'z-[280]'
const CST_CONFIRM_CONTENT = '!z-[290]'

export type CstFormDialogProps = {
  request: RequestWithRelations
  age: CstTestAge | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function updateSample(
  samples: CstFormValues['samples'],
  index: number,
  patch: Partial<CstFormValues['samples'][number]>,
): CstFormValues['samples'] {
  return samples.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

type CstNumericField = 'wt' | 'kn' | 'height' | 'diameter'

function blurCstNumericField(
  setValues: React.Dispatch<React.SetStateAction<CstFormValues | null>>,
  index: number,
  field: CstNumericField,
  e: FocusEvent<HTMLInputElement>,
) {
  const formatted = formatCstNumericInput(e.target.value)
  if (formatted === e.target.value) return
  setValues((v) => (v ? { ...v, samples: updateSample(v.samples, index, { [field]: formatted }) } : v))
}

const CST_NUM_STEP = (10 ** -CST_DECIMAL_PLACES).toFixed(CST_DECIMAL_PLACES)


function ComputedPreview({
  view,
  strengthUnit,
  request,
}: {
  view: CstViewRow
  strengthUnit: string
  request: RequestWithRelations
}) {
  const rows = cstComputedPreviewRows(view, CST_MAX_SAMPLES)
  const groupAvgs = cstGroupAveragesFromView(view, CST_SAMPLE_GROUPS, { request })
  const unit = strengthUnit.trim() || 'ksc'
  if (!rows.length) return null

  return (
    <div className="rounded-xl border border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)]/60 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pour-muted">
        ผลคำนวณ (จากระบบ)
        <span className="ml-2 font-normal normal-case text-pour-subtle">{rows.length} ตัวอย่าง</span>
      </p>
      <div className="max-h-56 overflow-y-auto overscroll-y-contain">
        <div className="grid min-w-[280px] grid-cols-4 gap-x-2 gap-y-1 text-center text-xs sm:text-sm">
          <span className="sticky top-0 bg-[var(--glass-bg)]/95 py-1 font-semibold text-[color:var(--pour-ink-1)]">ตัวอย่าง</span>
          <span className="sticky top-0 bg-[var(--glass-bg)]/95 py-1 font-semibold text-[color:var(--pour-ink-1)]">Density</span>
          <span className="sticky top-0 bg-[var(--glass-bg)]/95 py-1 font-semibold text-[color:var(--pour-ink-1)]">Adj (kN)</span>
          <span className="sticky top-0 bg-[var(--glass-bg)]/95 py-1 font-semibold text-[color:var(--pour-ink-1)]">{unit}</span>
          {rows.map((r) => (
            <div key={r.index} className="contents">
              <span className="tabular-nums text-[color:var(--pour-ink-1)]">{r.label}</span>
              <span className="tabular-nums">{r.density}</span>
              <span className="tabular-nums text-pour-muted">{r.adj}</span>
              <span className="tabular-nums font-medium text-[color:var(--pour-accent)]">{r.ksc}</span>
            </div>
          ))}
        </div>
      </div>
      {groupAvgs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--glass-border-subtle)] pt-3">
          {groupAvgs.map(({ group, avg, pct }) => (
            <span
              key={group}
              className="rounded-full border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)]/70 px-2.5 py-0.5 text-xs tabular-nums text-[color:var(--pour-ink-1)]"
            >
              ชุด {group} เฉลี่ย <strong className="text-[color:var(--pour-accent)]">{avg}</strong> {unit}
              {pct != null ? (
                <>
                  {' '}
                  · <strong className="text-[color:var(--pour-ink-1)]">{pct}%</strong>
                </>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CstFormDialog({ request, age, open, onOpenChange, onSaved }: CstFormDialogProps) {
  const compressionMachines = useMasterDataStore((s) => s.compressionMachines)
  const setMasterPartial = useMasterDataStore((s) => s.setAll)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [values, setValues] = useState<CstFormValues | null>(null)
  const [preview, setPreview] = useState<CstViewRow | null>(null)
  const [visibleGroups, setVisibleGroups] = useState(1)

  const groupCount = CST_SAMPLE_GROUPS
  const showDims = values ? needsCylinderDimensions(values.sample_type) : false

  const loadForm = useCallback(async () => {
    if (age == null) return
    setLoading(true)
    setPreview(null)
    try {
      const [rec, view] = await Promise.all([
        fetchCstByRequestAndAge(request.id, age),
        fetchCstViewByRequestAndAge(request.id, age),
      ])
      let formValues = rec
        ? cstFormValuesFromRecord(rec, request, age)
        : defaultCstFormValues(request, age)
      if (!formValues.report_no.trim()) {
        try {
          const report_no = await resolveCstReportNoForRequest(request.id, age)
          formValues = { ...formValues, report_no }
        } catch (e) {
          console.warn('CST report no suggest:', e)
        }
      } else {
        const suffix = cstReportNoSuffix(formValues.report_no)
        if (suffix) {
          formValues = { ...formValues, report_no: cstReportNoFromSuffix(suffix, age) }
        }
      }
      setValues(formValues)
      setVisibleGroups(
        rec ? cstInferVisibleGroupCount(formValues.samples, CST_SAMPLE_GROUPS) : 1,
      )
      setPreview(view)
    } catch (e) {
      console.error('CST form load:', e)
      toast.error('โหลดข้อมูล CST ไม่สำเร็จ')
      const fallback = defaultCstFormValues(request, age)
      setValues(fallback)
      setVisibleGroups(1)
    } finally {
      setLoading(false)
    }
  }, [age, request])

  useEffect(() => {
    if (open) warmCstReportTemplateCache()
  }, [open])

  useEffect(() => {
    if (open && age != null) void loadForm()
    if (!open) {
      setValues(null)
      setPreview(null)
      setVisibleGroups(1)
      setDeleteConfirmOpen(false)
    }
  }, [open, age, loadForm])

  useEffect(() => {
    if (!open || compressionMachines.length > 0) return
    void fetchCompressionMachines()
      .then((rows) => setMasterPartial({ compressionMachines: rows }))
      .catch(() => toast.error('โหลดรายการเครื่องอัดไม่สำเร็จ'))
  }, [open, compressionMachines.length, setMasterPartial])

  async function handleSave() {
    if (!values || age == null) return
    if (!values.machine_id) {
      toast.error('กรุณาเลือกเครื่องอัด')
      return
    }
    if (!values.sample_type.trim()) {
      toast.error('กรุณาเลือก Sample Type')
      return
    }
    if (!values.test_date.trim()) {
      toast.error('กรุณาระบุวันทดสอบ')
      return
    }
    const sampleErr = validateCstVisibleGroupSamples(values, visibleGroups)
    if (sampleErr) {
      toast.error(sampleErr)
      return
    }

    setSaving(true)
    try {
      const payload = cstRecordPayloadFromForm(values, request.id, age)
      const saved = await upsertCstRecord(payload, values.id)
      const view = await fetchCstViewByRequestAndAge(request.id, age)
      setValues((v) => (v ? { ...v, id: saved.id } : v))
      setPreview(view)
      toast.success('บันทึกผล CST สำเร็จ')
      onSaved?.()
    } catch (e) {
      console.error('CST save:', e)
      const msg =
        e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505'
          ? 'เลขที่รายงานซ้ำ — เปลี่ยน Report No.'
          : 'บันทึกไม่สำเร็จ'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function handleRemoveGroup(groupIndex0: number) {
    if (!values) return
    const start = groupIndex0 * CST_SAMPLES_PER_GROUP
    const chunk = values.samples.slice(start, start + CST_SAMPLES_PER_GROUP)
    if (chunk.some(cstSampleHasData) && !window.confirm('ลบชุดนี้และข้อมูลที่กรอกไว้หรือไม่?')) {
      return
    }
    const { samples, visibleGroups: nextVisible } = removeCstSampleGroup(
      values.samples,
      groupIndex0,
      visibleGroups,
    )
    setValues({ ...values, samples })
    setVisibleGroups(nextVisible)
  }

  async function handleDelete() {
    if (!values?.id || age == null) return
    setDeleting(true)
    try {
      await deleteCstRecord(values.id)
      toast.success(`ลบผล CST +${age} วันสำเร็จ`)
      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      console.error('CST delete:', e)
      toast.error('ลบผลเทสไม่สำเร็จ')
    } finally {
      setDeleting(false)
    }
  }

  async function handlePrint() {
    if (age == null) return
    setPrinting(true)
    try {
      await localPrintCstReport(request, age)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'พิมพ์รายงานไม่สำเร็จ')
    } finally {
      setPrinting(false)
    }
  }

  const previewStrengthUnit = cstStrengthUnitLabel(
    preview?.strength_type ??
      (request.mixcode as { strength_type?: string | null } | null)?.strength_type,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={CST_OVERLAY} className={CST_CONTENT} showCloseButton>
        <DialogHeader>
          <DialogTitle className={rq.cardTitle}>
            บันทึกผล CST
            {age != null ? ` อายุ +${age} วัน` : ''}
          </DialogTitle>
          <DialogDescription className="sr-only">
            บันทึกผลการทดสอบกำลังอัดคอนกรีตสำหรับคำขอ {shortId(request.id)}
            {age != null ? ` อายุ +${age} วัน` : ''}
          </DialogDescription>
        </DialogHeader>

        <CstRequestPourInfo request={request} embedded className="border-0 bg-transparent p-0" />

        {loading || !values || age == null ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--pour-accent)]" aria-hidden />
            <p className="text-sm text-pour-muted">กำลังโหลดฟอร์ม…</p>
          </div>
        ) : (
          <div className="min-w-0 space-y-5">
            <div className={CST_META_GRID}>
              <div className={cn(layout.formField, CST_META_FULL_SPAN)}>
                <Label>Report No.</Label>
                <Input
                  value={values.report_no}
                  onChange={(e) => setValues((v) => v && { ...v, report_no: e.target.value })}
                  placeholder={`เช่น ${cstReportNoPrefix(age)}000001`}
                />
                <p className="text-xs text-pour-subtle">
                  สร้างอัตโนมัติเมื่อบันทึกครั้งแรกของคำขอเท — ลำดับเลขเดียวกันทุกอายุ (R1, R3, R7… ตามวันทดสอบ)
                </p>
              </div>
              <div className={layout.formField}>
                <Label>วันทดสอบ *</Label>
                <Input
                  type="date"
                  value={values.test_date}
                  onChange={(e) => setValues((v) => v && { ...v, test_date: e.target.value })}
                />
              </div>
              <div className={layout.formField}>
                <Label>เครื่องอัด *</Label>
                {compressionMachines.length === 0 ? (
                  <p className="text-sm text-amber-800">
                    ยังไม่มีเครื่องในระบบ — เพิ่มที่ Admin → CST Machine
                  </p>
                ) : (
                  <Select
                    value={values.machine_id || undefined}
                    onValueChange={(id) => setValues((v) => v && { ...v, machine_id: id })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเครื่อง" />
                    </SelectTrigger>
                    <SelectContent className={cn(SELECT_CONTENT_ELEVATED_Z, 'max-h-48')}>
                      {compressionMachines.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.machine?.trim() || `เครื่อง #${m.id}`}
                          {m.k_display ? ` · ${m.k_display}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className={cn(layout.formField, CST_META_FULL_SPAN)}>
                <Label>Sample Type *</Label>
                <Select
                  value={values.sample_type || undefined}
                  onValueChange={(t) => setValues((v) => v && { ...v, sample_type: t })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ประเภทตัวอย่าง" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
                    {CST_SAMPLE_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {preview ? (
              <ComputedPreview view={preview} strengthUnit={previewStrengthUnit} request={request} />
            ) : null}

            {Array.from({ length: visibleGroups }, (_, g) => {
              const groupNo = g + 1
              const startIdx = g * 3
              const rows = values.samples.slice(startIdx, startIdx + 3)
              return (
                <section
                  key={groupNo}
                  className="rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] p-3 sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[color:var(--pour-ink-1)]">
                      ชุดที่ {groupNo}
                      <span className="ml-2 font-normal text-pour-subtle">
                        · ตัวอย่าง {startIdx + 1}–{startIdx + rows.length}
                      </span>
                    </h3>
                    {groupNo > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg text-pour-subtle hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`ลบชุดที่ ${groupNo}`}
                        onClick={() => handleRemoveGroup(g)}
                      >
                        <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[520px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[color:var(--glass-border-subtle)] text-left text-xs text-pour-muted">
                          <th className="pb-2 pr-2 font-medium">#</th>
                          <th className="pb-2 pr-2 font-medium">Sample No.</th>
                          <th className="pb-2 pr-2 font-medium">น้ำหนัก (kg)</th>
                          <th className="pb-2 pr-2 font-medium">แรงอัด (kN)</th>
                          {showDims ? (
                            <>
                              <th className="pb-2 pr-2 font-medium">สูง (cm)</th>
                              <th className="pb-2 font-medium">เส้นผ่าน (cm)</th>
                            </>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, ri) => {
                          const idx = startIdx + ri
                          return (
                            <tr key={idx} className="border-b border-[#f3f4f6] last:border-0">
                              <td className="py-2 pr-2 tabular-nums text-pour-subtle">{idx + 1}</td>
                              <td className="py-2 pr-2">
                                <Input
                                  className="h-9"
                                  value={row.sampleNo}
                                  onChange={(e) =>
                                    setValues((v) =>
                                      v
                                        ? {
                                            ...v,
                                            samples: updateSample(v.samples, idx, {
                                              sampleNo: e.target.value,
                                            }),
                                          }
                                        : v,
                                    )
                                  }
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  className="h-9 tabular-nums"
                                  type="number"
                                  step={CST_NUM_STEP}
                                  inputMode="decimal"
                                  value={row.wt}
                                  onChange={(e) =>
                                    setValues((v) =>
                                      v
                                        ? {
                                            ...v,
                                            samples: updateSample(v.samples, idx, { wt: e.target.value }),
                                          }
                                        : v,
                                    )
                                  }
                                  onBlur={(e) => blurCstNumericField(setValues, idx, 'wt', e)}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <Input
                                  className="h-9 tabular-nums"
                                  type="number"
                                  step={CST_NUM_STEP}
                                  inputMode="decimal"
                                  value={row.kn}
                                  onChange={(e) =>
                                    setValues((v) =>
                                      v
                                        ? {
                                            ...v,
                                            samples: updateSample(v.samples, idx, { kn: e.target.value }),
                                          }
                                        : v,
                                    )
                                  }
                                  onBlur={(e) => blurCstNumericField(setValues, idx, 'kn', e)}
                                />
                              </td>
                              {showDims ? (
                                <>
                                  <td className="py-2 pr-2">
                                    <Input
                                      className="h-9 tabular-nums"
                                      type="number"
                                      step={CST_NUM_STEP}
                                      value={row.height}
                                      onChange={(e) =>
                                        setValues((v) =>
                                          v
                                            ? {
                                                ...v,
                                                samples: updateSample(v.samples, idx, {
                                                  height: e.target.value,
                                                }),
                                              }
                                            : v,
                                        )
                                      }
                                      onBlur={(e) => blurCstNumericField(setValues, idx, 'height', e)}
                                    />
                                  </td>
                                  <td className="py-2">
                                    <Input
                                      className="h-9 tabular-nums"
                                      type="number"
                                      step={CST_NUM_STEP}
                                      value={row.diameter}
                                      onChange={(e) =>
                                        setValues((v) =>
                                          v
                                            ? {
                                                ...v,
                                                samples: updateSample(v.samples, idx, {
                                                  diameter: e.target.value,
                                                }),
                                              }
                                            : v,
                                        )
                                      }
                                      onBlur={(e) => blurCstNumericField(setValues, idx, 'diameter', e)}
                                    />
                                  </td>
                                </>
                              ) : null}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 sm:hidden">
                    {rows.map((row, ri) => {
                      const idx = startIdx + ri
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold text-pour-muted">ตัวอย่างที่ {idx + 1}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">Sample No.</Label>
                              <Input
                                value={row.sampleNo}
                                onChange={(e) =>
                                  setValues((v) =>
                                    v
                                      ? {
                                          ...v,
                                          samples: updateSample(v.samples, idx, {
                                            sampleNo: e.target.value,
                                          }),
                                        }
                                      : v,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">น้ำหนัก (kg)</Label>
                              <Input
                                type="number"
                                step={CST_NUM_STEP}
                                className="tabular-nums"
                                value={row.wt}
                                onChange={(e) =>
                                  setValues((v) =>
                                    v
                                      ? {
                                          ...v,
                                          samples: updateSample(v.samples, idx, { wt: e.target.value }),
                                        }
                                      : v,
                                  )
                                }
                                onBlur={(e) => blurCstNumericField(setValues, idx, 'wt', e)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">แรงอัด (kN)</Label>
                              <Input
                                type="number"
                                step={CST_NUM_STEP}
                                className="tabular-nums"
                                value={row.kn}
                                onChange={(e) =>
                                  setValues((v) =>
                                    v
                                      ? {
                                          ...v,
                                          samples: updateSample(v.samples, idx, { kn: e.target.value }),
                                        }
                                      : v,
                                  )
                                }
                                onBlur={(e) => blurCstNumericField(setValues, idx, 'kn', e)}
                              />
                            </div>
                            {showDims ? (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-xs">เส้นผ่าน (cm)</Label>
                                  <Input
                                    type="number"
                                    step={CST_NUM_STEP}
                                    value={row.height}
                                    onChange={(e) =>
                                      setValues((v) =>
                                        v
                                          ? {
                                              ...v,
                                              samples: updateSample(v.samples, idx, {
                                                height: e.target.value,
                                              }),
                                            }
                                          : v,
                                      )
                                    }
                                    onBlur={(e) => blurCstNumericField(setValues, idx, 'height', e)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">เส้นผ่าน (cm)</Label>
                                  <Input
                                    type="number"
                                    step={CST_NUM_STEP}
                                    value={row.diameter}
                                    onChange={(e) =>
                                      setValues((v) =>
                                        v
                                          ? {
                                              ...v,
                                              samples: updateSample(v.samples, idx, {
                                                diameter: e.target.value,
                                              }),
                                            }
                                          : v,
                                      )
                                    }
                                    onBlur={(e) => blurCstNumericField(setValues, idx, 'diameter', e)}
                                  />
                                </div>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {visibleGroups < groupCount ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed sm:w-auto"
                onClick={() => {
                  setVisibleGroups((n) => {
                    const next = Math.min(groupCount, n + 1)
                    const start = (next - 1) * CST_SAMPLES_PER_GROUP
                    setValues((v) => {
                      if (!v) return v
                      const samples = v.samples.map((row, idx) => {
                        if (idx < start || idx >= start + CST_SAMPLES_PER_GROUP) return row
                        if (row.sampleNo.trim()) return row
                        return { ...row, sampleNo: cstDefaultSampleLabel(idx + 1) }
                      })
                      return { ...v, samples }
                    })
                    return next
                  })
                }}
              >
                <Plus className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                เพิ่มชุดที่ {visibleGroups + 1}
                <span className="text-pour-subtle">
                  ({visibleGroups}/{groupCount})
                </span>
              </Button>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {values?.id ? (
            <Button
              type="button"
              variant="outline"
              className="order-last border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:order-first"
              disabled={saving || printing || loading || deleting}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              ลบผลเทส
            </Button>
          ) : (
            <span className="hidden sm:block" aria-hidden />
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving || deleting}
            >
              ปิด
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || printing || loading || deleting || !values?.id}
              onClick={() => void handlePrint()}
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Printer className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              )}
              พิมพ์รายงาน
            </Button>
            <Button
              type="button"
              disabled={saving || loading || deleting || !values}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              บันทึก
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => handleDelete()}
        title="ลบผลเทส CST"
        description={
          age != null
            ? `ยืนยันลบผลทดสอบอายุ +${age} วัน${values?.report_no?.trim() ? ` (เลขที่ ${values.report_no.trim()})` : ''} — ไม่สามารถกู้คืนได้`
            : 'ยืนยันลบผลทดสอบนี้ — ไม่สามารถกู้คืนได้'
        }
        confirmLabel="ลบผลเทส"
        confirmVariant="destructive"
        isLoading={deleting}
        overlayClassName={CST_CONFIRM_OVERLAY}
        dialogContentClassName={CST_CONFIRM_CONTENT}
      />
    </Dialog>
  )
}

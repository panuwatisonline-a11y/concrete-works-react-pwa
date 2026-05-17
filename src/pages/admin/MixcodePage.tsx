import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { StructureListMultiSelect } from '@/components/shared/StructureListMultiSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn, formatVolumeNumber } from '@/lib/utils'
import { app, layout, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { refreshAfterAdminMutation, type AdminTableLoadOptions } from '@/lib/adminTableRefresh'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { MixedCode, Structure } from '@/types/app.types'

const MIXCODE_SAMPLE_TYPE_PRESETS = [
  'Cylinder 15x30 cm.',
  'Cylinder 10x10 cm.',
  'Cylinder 6x10 cm.',
  'Cube 15x15x15 cm.',
  'Cube 10x10x10 cm.',
  'Cube 5x5x5 cm.',
] as const

const REQ_PAGE_SIZE = 1000

/** ผลรวม volume_confirm (m³) จาก Request — จัดกลุ่มด้วย mixcode_id เหมือนใช้ในหน้ารายการคำขอ */
async function fetchConfirmVolumeSumByMixcodeId(): Promise<Record<number, number>> {
  const sums: Record<number, number> = {}
  for (let from = 0; ; from += REQ_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('Request')
      .select('mixcode_id, volume_confirm')
      .not('volume_confirm', 'is', null)
      .range(from, from + REQ_PAGE_SIZE - 1)
    if (error) {
      console.error('Load Request volume_confirm for Mixcode:', error.message)
      toast.error('โหลดยอด confirm volume ไม่สำเร็จ')
      return sums
    }
    const chunk = data ?? []
    for (const row of chunk) {
      const mid = row.mixcode_id
      const vc = row.volume_confirm
      if (mid == null || vc == null || Number.isNaN(vc)) continue
      sums[mid] = (sums[mid] ?? 0) + vc
    }
    if (chunk.length < REQ_PAGE_SIZE) break
  }
  return sums
}

export function MixcodePage() {
  const [data, setData] = useState<MixedCode[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
  const [confirmVolumeByMixcodeId, setConfirmVolumeByMixcodeId] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา Mixcode, Supplier, Structure list, Strength, Slump, ปริมาณ…',
    ariaLabel: 'ค้นหาในตาราง Mixcode',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const structureNamesFromMaster = useMemo(
    () =>
      structures
        .map((s) => s.structure_name?.trim())
        .filter((v): v is string => Boolean(v))
        .sort((a, b) => a.localeCompare(b, 'th')),
    [structures],
  )

  const filtered = useMemo(
    () =>
      filterTableRows(data, q, [
        'mixcode',
        'supplier',
        'structure_list',
        'strength',
        'strength_type',
        'slump',
        'sample_type',
        'qty',
      ]),
    [data, q],
  )

  const supplierSuggestions = useMemo(() => {
    const s = new Set<string>()
    for (const r of data) {
      const v = r.supplier?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th'))
  }, [data])

  const strengthTypeSuggestions = useMemo(() => {
    const s = new Set<string>(['ksc.', 'MPa.'])
    for (const r of data) {
      const v = r.strength_type?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th', { sensitivity: 'base' }))
  }, [data])

  const sampleTypeSelectOptions = useMemo(() => {
    const predefined = [...MIXCODE_SAMPLE_TYPE_PRESETS]
    const seen = new Set<string>(predefined)
    const extra: string[] = []
    for (const r of data) {
      const v = r.sample_type?.trim()
      if (v && !seen.has(v)) {
        seen.add(v)
        extra.push(v)
      }
    }
    extra.sort((a, b) => a.localeCompare(b, 'th'))
    return [...predefined, ...extra]
  }, [data])

  const slumpSuggestions = useMemo(() => {
    const s = new Set<string>(['7.5-10 cm', '12±2 cm', '15±2 cm', '18±2 cm', '20±2 cm'])
    for (const r of data) {
      const v = r.slump?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th', { numeric: true }))
  }, [data])

  async function load(opts?: AdminTableLoadOptions) {
    if (!opts?.background) setLoading(true)
    try {
      const [{ data: rows, error: rowsErr }, { data: structRows, error: structErr }, sums] = await Promise.all([
        supabase.from('Mixed Code').select('*').order('mixcode'),
        supabase.from('Structure').select('id, structure_name').order('structure_name'),
        fetchConfirmVolumeSumByMixcodeId(),
      ])
      if (rowsErr || structErr) {
        console.error('Mixcode load:', rowsErr?.message ?? structErr?.message)
        toast.error('โหลดข้อมูลไม่สำเร็จ')
        return
      }
      setData((rows ?? []) as MixedCode[])
      setStructures((structRows ?? []) as Structure[])
      setConfirmVolumeByMixcodeId(sums)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  usePullToRefreshOnLoad(() => load({ background: true }))

  async function onAdd(item: Partial<MixedCode>) {
    const { error } = await supabase.from('Mixed Code').insert({
      mixcode: item.mixcode ?? '', supplier: item.supplier ?? null,
      strength: item.strength ?? null, strength_type: item.strength_type ?? null,
      sample_type: item.sample_type ?? null, slump: item.slump ?? null,
      structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null,
      qty: item.qty ?? null,
    })
    if (!error) {
      toast.success('เพิ่มสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: MixedCode) {
    const { error } = await supabase.from('Mixed Code').update({
      mixcode: item.mixcode, supplier: item.supplier, strength: item.strength,
      strength_type: item.strength_type, sample_type: item.sample_type,
      slump: item.slump, structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null, qty: item.qty,
    }).eq('id', item.id)
    if (!error) {
      toast.success('บันทึกสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Mixed Code').delete().eq('id', id)
    if (!error) {
      toast.success('ลบสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Mixcode</h1>
      <CrudTable
        title="Mixcode"
        data={filtered}
        loading={loading}
        groupBy={{
          groupKey: (r) => r.supplier?.trim() ?? '',
          renderGroupHeading: (key, count) =>
            key.trim() ? (
              <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span>{key}</span>
                <span className="text-xs font-medium tabular-nums text-[color:var(--pour-ink-2)]">
                  {count} รายการ
                </span>
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[color:var(--pour-ink-2)]">ไม่ระบุ Supplier</span>
                <span className="text-xs font-medium tabular-nums text-[color:var(--pour-ink-2)]">
                  {count} รายการ
                </span>
              </span>
            ),
        }}
        sortWithinGroup={(a, b) => a.mixcode.localeCompare(b.mixcode, 'th')}
        columns={[
          { key: 'supplier', label: 'Supplier' },
          { key: 'mixcode', label: 'Mixcode' },
          { key: 'strength', label: 'Strength', render: (r) => `${r.strength ?? '-'} ${r.strength_type ?? ''}` },
          { key: 'slump', label: 'Slump' },
          { key: 'sample_type', label: 'Sample Type' },
          {
            key: 'qty',
            label: 'QUANTITY',
            render: (r) =>
              r.qty != null && !Number.isNaN(r.qty) ? `${formatVolumeNumber(r.qty)} cu.m` : '—',
          },
          {
            key: 'remaining_qty_display',
            label: 'REMAINING',
            render: (r) => {
              const confirmed = confirmVolumeByMixcodeId[r.id] ?? 0
              const cap = r.qty
              const capOk = cap != null && !Number.isNaN(cap)
              if (!capOk) return <span className="text-pour-muted">—</span>
              const remaining = cap - confirmed
              return (
                <span className={cn(remaining < 0 && 'font-medium text-rose-600')}>
                  {formatVolumeNumber(remaining)} cu.m
                </span>
              )
            },
          },
          {
            key: 'structure_list',
            label: 'Structure list',
            render: (r) => (r.structure_list?.trim() ? r.structure_list : '—'),
          },
        ]}
        formContent={(item, formData, onChange) => (
          <div className="space-y-3">
            <div className={layout.formGridDialog}>
              <div className={layout.formField}>
                <Label>Supplier</Label>
                <datalist id="mixcode-supplier-suggestions">
                  {supplierSuggestions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                <Input
                  list="mixcode-supplier-suggestions"
                  autoComplete="off"
                  value={String(formData.supplier ?? '')}
                  onChange={(e) => onChange('supplier', e.target.value)}
                />
              </div>
              <div className={layout.formField}>
                <Label>Mixcode *</Label>
                <Input value={String(formData.mixcode ?? '')} onChange={(e) => onChange('mixcode', e.target.value)} />
              </div>
            </div>
            <div className={layout.formField}>
              <Label>Structure list</Label>
              <p className="text-xs text-pour-muted">
                {structureNamesFromMaster.length > 0
                  ? `เลือกจากโครงสร้างในหน้า Structure ทั้งหมด ${structureNamesFromMaster.length} รายการ`
                  : 'ยังไม่มีโครงสร้าง — เพิ่มที่หน้า Structure ก่อน'}
              </p>
              {!loading ? (
                <StructureListMultiSelect
                  inDialog
                  value={String(formData.structure_list ?? '')}
                  onChange={(v) => onChange('structure_list', v)}
                  masterNames={structureNamesFromMaster}
                />
              ) : (
                <p className="text-sm text-pour-muted">กำลังโหลดรายการโครงสร้าง…</p>
              )}
            </div>
            <div className={layout.formGridDialog}>
              <div className={layout.formField}>
                <Label>Strength</Label>
                <Input
                  type="number"
                  value={formData.strength != null && !Number.isNaN(formData.strength as number) ? String(formData.strength) : ''}
                  onChange={(e) => {
                    const v = e.target.value
                    onChange('strength', v === '' ? undefined : parseFloat(v))
                  }}
                />
              </div>
              <div className={layout.formField}>
                <Label>Strength Type</Label>
                <datalist id="mixcode-strength-type-suggestions">
                  {strengthTypeSuggestions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                <Input
                  list="mixcode-strength-type-suggestions"
                  autoComplete="off"
                  value={String(formData.strength_type ?? '')}
                  placeholder="ksc., MPa."
                  onChange={(e) => onChange('strength_type', e.target.value)}
                />
              </div>
            </div>
            <div className={layout.formGridDialog}>
              <div className={layout.formField}>
                <Label>Sample Type</Label>
                <Select
                  value={String(formData.sample_type ?? '').trim() || undefined}
                  onValueChange={(v) => onChange('sample_type', v)}
                >
                  <SelectTrigger className="h-auto min-h-10 w-full text-left text-[15px] [&>span]:line-clamp-2 [&>span]:whitespace-normal [&>span]:break-words">
                    <SelectValue placeholder="เลือกขนาดตัวอย่าง" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(50dvh,18rem)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    {sampleTypeSelectOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-[15px]">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={layout.formField}>
                <Label>Slump</Label>
                <datalist id="mixcode-slump-suggestions">
                  {slumpSuggestions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
                <Input
                  list="mixcode-slump-suggestions"
                  autoComplete="off"
                  value={String(formData.slump ?? '')}
                  placeholder="7.5-10 cm"
                  onChange={(e) => onChange('slump', e.target.value)}
                />
              </div>
            </div>
            <div className={layout.formField}>
              <Label>ปริมาณ (m³)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="เช่น 100"
                value={formData.qty != null && !Number.isNaN(formData.qty as number) ? String(formData.qty) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  onChange('qty', v === '' ? null : parseFloat(v))
                }}
              />
              {item != null &&
                (() => {
                  const used = confirmVolumeByMixcodeId[item.id] ?? 0
                  const raw = formData.qty ?? item.qty
                  const capOk = raw != null && !Number.isNaN(raw as number)
                  const cap = capOk ? Number(raw) : null
                  return (
                    <div className="mt-2 rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/60 px-3 py-2 text-xs text-[color:var(--pour-ink-1)]">
                      <div className="flex justify-between gap-2 tabular-nums">
                        <span className="text-pour-muted">Σ Confirm volume (Request)</span>
                        <span>{formatVolumeNumber(used)} cu.m</span>
                      </div>
                      {cap != null && (
                        <div className="mt-1 flex justify-between gap-2 tabular-nums">
                          <span className="text-pour-muted">คงเหลือ (จากค่าข้างบนนี้)</span>
                          <span className={cn(cap - used < 0 && 'font-medium text-rose-600')}>
                            {formatVolumeNumber(cap - used)} cu.m
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })()}
            </div>
          </div>
        )}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

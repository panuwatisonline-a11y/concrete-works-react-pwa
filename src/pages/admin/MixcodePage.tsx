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
import { app, layout, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
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

export function MixcodePage() {
  const [data, setData] = useState<MixedCode[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา Mixcode, Supplier, Structure list, Strength, Slump…',
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

  async function load() {
    setLoading(true)
    const [{ data: rows }, { data: structRows }] = await Promise.all([
      supabase.from('Mixed Code').select('*').order('mixcode'),
      supabase.from('Structure').select('id, structure_name').order('structure_name'),
    ])
    setData((rows ?? []) as MixedCode[])
    setStructures((structRows ?? []) as Structure[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  async function onAdd(item: Partial<MixedCode>) {
    const { error } = await supabase.from('Mixed Code').insert({
      mixcode: item.mixcode ?? '', supplier: item.supplier ?? null,
      strength: item.strength ?? null, strength_type: item.strength_type ?? null,
      sample_type: item.sample_type ?? null, slump: item.slump ?? null,
      structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null,
      qty: item.qty ?? null,
    })
    if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: MixedCode) {
    const { error } = await supabase.from('Mixed Code').update({
      mixcode: item.mixcode, supplier: item.supplier, strength: item.strength,
      strength_type: item.strength_type, sample_type: item.sample_type,
      slump: item.slump, structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null, qty: item.qty,
    }).eq('id', item.id)
    if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Mixed Code').delete().eq('id', id)
    if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Mixcode</h1>
      <CrudTable
        title="Mixcode"
        data={filtered}
        loading={loading}
        columns={[
          { key: 'mixcode', label: 'Mixcode' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'strength', label: 'Strength', render: (r) => `${r.strength ?? '-'} ${r.strength_type ?? ''}` },
          { key: 'slump', label: 'Slump' },
          { key: 'sample_type', label: 'Sample Type' },
          {
            key: 'structure_list',
            label: 'Structure list',
            render: (r) => (r.structure_list?.trim() ? r.structure_list : '—'),
          },
        ]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3">
            <div className={layout.formGridDialog}>
              <div className={layout.formField}>
                <Label>Mixcode *</Label>
                <Input value={String(formData.mixcode ?? '')} onChange={(e) => onChange('mixcode', e.target.value)} />
              </div>
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
            </div>
            <div className={layout.formField}>
              <Label>Structure list</Label>
              <p className="text-xs text-[#6b7280]">
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
                <p className="text-sm text-[#6b7280]">กำลังโหลดรายการโครงสร้าง…</p>
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
          </div>
        )}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

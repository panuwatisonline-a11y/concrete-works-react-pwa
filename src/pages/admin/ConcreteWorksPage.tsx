import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { StructureListMultiSelect } from '@/components/shared/StructureListMultiSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { filterTableRows } from '@/lib/tableClientFilter'
import { structureNamesSelectableFromMixcodes, mixcodeStructureListTokenUnion, parseStructureListTokens, STRUCTURE_LIST_JOIN } from '@/lib/structureListTokens'
import type { ConcreteWork, MixedCode, Structure } from '@/types/app.types'

export function ConcreteWorksPage() {
  const [data, setData] = useState<ConcreteWork[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
  const [mixcodes, setMixcodes] = useState<Pick<MixedCode, 'structure_list'>[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาประเภทงานคอนกรีต, Structure list…',
    ariaLabel: 'ค้นหาในตาราง Concrete Works',
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

  const mixcodeUnionList = useMemo(() => mixcodeStructureListTokenUnion(mixcodes), [mixcodes])

  const structureNamesForConcreteWorkForm = useMemo(
    () => structureNamesSelectableFromMixcodes(structureNamesFromMaster, mixcodes),
    [structureNamesFromMaster, mixcodes],
  )

  const filtered = useMemo(
    () => filterTableRows(data, q, ['concrete_work', 'structure_list']),
    [data, q],
  )

  async function load() {
    setLoading(true)
    const [{ data: rows }, { data: structRows }, { data: mixRows }] = await Promise.all([
      supabase.from('Concrete Works').select('*').order('concrete_work'),
      supabase.from('Structure').select('id, structure_name').order('structure_name'),
      supabase.from('Mixed Code').select('structure_list'),
    ])
    setData((rows ?? []) as ConcreteWork[])
    setStructures((structRows ?? []) as Structure[])
    setMixcodes((mixRows ?? []) as Pick<MixedCode, 'structure_list'>[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function sanitizeStructureListForSave(raw: string | null | undefined): string | null {
    const u = new Set(mixcodeStructureListTokenUnion(mixcodes))
    if (u.size === 0) return null
    const tokens = parseStructureListTokens(raw)
    const kept = tokens.filter((t) => u.has(t))
    if (kept.length === 0) return null
    return kept.sort((a, b) => a.localeCompare(b, 'th')).join(STRUCTURE_LIST_JOIN)
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Concrete Works</h1>
      <CrudTable
        title="Concrete Work"
        data={filtered}
        loading={loading}
        columns={[
          { key: 'concrete_work', label: 'ประเภทงานคอนกรีต' },
          { key: 'structure_list', label: 'Structure List' },
        ]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>ประเภทงานคอนกรีต *</Label>
              <Input value={String(formData.concrete_work ?? '')} onChange={(e) => onChange('concrete_work', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Structure list</Label>
              <p className="text-xs text-[#6b7280]">
                {structureNamesForConcreteWorkForm.length === 0 && structures.length > 0
                  ? 'ยังไม่มี Mixcode ที่ระบุ Structure list — ตั้งที่หน้า Mixcode ก่อนจึงจะเลือกโครงสร้างได้'
                  : 'เลือกได้เฉพาะโครงสร้างที่ปรากฏใน Structure list ของ Mixcode อย่างน้อยหนึ่งรายการ'}
              </p>
              <StructureListMultiSelect
                value={String(formData.structure_list ?? '')}
                onChange={(v) => onChange('structure_list', v)}
                masterNames={structureNamesForConcreteWorkForm}
                allowedTokens={mixcodeUnionList}
              />
            </div>
          </div>
        )}
        onAdd={async (item) => {
          const structure_list = sanitizeStructureListForSave(item.structure_list)
          const { error } = await supabase.from('Concrete Works').insert({
            concrete_work: item.concrete_work ?? '',
            structure_list,
          })
          if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
        }}
        onEdit={async (item) => {
          const structure_list = sanitizeStructureListForSave(item.structure_list)
          const { error } = await supabase.from('Concrete Works').update({
            concrete_work: item.concrete_work,
            structure_list,
          }).eq('id', item.id)
          if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
        }}
        onDelete={async (id) => {
          const { error } = await supabase.from('Concrete Works').delete().eq('id', id)
          if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้')
        }}
      />
    </div>
  )
}

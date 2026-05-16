import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { StructureListMultiSelect } from '@/components/shared/StructureListMultiSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { filterTableRows } from '@/lib/tableClientFilter'
import { parseStructureListTokens, STRUCTURE_LIST_JOIN } from '@/lib/structureListTokens'
import type { ConcreteWork, Structure } from '@/types/app.types'

function concreteWorkNameKey(name: string | null | undefined) {
  return String(name ?? '').trim().toLowerCase()
}

function duplicateConcreteWorkWithin(rows: ConcreteWork[], candidateName: string, excludeId?: number): boolean {
  const k = concreteWorkNameKey(candidateName)
  return rows.some((r) => r.id !== excludeId && concreteWorkNameKey(r.concrete_work) === k)
}

export function ConcreteWorksPage() {
  const [data, setData] = useState<ConcreteWork[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
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

  const filtered = useMemo(
    () => filterTableRows(data, q, ['concrete_work', 'structure_list']),
    [data, q],
  )

  async function load() {
    setLoading(true)
    const [{ data: rows }, { data: structRows }] = await Promise.all([
      supabase.from('Concrete Works').select('*').order('concrete_work'),
      supabase.from('Structure').select('id, structure_name').order('structure_name'),
    ])
    setData((rows ?? []) as ConcreteWork[])
    setStructures((structRows ?? []) as Structure[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  function sanitizeStructureListForSave(raw: string | null | undefined): string | null {
    const master = new Set(structureNamesFromMaster)
    if (master.size === 0) return null
    const kept = parseStructureListTokens(raw).filter((t) => master.has(t))
    if (kept.length === 0) return null
    return kept.sort((a, b) => a.localeCompare(b, 'th')).join(STRUCTURE_LIST_JOIN)
  }

  async function onAdd(item: Partial<ConcreteWork>): Promise<boolean | void> {
    const name = String(item.concrete_work ?? '').trim()
    if (!name) {
      toast.error('กรุณากรอกประเภทงานคอนกรีต')
      return false
    }
    if (duplicateConcreteWorkWithin(data, name)) {
      toast.error('ประเภทงานคอนกรีตนี้มีอยู่แล้ว')
      return false
    }
    const structure_list = sanitizeStructureListForSave(item.structure_list)
    const { error } = await supabase.from('Concrete Works').insert({
      concrete_work: name,
      structure_list,
    })
    if (!error) {
      toast.success('เพิ่มสำเร็จ')
      load()
      return
    }
    toast.error(error.code === '23505' ? 'ประเภทงานคอนกรีตนี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
    return false
  }

  async function onEdit(item: ConcreteWork): Promise<boolean | void> {
    const name = String(item.concrete_work ?? '').trim()
    if (!name) {
      toast.error('กรุณากรอกประเภทงานคอนกรีต')
      return false
    }
    if (duplicateConcreteWorkWithin(data, name, item.id)) {
      toast.error('ประเภทงานคอนกรีตนี้มีอยู่แล้ว')
      return false
    }
    const structure_list = sanitizeStructureListForSave(item.structure_list)
    const { error } = await supabase.from('Concrete Works').update({
      concrete_work: name,
      structure_list,
    }).eq('id', item.id)
    if (!error) {
      toast.success('บันทึกสำเร็จ')
      load()
      return
    }
    toast.error(error.code === '23505' ? 'ประเภทงานคอนกรีตนี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
    return false
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Concrete Works').delete().eq('id', id)
    if (!error) {
      toast.success('ลบสำเร็จ')
      load()
    } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Concrete Works</h1>
      <CrudTable
        title="Concrete Work"
        data={filtered}
        loading={loading}
        columns={[
          { key: 'concrete_work', label: 'Concrete Work' },
          { key: 'structure_list', label: 'Structure List' },
        ]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Concrete Work *</Label>
              <Input value={String(formData.concrete_work ?? '')} onChange={(e) => onChange('concrete_work', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Structure list</Label>
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
          </div>
        )}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

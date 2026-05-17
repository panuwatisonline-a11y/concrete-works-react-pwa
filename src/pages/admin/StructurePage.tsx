import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { refreshAfterAdminMutation, type AdminTableLoadOptions } from '@/lib/adminTableRefresh'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { Structure } from '@/types/app.types'

function structureNameKey(name: string | null | undefined) {
  return String(name ?? '').trim().toLowerCase()
}

function duplicateStructureWithin(
  rows: Structure[],
  candidateName: string,
  excludeId?: number,
): boolean {
  const k = structureNameKey(candidateName)
  return rows.some((r) => r.id !== excludeId && structureNameKey(r.structure_name) === k)
}

export function StructurePage() {
  const [data, setData] = useState<Structure[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาชื่อโครงสร้าง…',
    ariaLabel: 'ค้นหาในตาราง Structure',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(() => filterTableRows(data, q, ['structure_name']), [data, q])

  async function load(opts?: AdminTableLoadOptions) {
    if (!opts?.background) setLoading(true)
    try {
      const { data: rows, error } = await supabase.from('Structure').select('*').order('structure_name')
      if (error) {
        console.error('Structure load:', error.message)
        toast.error('โหลดข้อมูลไม่สำเร็จ')
        return
      }
      setData(rows ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  usePullToRefreshOnLoad(() => load({ background: true }))

  async function onAdd(item: Partial<Structure>) {
    const name = String(item.structure_name ?? '').trim()
    if (!name) {
      toast.error('กรุณากรอกชื่อโครงสร้าง')
      return false
    }
    if (duplicateStructureWithin(data, name)) {
      toast.error('ชื่อโครงสร้างนี้มีอยู่แล้ว')
      return false
    }
    const { error } = await supabase.from('Structure').insert({ structure_name: name })
    if (!error) {
      toast.success('เพิ่มสำเร็จ')
      await refreshAfterAdminMutation(load)
      return
    }
    toast.error(error.code === '23505' ? 'ชื่อโครงสร้างนี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
    return false
  }

  async function onEdit(item: Structure) {
    const name = String(item.structure_name ?? '').trim()
    if (!name) {
      toast.error('กรุณากรอกชื่อโครงสร้าง')
      return false
    }
    if (duplicateStructureWithin(data, name, item.id)) {
      toast.error('ชื่อโครงสร้างนี้มีอยู่แล้ว')
      return false
    }
    const { error } = await supabase.from('Structure').update({ structure_name: name }).eq('id', item.id)
    if (!error) {
      toast.success('บันทึกสำเร็จ')
      await refreshAfterAdminMutation(load)
      return
    }
    toast.error(error.code === '23505' ? 'ชื่อโครงสร้างนี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
    return false
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Structure').delete().eq('id', id)
    if (!error) {
      toast.success('ลบสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Structure</h1>
      <CrudTable
        title="Structure"
        data={filtered}
        loading={loading}
        columns={[{ key: 'structure_name', label: 'ชื่อโครงสร้าง' }]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อโครงสร้าง *</Label>
              <Input value={String(formData.structure_name ?? '')} onChange={(e) => onChange('structure_name', e.target.value)} />
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

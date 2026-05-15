import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { Structure } from '@/types/app.types'

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

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Structure').select('*').order('structure_name')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  async function onAdd(item: Partial<Structure>) {
    const { error } = await supabase.from('Structure').insert({ structure_name: item.structure_name ?? '' })
    if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: Structure) {
    const { error } = await supabase.from('Structure').update({ structure_name: item.structure_name }).eq('id', item.id)
    if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Structure').delete().eq('id', id)
    if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้')
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

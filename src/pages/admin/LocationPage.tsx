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
import type { LocationItem } from '@/types/app.types'

export function LocationPage() {
  const [data, setData] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา Location, รายละเอียด…',
    ariaLabel: 'ค้นหาในตาราง Location',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(
    () => filterTableRows(data, q, ['location1', 'location2', 'location3', 'full_location', 'description']),
    [data, q],
  )

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Location').select('*').order('id')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  async function onAdd(item: Partial<LocationItem>) {
    const { error } = await supabase.from('Location').insert({
      location1: item.location1 ?? '',
      location2: item.location2 ?? null,
      location3: item.location3 ?? null,
      description: item.description ?? null,
    })
    if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: LocationItem) {
    const { error } = await supabase.from('Location').update({
      location1: item.location1,
      location2: item.location2,
      location3: item.location3,
      description: item.description,
    }).eq('id', item.id)
    if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Location').delete().eq('id', id)
    if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Location</h1>
      <CrudTable
        title="Location"
        data={filtered}
        loading={loading}
        columns={[
          { key: 'location1', label: 'Level 1' },
          { key: 'location2', label: 'Level 2' },
          { key: 'location3', label: 'Level 3' },
          { key: 'full_location', label: 'Full Location' },
        ]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Location 1 *</Label>
              <Input value={String(formData.location1 ?? '')} onChange={(e) => onChange('location1', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location 2</Label>
              <Input value={String(formData.location2 ?? '')} onChange={(e) => onChange('location2', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location 3</Label>
              <Input value={String(formData.location3 ?? '')} onChange={(e) => onChange('location3', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={String(formData.description ?? '')} onChange={(e) => onChange('description', e.target.value)} />
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

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ClientItem } from '@/types/app.types'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { filterTableRows } from '@/lib/tableClientFilter'

export function ClientPage() {
  const [data, setData] = useState<ClientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาชื่อบริษัท (Client)…',
    ariaLabel: 'ค้นหาในตาราง Client',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(() => filterTableRows(data, q, ['client_name']), [data, q])

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Client').select('*').order('client_name')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  async function onAdd(item: Partial<ClientItem>) {
    const { error } = await supabase.from('Client').insert({ client_name: item.client_name ?? '' })
    if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: ClientItem) {
    const { error } = await supabase.from('Client').update({ client_name: item.client_name }).eq('id', item.id)
    if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Client').delete().eq('id', id)
    if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้ (มีข้อมูลเชื่อมโยง)')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Client (Contractor)</h1>
      <CrudTable
        title="Client"
        data={filtered}
        loading={loading}
        columns={[{ key: 'client_name', label: 'ชื่อบริษัท' }]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อบริษัท *</Label>
              <Input value={String(formData.client_name ?? '')} onChange={(e) => onChange('client_name', e.target.value)} />
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

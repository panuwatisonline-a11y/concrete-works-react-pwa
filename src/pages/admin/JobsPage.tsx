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
import type { Job } from '@/types/app.types'

export function JobsPage() {
  const [data, setData] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาชื่อโครงการ…',
    ariaLabel: 'ค้นหาในตารางโครงการ',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(() => filterTableRows(data, q, ['job_name']), [data, q])

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Jobs').select('*').order('job_name')
    setData(rows ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePullToRefreshOnLoad(load)

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Jobs</h1>
      <CrudTable
        title="โครงการ"
        data={filtered}
        loading={loading}
        columns={[{ key: 'job_name', label: 'ชื่อโครงการ' }]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อโครงการ *</Label>
              <Input value={String(formData.job_name ?? '')} onChange={(e) => onChange('job_name', e.target.value)} />
            </div>
          </div>
        )}
        onAdd={async (item) => {
          const { error } = await supabase.from('Jobs').insert({ job_name: item.job_name ?? '' })
          if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
        }}
        onEdit={async (item) => {
          const { error } = await supabase.from('Jobs').update({ job_name: item.job_name }).eq('id', item.id)
          if (!error) { toast.success('บันทึกสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
        }}
        onDelete={async (id) => {
          const { error } = await supabase.from('Jobs').delete().eq('id', id)
          if (!error) { toast.success('ลบสำเร็จ'); load() } else toast.error('ไม่สามารถลบได้')
        }}
      />
    </div>
  )
}

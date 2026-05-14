import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { ConcreteWork } from '@/types/app.types'

export function ConcreteWorksPage() {
  const [data, setData] = useState<ConcreteWork[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาประเภทงานคอนกรีต, Structure list…',
    ariaLabel: 'ค้นหาในตาราง Concrete Works',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(
    () => filterTableRows(data, q, ['concrete_work', 'structure_list']),
    [data, q],
  )

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Concrete Works').select('*').order('concrete_work')
    setData((rows ?? []) as ConcreteWork[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
              <Label>Structure List (comma-separated IDs)</Label>
              <Input value={String(formData.structure_list ?? '')} onChange={(e) => onChange('structure_list', e.target.value)} />
            </div>
          </div>
        )}
        onAdd={async (item) => {
          const { error } = await supabase.from('Concrete Works').insert({ concrete_work: item.concrete_work ?? '', structure_list: item.structure_list ?? null })
          if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
        }}
        onEdit={async (item) => {
          const { error } = await supabase.from('Concrete Works').update({ concrete_work: item.concrete_work, structure_list: item.structure_list }).eq('id', item.id)
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

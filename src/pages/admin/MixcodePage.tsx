import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { MixedCode } from '@/types/app.types'

export function MixcodePage() {
  const [data, setData] = useState<MixedCode[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา Mixcode, Supplier, Strength, Slump…',
    ariaLabel: 'ค้นหาในตาราง Mixcode',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(
    () => filterTableRows(data, q, ['mixcode', 'supplier', 'strength', 'strength_type', 'slump', 'sample_type']),
    [data, q],
  )

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase.from('Mixed Code').select('*').order('mixcode')
    setData((rows ?? []) as MixedCode[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function onAdd(item: Partial<MixedCode>) {
    const { error } = await supabase.from('Mixed Code').insert({
      mixcode: item.mixcode ?? '', supplier: item.supplier ?? null,
      strength: item.strength ?? null, strength_type: item.strength_type ?? null,
      sample_type: item.sample_type ?? null, slump: item.slump ?? null,
      qty: item.qty ?? null,
    })
    if (!error) { toast.success('เพิ่มสำเร็จ'); load() } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: MixedCode) {
    const { error } = await supabase.from('Mixed Code').update({
      mixcode: item.mixcode, supplier: item.supplier, strength: item.strength,
      strength_type: item.strength_type, sample_type: item.sample_type,
      slump: item.slump, qty: item.qty,
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
        ]}
        formContent={(_item, formData, onChange) => (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mixcode *</Label>
                <Input value={String(formData.mixcode ?? '')} onChange={(e) => onChange('mixcode', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Input value={String(formData.supplier ?? '')} onChange={(e) => onChange('supplier', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label>Strength Type</Label>
                <Input value={String(formData.strength_type ?? '')} placeholder="ksc, MPa" onChange={(e) => onChange('strength_type', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sample Type</Label>
                <Input value={String(formData.sample_type ?? '')} placeholder="cube, cylinder" onChange={(e) => onChange('sample_type', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slump</Label>
                <Input value={String(formData.slump ?? '')} placeholder="7.5-10 cm" onChange={(e) => onChange('slump', e.target.value)} />
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

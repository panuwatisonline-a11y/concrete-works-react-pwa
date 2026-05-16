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

/** ความเข้ากันของความเป็นที่อยู่ 3 ชั้นต่อ Full location (ว่างและ null เทียบเหมือนกัน) */
function levelNorm(v: string | null | undefined): string {
  return String(v ?? '').trim().toLowerCase()
}

function locationTripleKey(parts: Pick<LocationItem, 'location1' | 'location2' | 'location3'>): string {
  return `${levelNorm(parts.location1)}\u001f${levelNorm(parts.location2)}\u001f${levelNorm(parts.location3)}`
}

function duplicateLocationTripleWithin(
  rows: LocationItem[],
  candidate: Pick<LocationItem, 'location1' | 'location2' | 'location3'>,
  excludeId?: number,
): boolean {
  const k = locationTripleKey(candidate)
  return rows.some((r) => r.id !== excludeId && locationTripleKey(r) === k)
}

/** แสดงตัวอย่าง Full location จาก 3 ชั้น (ไม่บันทึกทางนี้ — ตัวจริงจากฐานข้อมูล) */
function previewFullLocationFromLevels(
  location1?: string | null,
  location2?: string | null,
  location3?: string | null,
): string {
  const parts = [location1, location2, location3]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.join(' - ')
}

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

  async function onAdd(item: Partial<LocationItem>): Promise<boolean | void> {
    const l1 = String(item.location1 ?? '').trim()
    if (!l1) {
      toast.error('กรุณากรอก Location 1')
      return false
    }
    const l2 = String(item.location2 ?? '').trim()
    const l3 = String(item.location3 ?? '').trim()
    const desc = String(item.description ?? '').trim()
    const loc2 = l2 === '' ? null : l2
    const loc3 = l3 === '' ? null : l3
    if (duplicateLocationTripleWithin(data, { location1: l1, location2: loc2, location3: loc3 })) {
      toast.error('ที่ตั้งนี้มีอยู่แล้ว (Full location ซ้ำ)')
      return false
    }
    const { error } = await supabase.from('Location').insert({
      location1: l1,
      location2: loc2,
      location3: loc3,
      description: desc === '' ? null : desc,
    })
    if (!error) {
      toast.success('เพิ่มสำเร็จ')
      load()
      return
    }
    toast.error(error.code === '23505' ? 'ที่ตั้งนี้มีอยู่แล้ว (Full location ซ้ำ)' : 'เกิดข้อผิดพลาด')
    return false
  }

  async function onEdit(item: LocationItem): Promise<boolean | void> {
    const l1 = String(item.location1 ?? '').trim()
    if (!l1) {
      toast.error('กรุณากรอก Location 1')
      return false
    }
    const l2 = String(item.location2 ?? '').trim()
    const l3 = String(item.location3 ?? '').trim()
    const desc = String(item.description ?? '').trim()
    const loc2 = l2 === '' ? null : l2
    const loc3 = l3 === '' ? null : l3
    if (duplicateLocationTripleWithin(data, { location1: l1, location2: loc2, location3: loc3 }, item.id)) {
      toast.error('ที่ตั้งนี้มีอยู่แล้ว (Full location ซ้ำ)')
      return false
    }
    const { error } = await supabase.from('Location').update({
      location1: l1,
      location2: loc2,
      location3: loc3,
      description: desc === '' ? null : desc,
    }).eq('id', item.id)
    if (!error) {
      toast.success('บันทึกสำเร็จ')
      load()
      return
    }
    toast.error(error.code === '23505' ? 'ที่ตั้งนี้มีอยู่แล้ว (Full location ซ้ำ)' : 'เกิดข้อผิดพลาด')
    return false
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
              <Label className="text-[color:var(--pour-ink-2)]">
                Full Location
                <span className="ml-1 text-xs font-normal text-pour-subtle">อ่านอย่างเดียว</span>
              </Label>
              <div
                className="rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/55 px-3 py-2.5 text-sm text-[color:var(--pour-ink-1)]"
                aria-live="polite"
              >
                {previewFullLocationFromLevels(formData.location1, formData.location2, formData.location3)}
              </div>
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

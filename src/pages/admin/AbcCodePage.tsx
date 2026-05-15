import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminSegmentAccordion } from '@/components/admin/AdminSegmentAccordion'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { AbcCode, AbcCodeSegment } from '@/types/app.types'

type SegmentKey = 'ABC Code1' | 'ABC Code2' | 'ABC Code3' | 'ABC Code4'

const SEGMENT_KEYS: SegmentKey[] = ['ABC Code1', 'ABC Code2', 'ABC Code3', 'ABC Code4']

export function AbcCodePage() {
  const [tab, setTab] = useState<'segments' | 'combos'>('segments')
  const [segments, setSegments] = useState<Record<SegmentKey, AbcCodeSegment[]>>({
    'ABC Code1': [], 'ABC Code2': [], 'ABC Code3': [], 'ABC Code4': [],
  })
  const [combos, setCombos] = useState<AbcCode[]>([])
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder:
      tab === 'segments' ? 'ค้นหา Code, Description (ทุก segment)…' : 'ค้นหา Full ABC, Description…',
    ariaLabel: 'ค้นหาในหน้า ABC Code',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filteredSegments = useMemo(() => {
    const out = {} as Record<SegmentKey, AbcCodeSegment[]>
    SEGMENT_KEYS.forEach((k) => {
      out[k] = filterTableRows(segments[k], q, ['code_name', 'description'])
    })
    return out
  }, [segments, q])

  const filteredCombos = useMemo(() => filterTableRows(combos, q, ['full_abc', 'description']), [combos, q])

  async function loadSegments() {
    const keys: SegmentKey[] = ['ABC Code1', 'ABC Code2', 'ABC Code3', 'ABC Code4']
    const results = await Promise.all(keys.map((k) => supabase.from(k).select('*').order('code_name')))
    const updated: Record<SegmentKey, AbcCodeSegment[]> = { 'ABC Code1': [], 'ABC Code2': [], 'ABC Code3': [], 'ABC Code4': [] }
    keys.forEach((k, i) => { updated[k] = (results[i].data ?? []) as AbcCodeSegment[] })
    setSegments(updated)
  }

  async function loadCombos() {
    const { data } = await supabase.from('ABC Code').select('*').order('id')
    setCombos((data ?? []) as AbcCode[])
  }

  useEffect(() => { loadSegments(); loadCombos() }, [])
  usePullToRefreshOnLoad(async () => {
    await loadSegments()
    await loadCombos()
  })

  const tabs = [
    { key: 'segments' as const, label: 'Segments (Code 1-4)' },
    { key: 'combos' as const, label: 'Combinations' },
  ]

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>ABC Code</h1>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#ccf0ed] bg-white/90 p-1 shadow-sm ring-1 ring-[#ccf0ed]">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors md:px-4 md:text-sm',
              tab === key
                ? 'bg-[var(--pour-accent-muted)] text-[color:var(--pour-accent-hover)] shadow-sm'
                : 'text-[#6b7280] hover:bg-[#dcfce7] hover:text-[#111827]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'segments' && (
        <AdminSegmentAccordion
          defaultOpenId="ABC Code1"
          groups={SEGMENT_KEYS.map((key) => ({
            id: key,
            label: key,
            count: segments[key].length,
            children: (
              <CrudTable
                embedded
                title={key}
                data={filteredSegments[key]}
                columns={[{ key: 'code_name', label: 'Code' }, { key: 'description', label: 'Description' }]}
                formContent={(_item, formData, onChange) => (
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label>Code *</Label>
                      <Input value={String(formData.code_name ?? '')} onChange={(e) => onChange('code_name', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input value={String(formData.description ?? '')} onChange={(e) => onChange('description', e.target.value)} />
                    </div>
                  </div>
                )}
                onAdd={async (item) => {
                  const { error } = await supabase.from(key).insert({ code_name: item.code_name ?? '', description: item.description ?? null })
                  if (!error) { toast.success('เพิ่มสำเร็จ'); loadSegments() } else toast.error('เกิดข้อผิดพลาด')
                }}
                onEdit={async (item) => {
                  const { error } = await supabase.from(key).update({ code_name: item.code_name, description: item.description }).eq('id', item.id)
                  if (!error) { toast.success('บันทึกสำเร็จ'); loadSegments() } else toast.error('เกิดข้อผิดพลาด')
                }}
                onDelete={async (id) => {
                  const { error } = await supabase.from(key).delete().eq('id', id)
                  if (!error) { toast.success('ลบสำเร็จ'); loadSegments() } else toast.error('ไม่สามารถลบได้')
                }}
              />
            ),
          }))}
        />
      )}

      {tab === 'combos' && (
        <CrudTable
          title="ABC Code Combination"
          data={filteredCombos}
          columns={[
            { key: 'full_abc', label: 'Full ABC' },
            { key: 'description', label: 'Description' },
          ]}
          formContent={(_item, formData, onChange) => {
            const previewParts: string[] = []
            SEGMENT_KEYS.forEach((segKey, idx) => {
              const field = `abc_code${idx + 1}` as keyof AbcCode
              const id = formData[field] as number | null | undefined
              if (id == null) return
              const name = segments[segKey].find((s) => s.id === id)?.code_name
              if (name) previewParts.push(name)
            })
            const previewLine = previewParts.join('-')

            return (
            <div className="space-y-3 py-2">
              {([1, 2, 3, 4] as const).map((n) => {
                const key = `abc_code${n}` as keyof AbcCode
                const segKey = `ABC Code${n}` as SegmentKey
                const raw = formData[key] as number | null | undefined
                return (
                  <div key={n} className="space-y-1.5">
                    <Label>Code {n}</Label>
                    <Select
                      value={raw != null ? String(raw) : undefined}
                      onValueChange={(v) => onChange(key, parseInt(v, 10))}
                    >
                      <SelectTrigger><SelectValue placeholder={`เลือก Code ${n}`} /></SelectTrigger>
                      <SelectContent>
                        {segments[segKey].map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.code_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
              {previewLine ? (
                <p className="rounded-lg border border-dashed border-[#ccf0ed] bg-[#f0fdf4] px-3 py-2 text-[13px] leading-snug text-[#6b7280]">
                  <span className="font-mono text-[#374151]">{previewLine}</span>
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={String(formData.description ?? '')} onChange={(e) => onChange('description', e.target.value)} />
              </div>
            </div>
            )
          }}
          onAdd={async (item) => {
            const { full_abc: _full, ...payload } = item as Partial<AbcCode>
            const { error } = await supabase.from('ABC Code').insert(payload)
            if (!error) { toast.success('เพิ่มสำเร็จ'); loadCombos() } else toast.error('เกิดข้อผิดพลาด')
          }}
          onEdit={async (item) => {
            const { full_abc: _full, ...payload } = item
            const { error } = await supabase.from('ABC Code').update(payload).eq('id', item.id)
            if (!error) { toast.success('บันทึกสำเร็จ'); loadCombos() } else toast.error('เกิดข้อผิดพลาด')
          }}
          onDelete={async (id) => {
            const { error } = await supabase.from('ABC Code').delete().eq('id', id)
            if (!error) { toast.success('ลบสำเร็จ'); loadCombos() } else toast.error('ไม่สามารถลบได้')
          }}
        />
      )}
    </div>
  )
}

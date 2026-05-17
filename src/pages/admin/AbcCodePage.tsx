import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminSegmentAccordion } from '@/components/admin/AdminSegmentAccordion'
import { CrudTable } from '@/components/shared/CrudTable'
import { PourUnderlineTabs } from '@/components/shared/PourUnderlineTabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { app, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { reloadMasterData } from '@/lib/reloadMasterData'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { AbcCode, AbcCodeSegment } from '@/types/app.types'

type SegmentKey = 'ABC Code1' | 'ABC Code2' | 'ABC Code3' | 'ABC Code4'

const SEGMENT_KEYS: SegmentKey[] = ['ABC Code1', 'ABC Code2', 'ABC Code3', 'ABC Code4']

function normSegmentCode(code: string | null | undefined) {
  return String(code ?? '').trim().toLowerCase()
}

function duplicateSegmentCodeName(rows: { id: number; code_name: string }[], candidate: string, excludeId?: number): boolean {
  const k = normSegmentCode(candidate)
  if (!k) return false
  return rows.some((r) => r.id !== excludeId && normSegmentCode(r.code_name) === k)
}

function normComboLine(s: string) {
  return s.trim().toLowerCase()
}

function abcTupleKey(row: Partial<AbcCode>): string {
  return ([1, 2, 3, 4] as const).map((n) => {
    const v = row[`abc_code${n}` as keyof AbcCode] as number | null | undefined
    return v == null || Number.isNaN(Number(v)) ? '' : String(Number(v))
  }).join('|')
}

function previewAbcLine(row: Partial<AbcCode>, segs: Record<SegmentKey, AbcCodeSegment[]>): string {
  const parts: string[] = []
  SEGMENT_KEYS.forEach((sk, idx) => {
    const field = `abc_code${idx + 1}` as keyof AbcCode
    const id = row[field] as number | null | undefined
    if (id == null) return
    const name = segs[sk].find((s) => s.id === id)?.code_name
    if (name) parts.push(String(name).trim())
  })
  return parts.join('-')
}

function abcComboDuplicate(
  combos: AbcCode[],
  candidate: Partial<AbcCode>,
  segs: Record<SegmentKey, AbcCodeSegment[]>,
  excludeId?: number,
): boolean {
  const tupleK = abcTupleKey(candidate)
  const candLine = previewAbcLine(candidate, segs)
  const candNorm = candLine ? normComboLine(candLine) : ''
  return combos.some((c) => {
    if (c.id === excludeId) return false
    if (abcTupleKey(c) === tupleK) return true
    const existingRaw = (c.full_abc && String(c.full_abc).trim() !== '')
      ? String(c.full_abc)
      : previewAbcLine(c, segs)
    const exNorm = existingRaw ? normComboLine(existingRaw) : ''
    return Boolean(candNorm && exNorm && candNorm === exNorm)
  })
}

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

  async function refreshSegmentsAndMaster() {
    await loadSegments()
    void reloadMasterData()
  }

  async function refreshCombosAndMaster() {
    await loadCombos()
    void reloadMasterData()
  }

  useEffect(() => { void loadSegments(); void loadCombos() }, [])
  usePullToRefreshOnLoad(async () => {
    await loadSegments()
    await loadCombos()
  })

  const tabs = [
    { id: 'segments' as const, label: 'Segments (Code 1-4)' },
    { id: 'combos' as const, label: 'Combinations' },
  ]

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>ABC Code</h1>

      <PourUnderlineTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="มุมมอง ABC Code" />

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
                  const code = String(item.code_name ?? '').trim()
                  if (!code) {
                    toast.error('กรุณากรอก Code')
                    return false
                  }
                  if (duplicateSegmentCodeName(segments[key], code)) {
                    toast.error(`รหัสนี้มีอยู่แล้วใน ${key}`)
                    return false
                  }
                  const descTrim = String(item.description ?? '').trim()
                  const { error } = await supabase.from(key).insert({
                    code_name: code,
                    description: descTrim === '' ? null : descTrim,
                  })
                  if (!error) {
                    toast.success('เพิ่มสำเร็จ')
                    await refreshSegmentsAndMaster()
                    return
                  }
                  toast.error(error.code === '23505' ? `รหัสนี้มีอยู่แล้วใน ${key}` : 'เกิดข้อผิดพลาด')
                  return false
                }}
                onEdit={async (item) => {
                  const code = String(item.code_name ?? '').trim()
                  if (!code) {
                    toast.error('กรุณากรอก Code')
                    return false
                  }
                  if (duplicateSegmentCodeName(segments[key], code, item.id)) {
                    toast.error(`รหัสนี้มีอยู่แล้วใน ${key}`)
                    return false
                  }
                  const descTrim = String(item.description ?? '').trim()
                  const { error } = await supabase.from(key).update({
                    code_name: code,
                    description: descTrim === '' ? null : descTrim,
                  }).eq('id', item.id)
                  if (!error) {
                    toast.success('บันทึกสำเร็จ')
                    await refreshSegmentsAndMaster()
                    return
                  }
                  toast.error(error.code === '23505' ? `รหัสนี้มีอยู่แล้วใน ${key}` : 'เกิดข้อผิดพลาด')
                  return false
                }}
                onDelete={async (id) => {
                  const { error } = await supabase.from(key).delete().eq('id', id)
                  if (!error) {
                    toast.success('ลบสำเร็จ')
                    await refreshSegmentsAndMaster()
                  } else toast.error('ไม่สามารถลบได้')
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
                <p className="rounded-lg border border-dashed border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] px-3 py-2 text-[13px] leading-snug text-pour-muted">
                  <span className="font-mono text-[color:var(--pour-ink-1)]">{previewLine}</span>
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
            const r = item as Partial<AbcCode>
            const descTrim = String(r.description ?? '').trim()
            const payload = {
              abc_code1: r.abc_code1 ?? null,
              abc_code2: r.abc_code2 ?? null,
              abc_code3: r.abc_code3 ?? null,
              abc_code4: r.abc_code4 ?? null,
              description: descTrim === '' ? null : descTrim,
            }
            if (abcComboDuplicate(combos, payload, segments)) {
              toast.error('ชุด ABC Code หรือ Full ABC นี้มีอยู่แล้ว')
              return false
            }
            const { error } = await supabase.from('ABC Code').insert(payload)
            if (!error) {
              toast.success('เพิ่มสำเร็จ')
              await refreshCombosAndMaster()
              return
            }
            toast.error(error.code === '23505' ? 'ชุด ABC Code หรือ Full ABC นี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
            return false
          }}
          onEdit={async (item) => {
            const descTrim = String(item.description ?? '').trim()
            const payload = {
              abc_code1: item.abc_code1 ?? null,
              abc_code2: item.abc_code2 ?? null,
              abc_code3: item.abc_code3 ?? null,
              abc_code4: item.abc_code4 ?? null,
              description: descTrim === '' ? null : descTrim,
            }
            if (abcComboDuplicate(combos, payload, segments, item.id)) {
              toast.error('ชุด ABC Code หรือ Full ABC นี้มีอยู่แล้ว')
              return false
            }
            const { error } = await supabase.from('ABC Code').update(payload).eq('id', item.id)
            if (!error) {
              toast.success('บันทึกสำเร็จ')
              await refreshCombosAndMaster()
              return
            }
            toast.error(error.code === '23505' ? 'ชุด ABC Code หรือ Full ABC นี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
            return false
          }}
          onDelete={async (id) => {
            const { error } = await supabase.from('ABC Code').delete().eq('id', id)
            if (!error) {
              toast.success('ลบสำเร็จ')
              await refreshCombosAndMaster()
            } else toast.error('ไม่สามารถลบได้')
          }}
        />
      )}
    </div>
  )
}

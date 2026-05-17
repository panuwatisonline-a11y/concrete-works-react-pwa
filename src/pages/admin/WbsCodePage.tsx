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
import { reloadMasterData } from '@/lib/reloadMasterData'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { WbsCode, WbsSegment } from '@/types/app.types'

type WbsKey = 'WBS1' | 'WBS2' | 'WBS3' | 'WBS4' | 'WBS5' | 'WBS6' | 'WBS7'

const WBS_KEYS: WbsKey[] = ['WBS1', 'WBS2', 'WBS3', 'WBS4', 'WBS5', 'WBS6', 'WBS7']

function normSegmentCode(code: string | null | undefined) {
  return String(code ?? '').trim().toLowerCase()
}

/** ใน segment เดียวกัน — เปรียบเทียบ code_name */
function duplicateSegmentCodeName(rows: { id: number; code_name: string }[], candidate: string, excludeId?: number): boolean {
  const k = normSegmentCode(candidate)
  if (!k) return false
  return rows.some((r) => r.id !== excludeId && normSegmentCode(r.code_name) === k)
}

function wbsTupleKey(row: Partial<WbsCode>): string {
  return ([1, 2, 3, 4, 5, 6, 7] as const)
    .map((n) => {
      const v = row[`wbs${n}` as keyof WbsCode] as number | null | undefined
      return v == null || Number.isNaN(Number(v)) ? '' : String(Number(v))
    })
    .join('|')
}

function previewWbsLine(row: Partial<WbsCode>, segs: Record<WbsKey, WbsSegment[]>): string {
  const parts: string[] = []
  WBS_KEYS.forEach((wk, idx) => {
    const field = `wbs${idx + 1}` as keyof WbsCode
    const id = row[field] as number | null | undefined
    if (id == null) return
    const name = segs[wk].find((s) => s.id === id)?.code_name
    if (name) parts.push(String(name).trim())
  })
  return parts.join('-')
}

function normComboLine(s: string) {
  return s.trim().toLowerCase()
}

/** ซ้ำทั้งชุด segment id หรือ Full WBS (สตริง) เทียบกับแถวที่มีอยู่ */
function wbsComboDuplicate(
  combos: WbsCode[],
  candidate: Partial<WbsCode>,
  segs: Record<WbsKey, WbsSegment[]>,
  excludeId?: number,
): boolean {
  const tupleK = wbsTupleKey(candidate)
  const candLine = previewWbsLine(candidate, segs)
  const candNorm = candLine ? normComboLine(candLine) : ''
  return combos.some((c) => {
    if (c.id === excludeId) return false
    if (wbsTupleKey(c) === tupleK) return true
    const existingRaw = (c.full_wbs && String(c.full_wbs).trim() !== '')
      ? String(c.full_wbs)
      : previewWbsLine(c, segs)
    const exNorm = existingRaw ? normComboLine(existingRaw) : ''
    return Boolean(candNorm && exNorm && candNorm === exNorm)
  })
}

export function WbsCodePage() {
  const [tab, setTab] = useState<'segments' | 'combos'>('segments')
  const [segments, setSegments] = useState<Record<WbsKey, WbsSegment[]>>({
    WBS1: [], WBS2: [], WBS3: [], WBS4: [], WBS5: [], WBS6: [], WBS7: [],
  })
  const [combos, setCombos] = useState<WbsCode[]>([])
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder:
      tab === 'segments' ? 'ค้นหา Code, Description (ทุก segment)…' : 'ค้นหา Full WBS, Description…',
    ariaLabel: 'ค้นหาในหน้า WBS Code',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  async function loadSegments() {
    const keys: WbsKey[] = ['WBS1', 'WBS2', 'WBS3', 'WBS4', 'WBS5', 'WBS6', 'WBS7']
    const results = await Promise.all(keys.map((k) => supabase.from(k).select('*').order('code_name')))
    const updated: Record<WbsKey, WbsSegment[]> = { WBS1: [], WBS2: [], WBS3: [], WBS4: [], WBS5: [], WBS6: [], WBS7: [] }
    keys.forEach((k, i) => { updated[k] = (results[i].data ?? []) as WbsSegment[] })
    setSegments(updated)
  }

  async function loadCombos() {
    const { data } = await supabase.from('WBS Code').select('*').order('id')
    setCombos((data ?? []) as WbsCode[])
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

  const filteredSegments = useMemo(() => {
    const out = {} as Record<WbsKey, WbsSegment[]>
    WBS_KEYS.forEach((k) => {
      out[k] = filterTableRows(segments[k], q, ['code_name', 'description'])
    })
    return out
  }, [segments, q])

  const filteredCombos = useMemo(() => filterTableRows(combos, q, ['full_wbs', 'description']), [combos, q])

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>WBS Code</h1>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] p-1 shadow-sm ring-1 ring-[color:var(--pour-surface-border)]">
        {[{ key: 'segments' as const, label: 'Segments (WBS 1-7)' }, { key: 'combos' as const, label: 'Combinations' }].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors pour-desktop:px-4 pour-desktop:text-sm',
              tab === key
                ? 'bg-[var(--pour-accent-muted)] text-[color:var(--pour-accent-hover)] shadow-sm'
                : 'text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'segments' && (
        <AdminSegmentAccordion
          defaultOpenId="WBS1"
          groups={WBS_KEYS.map((key) => ({
            id: key,
            label: key,
            count: segments[key].length,
            children: (
              <CrudTable<WbsSegment>
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
        <CrudTable<WbsCode>
          title="WBS Code Combination"
          data={filteredCombos}
          columns={[
            { key: 'full_wbs', label: 'Full WBS' },
            { key: 'description', label: 'Description' },
          ]}
          formContent={(_item, formData, onChange) => {
            const previewParts: string[] = []
            WBS_KEYS.forEach((k, idx) => {
              const field = `wbs${idx + 1}` as keyof WbsCode
              const id = formData[field] as number | null | undefined
              if (id == null) return
              const name = segments[k].find((s) => s.id === id)?.code_name
              if (name) previewParts.push(name)
            })
            const previewLine = previewParts.join('-')

            return (
            <div className="space-y-3 py-2">
              {WBS_KEYS.map((k, i) => {
                const field = `wbs${i + 1}` as keyof WbsCode
                const raw = formData[field] as number | null | undefined
                return (
                  <div key={k} className="space-y-1.5">
                    <Label>{k}</Label>
                    <Select
                      value={raw != null ? String(raw) : undefined}
                      onValueChange={(v) => onChange(field, parseInt(v, 10))}
                    >
                      <SelectTrigger><SelectValue placeholder={`เลือก ${k}`} /></SelectTrigger>
                      <SelectContent>
                        {segments[k].map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.code_name}</SelectItem>)}
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
            const r = item as Partial<WbsCode>
            const descTrim = String(r.description ?? '').trim()
            const payload = {
              wbs1: r.wbs1 ?? null,
              wbs2: r.wbs2 ?? null,
              wbs3: r.wbs3 ?? null,
              wbs4: r.wbs4 ?? null,
              wbs5: r.wbs5 ?? null,
              wbs6: r.wbs6 ?? null,
              wbs7: r.wbs7 ?? null,
              description: descTrim === '' ? null : descTrim,
            }
            if (wbsComboDuplicate(combos, payload, segments)) {
              toast.error('ชุด WBS หรือ Full WBS นี้มีอยู่แล้ว')
              return false
            }
            const { error } = await supabase.from('WBS Code').insert(payload)
            if (!error) {
              toast.success('เพิ่มสำเร็จ')
              await refreshCombosAndMaster()
              return
            }
            toast.error(error.code === '23505' ? 'ชุด WBS หรือ Full WBS นี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
            return false
          }}
          onEdit={async (item) => {
            const descTrim = String(item.description ?? '').trim()
            const payload = {
              wbs1: item.wbs1 ?? null,
              wbs2: item.wbs2 ?? null,
              wbs3: item.wbs3 ?? null,
              wbs4: item.wbs4 ?? null,
              wbs5: item.wbs5 ?? null,
              wbs6: item.wbs6 ?? null,
              wbs7: item.wbs7 ?? null,
              description: descTrim === '' ? null : descTrim,
            }
            if (wbsComboDuplicate(combos, payload, segments, item.id)) {
              toast.error('ชุด WBS หรือ Full WBS นี้มีอยู่แล้ว')
              return false
            }
            const { error } = await supabase.from('WBS Code').update(payload).eq('id', item.id)
            if (!error) {
              toast.success('บันทึกสำเร็จ')
              await refreshCombosAndMaster()
              return
            }
            toast.error(error.code === '23505' ? 'ชุด WBS หรือ Full WBS นี้มีอยู่แล้ว' : 'เกิดข้อผิดพลาด')
            return false
          }}
          onDelete={async (id) => {
            const { error } = await supabase.from('WBS Code').delete().eq('id', id)
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

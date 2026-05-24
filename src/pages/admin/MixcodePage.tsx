import { useState, useMemo, useCallback } from 'react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { supabase } from '@/lib/supabase'
import { CrudTable } from '@/components/shared/CrudTable'
import { PourUnderlineTabs } from '@/components/shared/PourUnderlineTabs'
import { StructureListMultiSelect } from '@/components/shared/StructureListMultiSelect'
import { MixCodeBalancePanel } from '@/components/mixcode/MixCodeBalancePanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'
import { cn, formatVolumeNumber } from '@/lib/utils'
import { app, layout, rq } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useScopedPageLoad } from '@/hooks/useScopedPageLoad'
import { refreshAfterAdminMutation, type AdminTableLoadOptions } from '@/lib/adminTableRefresh'
import { fetchScopedRows, insertScopedRow } from '@/lib/jobScopeQueries'
import { filterTableRows } from '@/lib/tableClientFilter'
import {
  buildMixcodeBalanceRows,
  fetchMixcodeUsageByMixcodeId,
  type MixcodeUsageById,
} from '@/lib/mixcodeBalance'
import type { MixedCode, Structure } from '@/types/app.types'

const MIXCODE_SAMPLE_TYPE_PRESETS = [
  'Cylinder 15x30 cm.',
  'Cylinder 10x10 cm.',
  'Cylinder 6x10 cm.',
  'Cube 15x15x15 cm.',
  'Cube 10x10x10 cm.',
  'Cube 5x5x5 cm.',
] as const

type MixcodeTab = 'master' | 'balance'

const MIXCODE_TABS = [
  { id: 'master' as const, label: 'Mixcode' },
  { id: 'balance' as const, label: 'Balance' },
]

export function MixcodePage() {
  const [tab, setTab] = useState<MixcodeTab>('master')
  const [data, setData] = useState<MixedCode[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
  const [usageByMixcodeId, setUsageByMixcodeId] = useState<Record<number, MixcodeUsageById>>({})
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder:
      tab === 'balance'
        ? 'ค้นหา Supplier, Mix Code, Structure…'
        : 'ค้นหา Mixcode, Supplier, Structure list, Strength, Slump, ปริมาณ…',
    ariaLabel: tab === 'balance' ? 'ค้นหาในตาราง Balance' : 'ค้นหาในตาราง Mixcode',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const confirmVolumeByMixcodeId = useMemo(() => {
    const m: Record<number, number> = {}
    for (const [id, u] of Object.entries(usageByMixcodeId)) {
      m[Number(id)] = u.used
    }
    return m
  }, [usageByMixcodeId])

  const balanceRows = useMemo(
    () => buildMixcodeBalanceRows(data, usageByMixcodeId),
    [data, usageByMixcodeId],
  )

  const balanceRowsFiltered = useMemo(
    () =>
      filterTableRows(balanceRows, q, [
        'supplier',
        'mixcode',
        'strengthLabel',
        'sampleType',
        'slump',
        'structureList',
      ]),
    [balanceRows, q],
  )

  const structureNamesFromMaster = useMemo(
    () =>
      structures
        .map((s) => s.structure_name?.trim())
        .filter((v): v is string => Boolean(v))
        .sort((a, b) => a.localeCompare(b, 'th')),
    [structures],
  )

  const filtered = useMemo(
    () =>
      filterTableRows(data, q, [
        'mixcode',
        'supplier',
        'structure_list',
        'strength',
        'strength_type',
        'slump',
        'sample_type',
        'qty',
      ]),
    [data, q],
  )

  const supplierSuggestions = useMemo(() => {
    const s = new Set<string>()
    for (const r of data) {
      const v = r.supplier?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th'))
  }, [data])

  const strengthTypeSuggestions = useMemo(() => {
    const s = new Set<string>(['ksc.', 'MPa.'])
    for (const r of data) {
      const v = r.strength_type?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th', { sensitivity: 'base' }))
  }, [data])

  const sampleTypeSelectOptions = useMemo(() => {
    const predefined = [...MIXCODE_SAMPLE_TYPE_PRESETS]
    const seen = new Set<string>(predefined)
    const extra: string[] = []
    for (const r of data) {
      const v = r.sample_type?.trim()
      if (v && !seen.has(v)) {
        seen.add(v)
        extra.push(v)
      }
    }
    extra.sort((a, b) => a.localeCompare(b, 'th'))
    return [...predefined, ...extra]
  }, [data])

  const slumpSuggestions = useMemo(() => {
    const s = new Set<string>(['7.5-10 cm', '12±2 cm', '15±2 cm', '18±2 cm', '20±2 cm'])
    for (const r of data) {
      const v = r.slump?.trim()
      if (v) s.add(v)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'th', { numeric: true }))
  }, [data])

  const load = useCallback(async (opts?: AdminTableLoadOptions) => {
    if (!opts?.background) setLoading(true)
    try {
      const [{ data: rows, error: rowsErr }, { data: structRows, error: structErr }, usage] =
        await Promise.all([
          fetchScopedRows<MixedCode>('Mixed Code', { column: 'mixcode' }),
          fetchScopedRows<Structure>('Structure', { column: 'structure_name' }),
          fetchMixcodeUsageByMixcodeId(supabase),
        ])
      if (rowsErr || structErr) {
        console.error('Mixcode load:', rowsErr?.message ?? structErr?.message)
        toast.error('โหลดข้อมูลไม่สำเร็จ')
        return
      }
      setData((rows ?? []) as MixedCode[])
      setStructures((structRows ?? []) as Structure[])
      setUsageByMixcodeId(usage)
    } catch (e) {
      console.error('Mixcode usage load:', e)
      toast.error('โหลดยอด Request ไม่สำเร็จ')
      setUsageByMixcodeId({})
    } finally {
      setLoading(false)
    }
  }, [])

  useScopedPageLoad(load)

  useDataSyncRefetch(['Mixed Code', 'Structure', 'Request', '*'], load)

  usePullToRefreshOnLoad(() => load({ background: true }))

  async function onAdd(item: Partial<MixedCode>) {
    const { error } = await insertScopedRow('Mixed Code', {
      mixcode: item.mixcode ?? '',
      supplier: item.supplier ?? null,
      strength: item.strength ?? null,
      strength_type: item.strength_type ?? null,
      sample_type: item.sample_type ?? null,
      slump: item.slump ?? null,
      structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null,
      qty: item.qty ?? null,
    })
    if (!error) {
      toast.success('เพิ่มสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onEdit(item: MixedCode) {
    const { error } = await supabase
      .from('Mixed Code')
      .update({
        mixcode: item.mixcode,
        supplier: item.supplier,
        strength: item.strength,
        strength_type: item.strength_type,
        sample_type: item.sample_type,
        slump: item.slump,
        structure_list: item.structure_list?.trim() ? item.structure_list.trim() : null,
        qty: item.qty,
      })
      .eq('id', item.id)
    if (!error) {
      toast.success('บันทึกสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('เกิดข้อผิดพลาด')
  }

  async function onDelete(id: number) {
    const { error } = await supabase.from('Mixed Code').delete().eq('id', id)
    if (!error) {
      toast.success('ลบสำเร็จ')
      await refreshAfterAdminMutation(load)
    } else toast.error('ไม่สามารถลบได้')
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>Mixcode</h1>

      <PourUnderlineTabs
        tabs={MIXCODE_TABS}
        value={tab}
        onChange={setTab}
        ariaLabel="Mixcode views"
      />

      {tab === 'master' ? (
        <CrudTable
          title="Mixcode"
          data={filtered}
          loading={loading}
          groupBy={{
            groupKey: (r) => r.supplier?.trim() ?? '',
            renderGroupHeading: (key, count) =>
              key.trim() ? (
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span>{key}</span>
                  <span className="text-xs font-medium tabular-nums text-[color:var(--pour-ink-2)]">
                    {count} รายการ
                  </span>
                </span>
              ) : (
                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[color:var(--pour-ink-2)]">ไม่ระบุ Supplier</span>
                  <span className="text-xs font-medium tabular-nums text-[color:var(--pour-ink-2)]">
                    {count} รายการ
                  </span>
                </span>
              ),
          }}
          sortWithinGroup={(a, b) => a.mixcode.localeCompare(b.mixcode, 'th')}
          columns={[
            { key: 'supplier', label: 'Supplier' },
            { key: 'mixcode', label: 'Mixcode' },
            {
              key: 'strength',
              label: 'Strength',
              render: (r) => `${r.strength ?? '-'} ${r.strength_type ?? ''}`,
            },
            { key: 'slump', label: 'Slump' },
            { key: 'sample_type', label: 'Sample Type' },
            {
              key: 'qty',
              label: 'QUANTITY',
              render: (r) =>
                r.qty != null && !Number.isNaN(r.qty) ? `${formatVolumeNumber(r.qty)} cu.m` : '—',
            },
            {
              key: 'remaining_qty_display',
              label: 'REMAINING',
              render: (r) => {
                const used = confirmVolumeByMixcodeId[r.id] ?? 0
                const pending = usageByMixcodeId[r.id]?.pending ?? 0
                const cap = r.qty
                const capOk = cap != null && !Number.isNaN(cap)
                if (!capOk) return <span className="text-pour-muted">—</span>
                const remaining = cap - used - pending
                return (
                  <span className={cn(remaining < 0 && 'font-medium text-rose-600')}>
                    {formatVolumeNumber(remaining)} cu.m
                  </span>
                )
              },
            },
            {
              key: 'structure_list',
              label: 'Structure list',
              render: (r) => (r.structure_list?.trim() ? r.structure_list : '—'),
            },
          ]}
          formContent={(item, formData, onChange) => (
            <div className="space-y-3">
              <div className={layout.formGridDialog}>
                <div className={layout.formField}>
                  <Label>Supplier</Label>
                  <datalist id="mixcode-supplier-suggestions">
                    {supplierSuggestions.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <Input
                    list="mixcode-supplier-suggestions"
                    autoComplete="off"
                    value={String(formData.supplier ?? '')}
                    onChange={(e) => onChange('supplier', e.target.value)}
                  />
                </div>
                <div className={layout.formField}>
                  <Label>Mixcode *</Label>
                  <Input
                    value={String(formData.mixcode ?? '')}
                    onChange={(e) => onChange('mixcode', e.target.value)}
                  />
                </div>
              </div>
              <div className={layout.formField}>
                <Label>Structure list</Label>
                <p className="text-xs text-pour-muted">
                  {structureNamesFromMaster.length > 0
                    ? `เลือกจากโครงสร้างในหน้า Structure ทั้งหมด ${structureNamesFromMaster.length} รายการ`
                    : 'ยังไม่มีโครงสร้าง — เพิ่มที่หน้า Structure ก่อน'}
                </p>
                {!loading ? (
                  <StructureListMultiSelect
                    inDialog
                    value={String(formData.structure_list ?? '')}
                    onChange={(v) => onChange('structure_list', v)}
                    masterNames={structureNamesFromMaster}
                  />
                ) : (
                  <p className="text-sm text-pour-muted">กำลังโหลดรายการโครงสร้าง…</p>
                )}
              </div>
              <div className={layout.formGridDialog}>
                <div className={layout.formField}>
                  <Label>Strength</Label>
                  <Input
                    type="number"
                    value={
                      formData.strength != null && !Number.isNaN(formData.strength as number)
                        ? String(formData.strength)
                        : ''
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      onChange('strength', v === '' ? undefined : parseFloat(v))
                    }}
                  />
                </div>
                <div className={layout.formField}>
                  <Label>Strength Type</Label>
                  <datalist id="mixcode-strength-type-suggestions">
                    {strengthTypeSuggestions.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <Input
                    list="mixcode-strength-type-suggestions"
                    autoComplete="off"
                    value={String(formData.strength_type ?? '')}
                    placeholder="ksc., MPa."
                    onChange={(e) => onChange('strength_type', e.target.value)}
                  />
                </div>
              </div>
              <div className={layout.formGridDialog}>
                <div className={layout.formField}>
                  <Label>Sample Type</Label>
                  <SearchableSelect
                    value={String(formData.sample_type ?? '').trim()}
                    onValueChange={(v) => onChange('sample_type', v)}
                    placeholder="เลือกขนาดตัวอย่าง"
                    triggerClassName="h-auto min-h-10 text-left text-[15px]"
                    listClassName="max-h-[min(50dvh,18rem)]"
                    options={sampleTypeSelectOptions.map((opt) => ({ value: opt, label: opt }))}
                  />
                </div>
                <div className={layout.formField}>
                  <Label>Slump</Label>
                  <datalist id="mixcode-slump-suggestions">
                    {slumpSuggestions.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <Input
                    list="mixcode-slump-suggestions"
                    autoComplete="off"
                    value={String(formData.slump ?? '')}
                    placeholder="7.5-10 cm"
                    onChange={(e) => onChange('slump', e.target.value)}
                  />
                </div>
              </div>
              <div className={layout.formField}>
                <Label>ปริมาณ (m³)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="เช่น 100"
                  value={
                    formData.qty != null && !Number.isNaN(formData.qty as number)
                      ? String(formData.qty)
                      : ''
                  }
                  onChange={(e) => {
                    const v = e.target.value
                    onChange('qty', v === '' ? null : parseFloat(v))
                  }}
                />
                {item != null &&
                  (() => {
                    const used = confirmVolumeByMixcodeId[item.id] ?? 0
                    const pending = usageByMixcodeId[item.id]?.pending ?? 0
                    const raw = formData.qty ?? item.qty
                    const capOk = raw != null && !Number.isNaN(raw as number)
                    const cap = capOk ? Number(raw) : null
                    return (
                      <div className="mt-2 rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/60 px-3 py-2 text-xs text-[color:var(--pour-ink-1)]">
                        <div className="flex justify-between gap-2 tabular-nums">
                          <span className="text-pour-muted">Σ Confirm (Complete)</span>
                          <span>{formatVolumeNumber(used)} cu.m</span>
                        </div>
                        <div className="mt-1 flex justify-between gap-2 tabular-nums">
                          <span className="text-pour-muted">Σ Pending (Active)</span>
                          <span>{formatVolumeNumber(pending)} cu.m</span>
                        </div>
                        {cap != null && (
                          <div className="mt-1 flex justify-between gap-2 tabular-nums">
                            <span className="text-pour-muted">Balance (PO − used − pending)</span>
                            <span
                              className={cn(
                                cap - used - pending < 0 && 'font-medium text-rose-600',
                              )}
                            >
                              {formatVolumeNumber(cap - used - pending)} cu.m
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
              </div>
            </div>
          )}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <MixCodeBalancePanel rows={balanceRowsFiltered} loading={loading} />
      )}
    </div>
  )
}

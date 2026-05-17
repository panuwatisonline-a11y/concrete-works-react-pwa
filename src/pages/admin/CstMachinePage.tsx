import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchCompressionMachines } from '@/lib/cstData'
import {
  CST_MACHINE_DECIMAL_PLACES,
  cstFormatNumber,
  cstRoundNumber,
  formatCstNumericInput,
} from '@/lib/cstForm'

const CST_MACHINE_NUM_STEP = (10 ** -CST_MACHINE_DECIMAL_PLACES).toFixed(
  CST_MACHINE_DECIMAL_PLACES,
)
import { refreshAfterAdminMutation, type AdminTableLoadOptions } from '@/lib/adminTableRefresh'
import { CrudTable } from '@/components/shared/CrudTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import { formatDate } from '@/lib/utils'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { filterTableRows } from '@/lib/tableClientFilter'
import type { CompressionMachine } from '@/types/app.types'

function machineNameKey(name: string | null | undefined) {
  return String(name ?? '').trim().toLowerCase()
}

function duplicateMachineWithin(
  rows: CompressionMachine[],
  candidateName: string,
  excludeId?: number,
): boolean {
  const k = machineNameKey(candidateName)
  if (!k) return false
  return rows.some((r) => r.id !== excludeId && machineNameKey(r.machine) === k)
}

function parseOptionalNumber(value: unknown): number | null {
  const s = String(value ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? cstRoundNumber(n, CST_MACHINE_DECIMAL_PLACES) : null
}

function factorPreview(k1: number | null, k2: number | null): string {
  if (k1 == null && k2 == null) return '—'
  const a = k1 != null ? cstFormatNumber(k1, CST_MACHINE_DECIMAL_PLACES) : ''
  const b =
    k2 != null
      ? k2 >= 0
        ? `+${cstFormatNumber(k2, CST_MACHINE_DECIMAL_PLACES)}`
        : cstFormatNumber(k2, CST_MACHINE_DECIMAL_PLACES)
      : ''
  return `x${a}${b}`
}

function buildPayload(item: Partial<CompressionMachine>) {
  const machine = String(item.machine ?? '').trim()
  return {
    machine: machine || null,
    serial: String(item.serial ?? '').trim() || null,
    k1: parseOptionalNumber(item.k1),
    k2: parseOptionalNumber(item.k2),
    cal_date: String(item.cal_date ?? '').trim() || null,
  }
}

export function CstMachinePage() {
  const [data, setData] = useState<CompressionMachine[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาชื่อเครื่อง, Serial, Factor…',
    ariaLabel: 'ค้นหาในตารางเครื่องอัด CST',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const filtered = useMemo(
    () => filterTableRows(data, q, ['machine', 'serial', 'k_display', 'k']),
    [data, q],
  )

  async function load(opts?: AdminTableLoadOptions) {
    if (!opts?.background) setLoading(true)
    try {
      const rows = await fetchCompressionMachines()
      setData(rows)
    } catch (e) {
      console.error('CST Machine load:', e)
      toast.error('โหลดรายการเครื่องอัดไม่สำเร็จ')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])
  usePullToRefreshOnLoad(() => load({ background: true }))

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>CST Machine</h1>
      <CrudTable<CompressionMachine>
        title="เครื่องอัดคอนกรีต (Compression Machine)"
        data={filtered}
        loading={loading}
        columns={[
          { key: 'machine', label: 'ชื่อเครื่อง' },
          { key: 'serial', label: 'Serial No.' },
          {
            key: 'k_display',
            label: 'Factor',
            render: (row) => row.k_display?.trim() || row.k?.trim() || factorPreview(row.k1, row.k2),
          },
          {
            key: 'cal_date',
            label: 'วันสอบเทียบ',
            render: (row) => (row.cal_date ? formatDate(`${row.cal_date}T12:00:00`) : '—'),
          },
        ]}
        formContent={(_item, formData, onChange) => {
          const k1 = parseOptionalNumber(formData.k1)
          const k2 = parseOptionalNumber(formData.k2)
          return (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>ชื่อเครื่อง *</Label>
                <Input
                  value={String(formData.machine ?? '')}
                  onChange={(e) => onChange('machine', e.target.value)}
                  placeholder="เช่น UTM-01"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Serial No.</Label>
                <Input
                  value={String(formData.serial ?? '')}
                  onChange={(e) => onChange('serial', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>k1</Label>
                  <Input
                    type="number"
                    step={CST_MACHINE_NUM_STEP}
                    inputMode="decimal"
                    className="tabular-nums"
                    value={formData.k1 != null ? String(formData.k1) : ''}
                    onChange={(e) => onChange('k1', e.target.value === '' ? null : e.target.value)}
                    onBlur={(e) => {
                      const formatted = formatCstNumericInput(
                        e.target.value,
                        CST_MACHINE_DECIMAL_PLACES,
                      )
                      if (formatted !== e.target.value) {
                        onChange('k1', formatted === '' ? null : formatted)
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>k2</Label>
                  <Input
                    type="number"
                    step={CST_MACHINE_NUM_STEP}
                    inputMode="decimal"
                    className="tabular-nums"
                    value={formData.k2 != null ? String(formData.k2) : ''}
                    onChange={(e) => onChange('k2', e.target.value === '' ? null : e.target.value)}
                    onBlur={(e) => {
                      const formatted = formatCstNumericInput(
                        e.target.value,
                        CST_MACHINE_DECIMAL_PLACES,
                      )
                      if (formatted !== e.target.value) {
                        onChange('k2', formatted === '' ? null : formatted)
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-pour-muted">
                Factor (ตัวอย่าง): <span className="font-medium text-[color:var(--pour-ink-1)]">{factorPreview(k1, k2)}</span>
              </p>
              <div className="space-y-1.5">
                <Label>วันสอบเทียบ</Label>
                <Input
                  type="date"
                  value={String(formData.cal_date ?? '').slice(0, 10)}
                  onChange={(e) => onChange('cal_date', e.target.value || null)}
                />
              </div>
            </div>
          )
        }}
        onAdd={async (item) => {
          const payload = buildPayload(item)
          if (!payload.machine) {
            toast.error('กรุณากรอกชื่อเครื่อง')
            return false
          }
          if (duplicateMachineWithin(data, payload.machine)) {
            toast.error('ชื่อเครื่องนี้มีอยู่แล้ว')
            return false
          }
          const { error } = await supabase.from('Compression Machine').insert(payload)
          if (error) {
            toast.error('เกิดข้อผิดพลาด')
            return false
          }
          toast.success('เพิ่มสำเร็จ')
          await refreshAfterAdminMutation(load)
        }}
        onEdit={async (item) => {
          const payload = buildPayload(item)
          if (!payload.machine) {
            toast.error('กรุณากรอกชื่อเครื่อง')
            return false
          }
          if (duplicateMachineWithin(data, payload.machine, item.id)) {
            toast.error('ชื่อเครื่องนี้มีอยู่แล้ว')
            return false
          }
          const { error } = await supabase.from('Compression Machine').update(payload).eq('id', item.id)
          if (error) {
            toast.error('เกิดข้อผิดพลาด')
            return false
          }
          toast.success('บันทึกสำเร็จ')
          await refreshAfterAdminMutation(load)
        }}
        onDelete={async (id) => {
          const { error } = await supabase.from('Compression Machine').delete().eq('id', id)
          if (error) {
            toast.error(
              error.code === '23503'
                ? 'ไม่สามารถลบได้ — มีผลทดสอบ CST อ้างอิงเครื่องนี้อยู่'
                : 'ไม่สามารถลบได้',
            )
            return
          }
          toast.success('ลบสำเร็จ')
          await refreshAfterAdminMutation(load)
        }}
      />
    </div>
  )
}

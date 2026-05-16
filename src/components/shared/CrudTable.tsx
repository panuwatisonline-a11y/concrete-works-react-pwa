import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmModal } from './ConfirmModal'
import { Edit, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminDataRow, app, rq, tableCompact } from '@/lib/requestUi'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => ReactNode
}

export interface CrudTableGroupBy<T> {
  groupKey: (row: T) => string
  /** เรียงลำดับกลุ่ม (สตริงคีย์จาก `groupKey`) — ว่างควรไปท้าย */
  compareGroups?: (groupKeyA: string, groupKeyB: string) => number
  renderGroupHeading: (groupKey: string, rowCountInGroup: number) => ReactNode
}

interface CrudTableProps<T extends { id: number }> {
  title: string
  data: T[]
  columns: Column<T>[]
  formContent: (
    item: T | null,
    formData: Partial<T>,
    onChange: (key: keyof T, value: unknown) => void,
  ) => ReactNode
  onAdd: (item: Partial<T>) => Promise<void | boolean>
  onEdit: (item: T) => Promise<void | boolean>
  onDelete: (id: number) => Promise<void>
  canDelete?: (item: T) => boolean
  loading?: boolean
  /** ใช้ใน accordion — ไม่แสดงหัวข้อซ้ำ มีแค่ปุ่มเพิ่ม */
  embedded?: boolean
  /** เมื่อกำหนด จัดกลุ่มแถวในตารางเดสก์ท็อปและการ์ดมือถือตามผลจาก `groupKey` */
  groupBy?: CrudTableGroupBy<T>
  /** เรียงแถวภายในกลุ่มเดียวกัน (ใช้หลัง `compareGroups`) */
  sortWithinGroup?: (a: T, b: T) => number
}

function renderCell<T>(col: Column<T>, row: T) {
  return col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '-')
}

export function CrudTable<T extends { id: number }>({
  title,
  data,
  columns,
  formContent,
  onAdd,
  onEdit,
  onDelete,
  canDelete,
  loading,
  embedded = false,
  groupBy,
  sortWithinGroup,
}: CrudTableProps<T>) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditItem(null)
    setFormData({})
    setModalOpen(true)
  }
  function openEdit(item: T) {
    setEditItem(item)
    setFormData({ ...item })
    setModalOpen(true)
  }

  function handleChange(key: keyof T, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  /** ถ้าคืนค่า `false` จะไม่ปิดโมดัล (เช่น validation fail) — อย่างอื่นรวม `undefined`: ปิดหลังรันสำเร็จ */
  async function handleSave() {
    setSaving(true)
    try {
      const result = editItem
        ? await onEdit({ ...editItem, ...formData } as T)
        : await onAdd(formData)
      if (result !== false) setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    await onDelete(deleteId)
    setDeleteId(null)
  }

  const emptyState = (
    <div className={rq.dataRowEmpty}>{loading ? 'กำลังโหลด…' : 'ไม่มีข้อมูล'}</div>
  )

  const displayRows = useMemo(() => {
    const rows = [...data]
    if (!groupBy) return rows
    const cg =
      groupBy.compareGroups ??
      ((a: string, b: string) => {
        const ta = a.trim()
        const tb = b.trim()
        const ea = ta === ''
        const eb = tb === ''
        if (ea && eb) return 0
        if (ea) return 1
        if (eb) return -1
        return ta.localeCompare(tb, 'th')
      })
    rows.sort((a, b) => {
      const ka = groupBy.groupKey(a)
      const kb = groupBy.groupKey(b)
      const g = cg(ka, kb)
      if (g !== 0) return g
      if (sortWithinGroup) return sortWithinGroup(a, b)
      return a.id - b.id
    })
    return rows
  }, [data, groupBy, sortWithinGroup])

  const groupRowCounts = useMemo(() => {
    if (!groupBy) return new Map<string, number>()
    const m = new Map<string, number>()
    for (const row of displayRows) {
      const k = groupBy.groupKey(row)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [displayRows, groupBy])

  return (
    <div className="space-y-4">
      {embedded ? (
        <div className="flex justify-end">
          <Button size="sm" className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            เพิ่ม
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold tracking-tight text-[#111827] pour-desktop:text-lg">{title}</h2>
          <Button size="sm" className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            เพิ่ม
          </Button>
        </div>
      )}

      <div className={app.mobileCardStackCompact}>
        {loading || displayRows.length === 0 ? (
          emptyState
        ) : (
          displayRows.map((row, i) => {
            const showGroup =
              groupBy &&
              (i === 0 || groupBy.groupKey(displayRows[i - 1]!) !== groupBy.groupKey(row))
            const gKey = groupBy?.groupKey(row) ?? ''
            return (
              <Fragment key={row.id}>
                {showGroup ? (
                  <div
                    className={cn(
                      'rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/80 px-3 py-1.5 text-xs text-[color:var(--pour-ink-0)] backdrop-blur-sm',
                      i > 0 && 'mt-2',
                    )}
                  >
                    {groupBy!.renderGroupHeading(gKey, groupRowCounts.get(gKey) ?? 0)}
                  </div>
                ) : null}
                <div className={adminDataRow.card}>
                  <dl className={adminDataRow.fields}>
                    {columns.map((col) => (
                      <div key={String(col.key)}>
                        <dt className={adminDataRow.label}>{col.label}</dt>
                        <dd className={cn(adminDataRow.value, 'mt-px min-w-0 break-words')}>{renderCell(col, row)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className={adminDataRow.actions}>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(row)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {(!canDelete || canDelete(row)) && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-[#9ca3af]" />
                      </Button>
                    )}
                  </div>
                </div>
              </Fragment>
            )
          })
        )}
      </div>

      <div className={app.tableWrapDesktop}>
        <table className={tableCompact.table}>
          <thead className={tableCompact.head}>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="font-medium">
                  {col.label}
                </th>
              ))}
              <th className="font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className={tableCompact.body}>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className={tableCompact.emptyCell}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={tableCompact.emptyCell}>
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => {
                const showGroup =
                  groupBy &&
                  (i === 0 || groupBy.groupKey(displayRows[i - 1]!) !== groupBy.groupKey(row))
                const gKey = groupBy?.groupKey(row) ?? ''
                return (
                  <Fragment key={row.id}>
                    {showGroup ? (
                      <tr
                        className="border-t border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/85 text-[color:var(--pour-ink-0)] first:border-t-0"
                      >
                        <td
                          colSpan={columns.length + 1}
                          className="px-1.5 py-1 align-middle text-[11px] font-semibold leading-snug text-[color:var(--pour-ink-0)] sm:px-2"
                        >
                          {groupBy!.renderGroupHeading(gKey, groupRowCounts.get(gKey) ?? 0)}
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      {columns.map((col) => (
                        <td key={String(col.key)} className="min-w-0 break-words text-[#374151]">
                          {renderCell(col, row)}
                        </td>
                      ))}
                      <td>
                        <div className="flex gap-0.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => openEdit(row)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {(!canDelete || canDelete(row)) && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => setDeleteId(row.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-[#9ca3af]" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setModalOpen(false)
            setEditItem(null)
            setFormData({})
          }
        }}
      >
        <DialogContent
          className={cn(
            'flex max-h-[min(90dvh,calc(100dvh-1.5rem))] flex-col gap-0 overflow-hidden p-0',
            'w-[calc(100vw-1rem)] max-w-lg sm:max-w-xl pour-desktop:max-w-2xl',
            'rounded-[14px] border-[color:var(--glass-border-subtle)]',
          )}
        >
          <DialogHeader className="min-w-0 shrink-0 space-y-1.5 px-5 pb-0 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="break-words text-[#111827]">
              {editItem ? 'แก้ไข' : 'เพิ่ม'} {title}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
            {editItem != null && (
              <div className="mb-4 rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/70 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">ID</p>
                <p className="font-mono text-sm tabular-nums text-[#374151]">{editItem.id}</p>
              </div>
            )}
            <div className="min-w-0">
              {formContent(
                editItem,
                formData,
                handleChange as (key: keyof T, value: unknown) => void,
              )}
            </div>
          </div>
          <DialogFooter className="mx-0 shrink-0 gap-2 border-t border-[color:var(--glass-border-subtle)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              variant="outline"
              size="modalAction"
              className="rounded-xl border-[color:var(--glass-border-subtle)]"
              onClick={() => setModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              size="modalAction"
              className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ยืนยันการลบ"
        description="ข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบ"
        confirmVariant="destructive"
      />
    </div>
  )
}

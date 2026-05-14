import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmModal } from './ConfirmModal'
import { Edit, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { app, rq } from '@/lib/requestUi'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => ReactNode
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
  onAdd: (item: Partial<T>) => Promise<void>
  onEdit: (item: T) => Promise<void>
  onDelete: (id: number) => Promise<void>
  canDelete?: (item: T) => boolean
  loading?: boolean
  /** ใช้ใน accordion — ไม่แสดงหัวข้อซ้ำ มีแค่ปุ่มเพิ่ม */
  embedded?: boolean
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

  async function handleSave() {
    setSaving(true)
    if (editItem) await onEdit({ ...editItem, ...formData } as T)
    else await onAdd(formData)
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete() {
    if (deleteId === null) return
    await onDelete(deleteId)
    setDeleteId(null)
  }

  const emptyState = (
    <div className={rq.dataRowEmpty}>{loading ? 'กำลังโหลด…' : 'ไม่มีข้อมูล'}</div>
  )

  return (
    <div className="space-y-4">
      {embedded ? (
        <div className="flex justify-end">
          <Button size="sm" className="rounded-xl shadow-sm shadow-blue-500/20" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            เพิ่ม
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold tracking-tight text-[#111827] md:text-lg">{title}</h2>
          <Button size="sm" className="rounded-xl shadow-sm shadow-blue-500/20" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            เพิ่ม
          </Button>
        </div>
      )}

      <div className={app.mobileCardStack}>
        {loading || data.length === 0 ? (
          emptyState
        ) : (
          data.map((row) => (
            <div key={row.id} className={rq.dataRowCard}>
              <dl className={rq.dataRowFields}>
                {columns.map((col) => (
                  <div key={String(col.key)}>
                    <dt className={rq.dataRowLabel}>{col.label}</dt>
                    <dd className={cn(rq.dataRowValue, 'mt-px min-w-0 break-words')}>{renderCell(col, row)}</dd>
                  </div>
                ))}
              </dl>
              <div className={rq.dataRowActions}>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(row)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {(!canDelete || canDelete(row)) && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setDeleteId(row.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-[#9ca3af]" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={app.tableWrapDesktop}>
        <table className={app.table}>
          <thead className={app.tableHead}>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="font-medium">
                  {col.label}
                </th>
              ))}
              <th className="font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className={cn(app.tableBody, app.tableRowHover)}>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-[#6b7280]">
                  กำลังโหลด…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-[#6b7280]">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="text-[#374151]">
                      {renderCell(col, row)}
                    </td>
                  ))}
                  <td>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="rounded-lg" onClick={() => openEdit(row)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(!canDelete || canDelete(row)) && (
                        <Button size="icon" variant="ghost" className="rounded-lg" onClick={() => setDeleteId(row.id)}>
                          <Trash2 className="h-4 w-4 text-[#9ca3af]" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
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
        <DialogContent className="max-w-lg rounded-[14px] border-[#e2e6ec]">
          <DialogHeader>
            <DialogTitle className="text-[#111827]">
              {editItem ? 'แก้ไข' : 'เพิ่ม'} {title}
            </DialogTitle>
          </DialogHeader>
          {editItem != null && (
            <div className="rounded-lg border border-[#e2e6ec] bg-[#f5f6f8]/70 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">ID</p>
              <p className="font-mono text-sm tabular-nums text-[#374151]">{editItem.id}</p>
            </div>
          )}
          {formContent(
            editItem,
            formData,
            handleChange as (key: keyof T, value: unknown) => void,
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl border-[#e2e6ec]" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button className="rounded-xl shadow-sm shadow-blue-500/25" onClick={handleSave} disabled={saving}>
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

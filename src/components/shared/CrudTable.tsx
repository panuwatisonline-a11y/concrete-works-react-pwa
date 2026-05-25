import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useResizableTableColumns } from '@/hooks/useResizableTableColumns'
import { ResizableTableToolbar } from '@/components/shared/ResizableTableToolbar'
import { TableClampText } from '@/components/shared/TableClampText'
import type { ResizableTableColumnConfig } from '@/lib/resizableTableColumns'
import { canEditMasterData } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useSuperAdminShowsAllJobs } from '@/hooks/useSuperAdminShowsAllJobs'
import { createJobScopeGroupBy, jobScopeColumn, rowHasJobScope, type JobScopedRow } from '@/lib/jobScopeDisplay'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmModal } from './ConfirmModal'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import Add from '@mui/icons-material/Add'
import { AppIcon } from '@/components/icons/AppIcon'
import { cn } from '@/lib/utils'
import { adminDataRow, app, modal, rq, tableCompact } from '@/lib/requestUi'
import { pourPcUi } from '@/lib/pourPcScale'

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
  /** Super Admin + ทุกโครงการ: แสดงคอลัมน์/จัดกลุ่มตาม Job (`auto` = เปิดอัตโนมัติ, `false` = ปิด) */
  jobScopeView?: boolean | 'auto'
  /** คีย์บันทึกความกว้างคอลัมน์ — ไม่ระบุจะใช้ `crud:{title}` */
  resizableTableId?: string
}

function renderCell<T>(col: Column<T>, row: T) {
  return col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '-')
}

function renderDesktopCell<T>(col: Column<T>, row: T) {
  const value = renderCell(col, row)
  if (col.render) return value
  const text = String(value)
  return <TableClampText text={text} />
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
  jobScopeView = 'auto',
  resizableTableId,
}: CrudTableProps<T>) {
  const role = useAuthStore((s) => s.role)
  const jobs = useMasterDataStore((s) => s.jobs)
  const superAdminShowsAllJobs = useSuperAdminShowsAllJobs()
  const showJobScope =
    jobScopeView !== false &&
    (jobScopeView === true || superAdminShowsAllJobs) &&
    rowHasJobScope(data as unknown as JobScopedRow[])

  const effectiveColumns = useMemo((): Column<T>[] => {
    if (!showJobScope) return columns
    return [jobScopeColumn(jobs) as Column<T>, ...columns]
  }, [columns, showJobScope, jobs])

  const effectiveGroupBy = useMemo((): CrudTableGroupBy<T> | undefined => {
    if (groupBy) return groupBy
    if (!showJobScope) return undefined
    return createJobScopeGroupBy(jobs) as CrudTableGroupBy<T>
  }, [groupBy, showJobScope, jobs])

  const readOnly = !canEditMasterData(role)
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

  const resizeTableKey = resizableTableId ?? `crud:${title}`
  const resizeColumnConfigs = useMemo((): ResizableTableColumnConfig[] => {
    const cols: ResizableTableColumnConfig[] = effectiveColumns.map((col) => ({
      id: String(col.key),
      defaultWidth: 140,
    }))
    cols.push({ id: '__actions', defaultWidth: 96, resizable: false })
    return cols
  }, [effectiveColumns])

  const tableResize = useResizableTableColumns(resizeTableKey, resizeColumnConfigs)

  const emptyState = (
    <div className={rq.dataRowEmpty}>{loading ? 'กำลังโหลด…' : 'ไม่มีข้อมูล'}</div>
  )

  const displayRows = useMemo(() => {
    const rows = [...data]
    if (!effectiveGroupBy) return rows
    const cg =
      effectiveGroupBy.compareGroups ??
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
      const ka = effectiveGroupBy.groupKey(a)
      const kb = effectiveGroupBy.groupKey(b)
      const g = cg(ka, kb)
      if (g !== 0) return g
      if (sortWithinGroup) return sortWithinGroup(a, b)
      return a.id - b.id
    })
    return rows
  }, [data, effectiveGroupBy, sortWithinGroup])

  const groupRowCounts = useMemo(() => {
    if (!effectiveGroupBy) return new Map<string, number>()
    const m = new Map<string, number>()
    for (const row of displayRows) {
      const k = effectiveGroupBy.groupKey(row)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [displayRows, effectiveGroupBy])

  return (
    <div className={cn('min-w-0 space-y-4', embedded && 'space-y-3')}>
      {embedded ? (
        <div className="flex justify-end">
          {!readOnly ? (
            <Button size="sm" className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20" onClick={openAdd}>
              <AppIcon icon={Add} size="sm" className="mr-1" />
              เพิ่ม
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium text-[color:var(--pour-ink-0)]">{title}</h2>
          {!readOnly ? (
            <Button size="sm" className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20" onClick={openAdd}>
              <AppIcon icon={Add} size="sm" className="mr-1" />
              เพิ่ม
            </Button>
          ) : null}
        </div>
      )}

      <div className={app.mobileCardStackCompact}>
        {loading || displayRows.length === 0 ? (
          emptyState
        ) : (
          displayRows.map((row, i) => {
            const showGroup =
              effectiveGroupBy &&
              (i === 0 || effectiveGroupBy.groupKey(displayRows[i - 1]!) !== effectiveGroupBy.groupKey(row))
            const gKey = effectiveGroupBy?.groupKey(row) ?? ''
            return (
              <Fragment key={row.id}>
                {showGroup ? (
                  <div
                    className={cn(
                      'rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/80 px-3 py-1.5 text-xs text-[color:var(--pour-ink-0)] backdrop-blur-sm',
                      i > 0 && 'mt-2',
                    )}
                  >
                    {effectiveGroupBy!.renderGroupHeading(gKey, groupRowCounts.get(gKey) ?? 0)}
                  </div>
                ) : null}
                <div className={adminDataRow.card}>
                  <dl className={adminDataRow.fields}>
                    {effectiveColumns.map((col) => (
                      <div key={String(col.key)}>
                        <dt className={adminDataRow.label}>{col.label}</dt>
                        <dd className={cn(adminDataRow.value, 'mt-px min-w-0 break-words')}>{renderCell(col, row)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className={adminDataRow.actions}>
                    {!readOnly ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(row)}>
                          <AppIcon icon={Edit} size="xs" sx={{ fontSize: 14 }} />
                        </Button>
                        {(!canDelete || canDelete(row)) && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteId(row.id)}>
                            <AppIcon icon={Delete} size="xs" sx={{ fontSize: 14 }} className="text-pour-subtle" />
                          </Button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </Fragment>
            )
          })
        )}
      </div>

      <ResizableTableToolbar
        onReset={tableResize.resetWidths}
        className="mb-1 hidden justify-end pour-desktop:flex"
      />
      <div
        className={cn(
          embedded ? app.tableWrapNested : app.tableWrapDesktop,
          app.tableWrapResizable,
        )}
      >
        <table className={cn(tableCompact.table, pourPcUi.tableResizable)}>
          {tableResize.colGroup}
          <thead className={tableCompact.head}>
            <tr>
              {effectiveColumns.map((col) =>
                tableResize.renderHeadCell(String(col.key), col.label, { className: 'font-medium' }),
              )}
              {tableResize.renderHeadCell('__actions', 'Actions', {
                className: cn('font-medium', pourPcUi.colActions),
              })}
            </tr>
          </thead>
          <tbody className={tableCompact.body}>
            {loading ? (
              <tr>
                <td colSpan={effectiveColumns.length + 1} className={tableCompact.emptyCell}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={effectiveColumns.length + 1} className={tableCompact.emptyCell}>
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => {
                const showGroup =
                  effectiveGroupBy &&
                  (i === 0 || effectiveGroupBy.groupKey(displayRows[i - 1]!) !== effectiveGroupBy.groupKey(row))
                const gKey = effectiveGroupBy?.groupKey(row) ?? ''
                return (
                  <Fragment key={row.id}>
                    {showGroup ? (
                      <tr
                        className="border-t border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/85 text-[color:var(--pour-ink-0)] first:border-t-0"
                      >
                        <td
                          colSpan={effectiveColumns.length + 1}
                          className="px-2.5 py-2 align-middle text-xs font-semibold leading-snug text-[color:var(--pour-ink-0)] sm:px-3 sm:text-sm"
                        >
                          {effectiveGroupBy!.renderGroupHeading(gKey, groupRowCounts.get(gKey) ?? 0)}
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      {effectiveColumns.map((col) => (
                        <td key={String(col.key)} className="min-w-0 text-[color:var(--pour-ink-1)]">
                          {renderDesktopCell(col, row)}
                        </td>
                      ))}
                      <td className={pourPcUi.colActions}>
                        {!readOnly ? (
                          <div className="flex shrink-0 gap-0.5">
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => openEdit(row)}>
                              <AppIcon icon={Edit} size="xs" sx={{ fontSize: 14 }} />
                            </Button>
                            {(!canDelete || canDelete(row)) && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => setDeleteId(row.id)}>
                                <AppIcon icon={Delete} size="xs" sx={{ fontSize: 14 }} className="text-pour-subtle" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[color:var(--pour-ink-3)]">—</span>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) {
              setModalOpen(false)
              setEditItem(null)
              setFormData({})
            }
          }}
        >
          <DialogContent className={cn(modal.shell, modal.lg, 'rounded-2xl border-[color:var(--glass-border-subtle)]')}>
            <DialogHeader className={modal.header}>
              <DialogTitle className={cn(modal.title, 'break-words')}>
                {editItem ? 'แก้ไข' : 'เพิ่ม'} {title}
              </DialogTitle>
            </DialogHeader>
            <div className={modal.body}>
              {editItem != null && (
                <div className="mb-5 rounded-lg border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-pour-subtle">ID</p>
                  <p className="font-mono text-base tabular-nums text-[color:var(--pour-ink-1)]">{editItem.id}</p>
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
            <DialogFooter className={modal.footer}>
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
      ) : null}

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

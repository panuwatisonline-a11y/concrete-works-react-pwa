import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import {
  ProfileIdListMultiSelect,
  ProfileIdSingleSelect,
  profilePickerOptionsFromProfiles,
} from '@/components/shared/ProfileIdListMultiSelect'
import { toast } from 'sonner'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import Add from '@mui/icons-material/Add'
import { AppIcon } from '@/components/icons/AppIcon'
import { cn } from '@/lib/utils'
import { app, modal, rq, tableCompact } from '@/lib/requestUi'
import { pourPcUi } from '@/lib/pourPcScale'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useScopedPageLoad } from '@/hooks/useScopedPageLoad'
import {
  formatMemberList,
  inspectorPrimaryLabel,
  memberIdsIncludingPrimary,
  parseProfileIdList,
  profilePickerLabel,
  replaceInspectorMembers,
  serializeProfileIdList,
  type InspectorWithMembers,
} from '@/lib/inspectorScope'
import { canEditMasterData } from '@/lib/permissions'
import {
  applyScopeToQuery,
  deleteScopedRowById,
  insertScopedRowReturning,
  scopedSelect,
  updateScopedRowById,
} from '@/lib/jobScopeQueries'
import { resolveJobName } from '@/lib/jobScopeDisplay'
import { useSuperAdminShowsAllJobs } from '@/hooks/useSuperAdminShowsAllJobs'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/types/app.types'

function inspectorNameKey(name: string) {
  return name.trim().toLowerCase()
}

export function InspectorPage() {
  const role = useAuthStore((s) => s.role)
  const jobs = useMasterDataStore((s) => s.jobs)
  const showJobColumn = useSuperAdminShowsAllJobs()
  const canEdit = canEditMasterData(role)
  const [rows, setRows] = useState<InspectorWithMembers[]>([])
  const [profileOptions, setProfileOptions] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState<InspectorWithMembers | null>(null)
  const [primaryProfileId, setPrimaryProfileId] = useState('')
  const [memberIdsValue, setMemberIdsValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาชื่อ Inspector, สมาชิก…',
    ariaLabel: 'ค้นหาในตาราง Inspector',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  const pickerOptions = useMemo(
    () => profilePickerOptionsFromProfiles(profileOptions),
    [profileOptions],
  )
  const labelByProfileId = useMemo(() => new Map(pickerOptions.map((o) => [o.id, o.label])), [pickerOptions])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let list = rows
    if (t) {
      list = rows.filter((r) => {
        const blob = [inspectorPrimaryLabel(r), formatMemberList(r.members)].join(' ').toLowerCase()
        return blob.includes(t)
      })
    }
    if (!showJobColumn) return list
    return [...list].sort(
      (a, b) =>
        resolveJobName(a.job_id, jobs).localeCompare(resolveJobName(b.job_id, jobs), 'th') || a.id - b.id,
    )
  }, [rows, q, showJobColumn, jobs])

  async function load(opts?: { background?: boolean }) {
    if (!opts?.background) setLoading(true)
    try {
      const [inspRes, profRes] = await Promise.all([
        scopedSelect('Inspector').order('inspector_name'),
        applyScopeToQuery(
          supabase.from('profiles').select('id, fname, lname, employee_id, role, status').order('fname'),
        ),
      ])
      if (inspRes.error || profRes.error) {
        toast.error('โหลดข้อมูลไม่สำเร็จ')
        return
      }
      const inspectors = (inspRes.data ?? []) as InspectorWithMembers[]
      const { data: members, error: memErr } = await supabase
        .from('Inspector_Member')
        .select('inspector_id, profile_id')
      if (memErr) {
        toast.error('โหลดสมาชิก Inspector ไม่สำเร็จ')
        return
      }

      const profMap = new Map(
        ((profRes.data ?? []) as Profile[]).map((p) => [p.id, p]),
      )
      const byInspector = new Map<number, InspectorWithMembers['members']>()
      for (const m of members ?? []) {
        const prof = profMap.get(m.profile_id)
        const list = byInspector.get(m.inspector_id) ?? []
        list.push({
          profile_id: m.profile_id,
          fname: prof?.fname ?? null,
          lname: prof?.lname ?? null,
          employee_id: prof?.employee_id ?? null,
          role: prof?.role ?? null,
        })
        byInspector.set(m.inspector_id, list)
      }

      setRows(
        inspectors.map((i) => {
          const row = i as InspectorWithMembers
          const primaryId = row.primary_profile_id
          const prof = primaryId ? profMap.get(primaryId) : undefined
          const primary = primaryId
            ? {
                profile_id: primaryId,
                fname: prof?.fname ?? null,
                lname: prof?.lname ?? null,
                employee_id: prof?.employee_id ?? null,
                role: prof?.role ?? null,
              }
            : null
          return {
            ...row,
            primary,
            members: byInspector.get(i.id) ?? [],
          }
        }),
      )
      setProfileOptions((profRes.data ?? []) as Profile[])
    } finally {
      setLoading(false)
    }
  }

  useScopedPageLoad(load)

  useDataSyncRefetch(['Inspector', 'Inspector_Member', 'profiles', '*'], load)
  usePullToRefreshOnLoad(() => load({ background: true }))

  function handlePrimaryChange(id: string) {
    setPrimaryProfileId(id)
    const order = pickerOptions.map((o) => o.id)
    setMemberIdsValue((prev) => memberIdsIncludingPrimary(prev, id, order))
  }

  function openAdd() {
    setEditRow(null)
    setPrimaryProfileId('')
    setMemberIdsValue('')
    setModalOpen(true)
  }

  function openEdit(row: InspectorWithMembers) {
    setEditRow(row)
    const primary = row.primary_profile_id ?? ''
    setPrimaryProfileId(primary)
    const order = pickerOptions.map((o) => o.id)
    const memberIds = row.members.map((m) => m.profile_id)
    setMemberIdsValue(
      memberIdsIncludingPrimary(serializeProfileIdList(memberIds, order), primary, order),
    )
    setModalOpen(true)
  }

  async function handleSave() {
    const primaryId = primaryProfileId.trim()
    if (!primaryId) {
      toast.error('กรุณาเลือก Inspector (คนหนึ่ง)')
      return
    }
    const prof = profileOptions.find((p) => p.id === primaryId)
    const inspectorName = prof
      ? profilePickerLabel(prof)
      : labelByProfileId.get(primaryId) ?? primaryId
    const dup = rows.some(
      (r) =>
        r.primary_profile_id === primaryId ||
        (inspectorNameKey(r.inspector_name) === inspectorNameKey(inspectorName) && r.id !== editRow?.id),
    )
    if (dup) {
      toast.error('คนนี้เป็นหัวสาย Inspector อยู่แล้ว')
      return
    }

    const profileIds = parseProfileIdList(memberIdsValue)
    setSaving(true)
    try {
      if (editRow) {
        const { error } = await updateScopedRowById('Inspector', editRow.id, {
          inspector_name: inspectorName,
          primary_profile_id: primaryId,
        })
        if (error) throw error
        await replaceInspectorMembers(editRow.id, profileIds)
        toast.success('บันทึกแล้ว')
      } else {
        const { data, error } = await insertScopedRowReturning('Inspector', {
          inspector_name: inspectorName,
          primary_profile_id: primaryId,
        })
        if (error) throw error
        if (!data) throw new Error('เพิ่ม Inspector ไม่สำเร็จ')
        await replaceInspectorMembers(data.id, profileIds)
        toast.success('เพิ่ม Inspector แล้ว')
      }
      setModalOpen(false)
      await load({ background: true })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return
    const { error } = await deleteScopedRowById('Inspector', deleteId)
    setDeleteId(null)
    if (error) {
      toast.error('ไม่สามารถลบได้ — อาจมีผู้ใช้ผูกสายนี้อยู่')
      return
    }
    toast.success('ลบแล้ว')
    await load({ background: true })
  }

  return (
    <div className={app.pageAdmin}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={rq.heroTitle}>Inspector</h1>
        {canEdit ? (
          <Button type="button" size="sm" onClick={openAdd}>
            <AppIcon icon={Add} size="sm" className="mr-1.5" />
            เพิ่ม Inspector
          </Button>
        ) : null}
      </div>

      <p className="mb-4 text-sm text-pour-muted">
        ช่องแรกเลือกหัวสาย (role Inspector — อนุมัติคำขอของสายนี้) ช่องสองเลือกคนจองใน list (หลายคน) — เลือกหัวสายซ้ำใน list ได้ถ้าทำงานแทนหรือควบพื้นที่
      </p>

      {loading ? (
        <p className="text-sm text-pour-muted">กำลังโหลด…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[color:var(--glass-border-subtle)] px-4 py-10 text-center text-sm text-pour-muted">
          {q.trim() ? 'ไม่พบรายการ' : 'ยังไม่มี Inspector — กดเพิ่มเพื่อเริ่มต้น'}
        </p>
      ) : (
        <>
          <div className={app.tableWrapDesktop}>
            <table className={tableCompact.table}>
              <thead className={tableCompact.head}>
                <tr>
                  {showJobColumn ? <th>โครงการ</th> : null}
                  <th>หัวสาย (Inspector)</th>
                  <th>สมาชิกใน list</th>
                  <th>จำนวน</th>
                  <th className={cn('text-right', pourPcUi.colActions)}>จัดการ</th>
                </tr>
              </thead>
              <tbody className={tableCompact.body}>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {showJobColumn ? (
                      <td className="min-w-0 break-words text-[color:var(--pour-ink-1)]">
                        {resolveJobName(row.job_id, jobs)}
                      </td>
                    ) : null}
                    <td className="min-w-0 break-words font-medium">{inspectorPrimaryLabel(row)}</td>
                    <td className="min-w-0 break-words text-[color:var(--pour-ink-1)]">{formatMemberList(row.members)}</td>
                    <td className="tabular-nums">{row.members.length}</td>
                    <td className={cn('text-right', pourPcUi.colActions)}>
                      {canEdit ? (
                        <div className="flex shrink-0 justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)}>
                            <AppIcon icon={Edit} size="sm" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}>
                            <AppIcon icon={Delete} size="sm" className="text-rose-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-pour-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 pour-desktop:hidden">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-4"
              >
                <p className="font-semibold text-[color:var(--pour-ink-0)]">{inspectorPrimaryLabel(row)}</p>
                {showJobColumn ? (
                  <p className="mt-1 text-xs font-medium text-[color:var(--pour-accent-hover)]">
                    {resolveJobName(row.job_id, jobs)}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-pour-muted">{formatMemberList(row.members)}</p>
                <p className="mt-0.5 text-xs text-pour-subtle">{row.members.length} คน</p>
                {canEdit ? (
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                      แก้ไข
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDeleteId(row.id)}>
                      ลบ
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className={cn(modal.shell, modal.lg, 'rounded-2xl border-[color:var(--glass-border-subtle)]')}>
          <DialogHeader className={modal.header}>
            <DialogTitle className={modal.title}>{editRow ? 'แก้ไข Inspector' : 'เพิ่ม Inspector'}</DialogTitle>
          </DialogHeader>
          <div className={cn(modal.body, 'space-y-4')}>
            <div className="space-y-1.5">
              <Label>Inspector (เลือกคนหนึ่ง) *</Label>
              {loading && profileOptions.length === 0 ? (
                <p className="text-sm text-pour-muted">กำลังโหลดรายชื่อ…</p>
              ) : pickerOptions.length === 0 ? (
                <p className="text-sm text-rose-600">ไม่พบรายชื่อในระบบ</p>
              ) : (
                <ProfileIdSingleSelect
                  inDialog
                  alwaysExpanded
                  value={primaryProfileId}
                  onChange={handlePrimaryChange}
                  options={pickerOptions}
                  placeholder="เลือกหัวสาย · ชื่อ · รหัสพนักงาน"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>คนใน list (เลือกได้หลายคน)</Label>
              <p className="text-xs text-pour-muted">
                เลือกหัวสายซ้ำใน list ได้ — กรณีทำงานแทนหรือควบพื้นที่
              </p>
              {loading && profileOptions.length === 0 ? (
                <p className="text-sm text-pour-muted">กำลังโหลดรายชื่อ…</p>
              ) : pickerOptions.length === 0 ? (
                <p className="text-sm text-rose-600">ไม่พบรายชื่อในระบบ</p>
              ) : (
                <ProfileIdListMultiSelect
                  inDialog
                  alwaysExpanded
                  value={memberIdsValue}
                  onChange={setMemberIdsValue}
                  options={pickerOptions}
                  highlightIds={primaryProfileId ? [primaryProfileId] : []}
                  placeholder="เลือกสมาชิกใน list"
                />
              )}
            </div>
          </div>
          <DialogFooter className={modal.footer}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="ลบ Inspector?"
        description="สมาชิกใน list จะถูกลบ — หัวสายและคนใน list ต้องกำหนดใหม่ถ้าสร้างสายใหม่"
        confirmLabel="ลบ"
        confirmVariant="destructive"
      />
    </div>
  )
}

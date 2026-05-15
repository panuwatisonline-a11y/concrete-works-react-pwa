import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { app, rq } from '@/lib/requestUi'
import type { Profile, UserRole } from '@/types/app.types'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { Edit, Trash2 } from 'lucide-react'

const ROLES: UserRole[] = ['user', 'manager', 'admin']
const ROLE_LABELS: Record<string, string> = { user: 'User', manager: 'Manager', admin: 'Admin' }
const ROLE_COLORS: Record<string, string> = { user: 'secondary', manager: 'default', admin: 'destructive' }
/** Radix Select.Item cannot use value=""; reserve empty selection for placeholder UX. */
const SELECT_NONE = '__none__'

export function UsersPage() {
  const { clients, jobs } = useMasterDataStore()
  const currentProfileId = useAuthStore((s) => s.profile?.id)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [draftRole, setDraftRole] = useState<UserRole>('user')
  const [draftClient, setDraftClient] = useState(SELECT_NONE)
  const [draftJob, setDraftJob] = useState(SELECT_NONE)
  const [saving, setSaving] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา รหัสพนักงาน ชื่อ นามสกุล Role Client โครงการ…',
    ariaLabel: 'ค้นหาในตารางผู้ใช้',
    showRequestFilterButton: false,
    search: userSearch,
    onSearchChange: setUserSearch,
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data ?? []) as Profile[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!editUser) return
    setDraftRole(editUser.role)
    setDraftClient(editUser.client_id != null ? String(editUser.client_id) : SELECT_NONE)
    setDraftJob(editUser.job_id != null ? String(editUser.job_id) : SELECT_NONE)
  }, [editUser])

  function clientLabel(u: Profile) {
    if (u.client_name) return u.client_name
    if (u.client_id != null) return clients.find((c) => c.id === u.client_id)?.client_name ?? '-'
    return '-'
  }

  function jobLabel(u: Profile) {
    if (u.job_id == null) return '-'
    return jobs.find((j) => j.id === u.job_id)?.job_name ?? '-'
  }

  const filteredUsers = useMemo(() => {
    const t = userSearch.trim().toLowerCase()
    if (!t) return users
    return users.filter((u) => {
      const c = clientLabel(u)
      const j = jobLabel(u)
      const blob = [u.employee_id, u.fname, u.lname, u.role, c, j].join(' ').toLowerCase()
      return blob.includes(t)
    })
  }, [users, userSearch, clients, jobs])

  async function saveEdit() {
    if (!editUser) return
    const cid = draftClient === SELECT_NONE ? null : Number.parseInt(draftClient, 10)
    const jid = draftJob === SELECT_NONE ? null : Number.parseInt(draftJob, 10)
    const client = cid != null ? clients.find((c) => c.id === cid) : undefined
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        role: draftRole,
        client_id: cid,
        client_name: client?.client_name ?? null,
        job_id: jid,
      })
      .eq('id', editUser.id)
    setSaving(false)
    if (error) {
      toast.error(error.message || 'บันทึกไม่สำเร็จ')
      return
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editUser.id
          ? { ...u, role: draftRole, client_id: cid, client_name: client?.client_name ?? null, job_id: jid }
          : u,
      ),
    )
    toast.success('บันทึกการแก้ไขเรียบร้อย')
    setEditUser(null)
  }

  async function confirmDelete() {
    if (deleteUserId === null) return
    const { error } = await supabase.from('profiles').delete().eq('id', deleteUserId)
    if (error) {
      toast.error(error.message || 'ลบไม่สำเร็จ (อาจมีข้อมูลเชื่อมโยงหรือสิทธิ์ไม่เพียงพอ)')
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
    toast.success('ลบผู้ใช้งานแล้ว')
    setDeleteUserId(null)
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>จัดการผู้ใช้งาน ({filteredUsers.length}{userSearch.trim() ? ` / ${users.length}` : ''})</h1>

      <div className={app.mobileCardStack}>
        {loading ? (
          <div className={rq.dataRowEmpty}>กำลังโหลด…</div>
        ) : filteredUsers.length === 0 ? (
          <div className={rq.dataRowEmpty}>
            {users.length === 0 ? 'ไม่มีผู้ใช้' : 'ไม่พบผู้ใช้ที่ตรงกับคำค้น'}
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div key={u.id} className={rq.dataRowCard}>
              <dl className="space-y-1.5">
                <div>
                  <dt className={rq.dataRowLabel}>ชื่อ-นามสกุล</dt>
                  <dd className={cn(rq.dataRowValue, 'font-semibold')}>
                    {[u.fname, u.lname].filter(Boolean).join(' ') || '-'}
                  </dd>
                </div>
                <div>
                  <dt className={rq.dataRowLabel}>รหัสพนักงาน</dt>
                  <dd className="font-pour-mono text-[13px] text-[#374151]">{u.employee_id ?? '-'}</dd>
                </div>
                <div>
                  <dt className={cn(rq.dataRowLabel, 'mb-0.5')}>Role</dt>
                  <dd>
                    <Badge
                      variant={ROLE_COLORS[u.role] as 'default' | 'secondary' | 'destructive'}
                      className="text-xs"
                    >
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className={rq.dataRowLabel}>Client</dt>
                  <dd className={cn(rq.dataRowValue, 'text-[#374151]')}>{clientLabel(u)}</dd>
                </div>
                <div>
                  <dt className={rq.dataRowLabel}>โครงการ</dt>
                  <dd className={cn(rq.dataRowValue, 'text-[#374151]')}>{jobLabel(u)}</dd>
                </div>
                <div>
                  <dt className={rq.dataRowLabel}>วันที่สมัคร</dt>
                  <dd className={cn(rq.dataRowValue, 'text-[#374151]')}>{formatDate(u.created_at)}</dd>
                </div>
              </dl>
              <div className={rq.dataRowActions}>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setEditUser(u)}
                  aria-label="แก้ไข"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {u.id !== currentProfileId && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setDeleteUserId(u.id)}
                    aria-label="ลบ"
                  >
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
              {['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'Role', 'Client', 'โครงการ', 'วันที่สมัคร', 'การจัดการ'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(app.tableBody, app.tableRowHover)}>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#6b7280]">
                  กำลังโหลด…
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#6b7280]">
                  {users.length === 0 ? 'ไม่มีผู้ใช้' : 'ไม่พบผู้ใช้ที่ตรงกับคำค้น'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="min-w-0 break-words px-3 py-2 font-mono text-xs">{u.employee_id ?? '-'}</td>
                  <td className="min-w-0 break-words px-3 py-2">{[u.fname, u.lname].filter(Boolean).join(' ') || '-'}</td>
                  <td className="min-w-0 px-3 py-2">
                    <Badge
                      variant={ROLE_COLORS[u.role] as 'default' | 'secondary' | 'destructive'}
                      className="text-xs"
                    >
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </td>
                  <td className="min-w-0 max-w-[12rem] break-words px-3 py-2 text-[#374151] sm:max-w-[200px]" title={clientLabel(u)}>
                    {clientLabel(u)}
                  </td>
                  <td className="min-w-0 max-w-[12rem] break-words px-3 py-2 text-[#374151] sm:max-w-[220px]" title={jobLabel(u)}>
                    {jobLabel(u)}
                  </td>
                  <td className="min-w-0 whitespace-nowrap text-xs text-[#6b7280]">{formatDate(u.created_at)}</td>
                  <td className="shrink-0 whitespace-nowrap">
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => setEditUser(u)}
                        aria-label="แก้ไข"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {u.id !== currentProfileId && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() => setDeleteUserId(u.id)}
                          aria-label="ลบ"
                        >
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
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null)
        }}
      >
        <DialogContent className="max-w-lg rounded-[14px] border-[#e2e6ec]">
          <DialogHeader className="min-w-0 pr-10 text-left sm:pr-12">
            <DialogTitle className="break-words text-[#111827]">แก้ไขผู้ใช้งาน</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="min-w-0 space-y-4">
              <p className="break-words text-sm leading-snug text-[#6b7280]">
                {[editUser.fname, editUser.lname].filter(Boolean).join(' ') || editUser.employee_id || editUser.id}
              </p>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>Role</p>
                <Select value={draftRole} onValueChange={(v) => setDraftRole(v as UserRole)}>
                  <SelectTrigger className="h-auto min-h-9 w-full whitespace-normal py-2 text-left text-sm [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(50dvh,18rem)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>Client</p>
                <Select value={draftClient} onValueChange={setDraftClient}>
                  <SelectTrigger className="h-auto min-h-9 w-full whitespace-normal py-2 text-left text-sm [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words">
                    <SelectValue placeholder="ไม่ระบุ" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(50dvh,18rem)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    <SelectItem value={SELECT_NONE}>ไม่ระบุ</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>โครงการ</p>
                <Select value={draftJob} onValueChange={setDraftJob}>
                  <SelectTrigger className="h-auto min-h-9 w-full whitespace-normal py-2 text-left text-sm [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words">
                    <SelectValue placeholder="ไม่ระบุ" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(50dvh,18rem)] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    <SelectItem value={SELECT_NONE}>ไม่ระบุ</SelectItem>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={String(j.id)}>
                        {j.job_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-[#e2e6ec] sm:w-auto"
              onClick={() => setEditUser(null)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="w-full rounded-xl shadow-sm shadow-blue-500/25 sm:w-auto"
              onClick={() => void saveEdit()}
              disabled={saving || !editUser}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => void confirmDelete()}
        title="ยืนยันการลบผู้ใช้งาน"
        description="จะลบเฉพาะข้อมูลโปรไฟล์ในระบบนี้ บัญชีล็อกอินอาจยังอยู่ที่ผู้ให้บริการ — ข้อมูลที่เชื่อมโยงอาจทำให้ลบไม่ได้"
        confirmLabel="ลบ"
        confirmVariant="destructive"
      />
    </div>
  )
}

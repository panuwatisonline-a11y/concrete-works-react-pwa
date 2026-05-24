import { Fragment, useCallback, useEffect, useState, useMemo } from 'react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { SearchableSelect, mapSearchableOptions } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ImageLightboxDialog } from '@/components/shared/ImageLightboxDialog'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { adminDataRow, app, modal, rq, tableCompact } from '@/lib/requestUi'
import {
  canManageUsers,
  assignableRolesFor,
  canAssignRole,
  ROLE_LABELS,
  normalizeRole,
  roleDisplayLabel,
  isSuperAdmin,
} from '@/lib/permissions'
import type { Profile, UserRole } from '@/types/app.types'
import { Navigate } from 'react-router-dom'
import { APP_HOME } from '@/lib/appHome'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { profileAvatarPreviewUrl, readAuthAvatarUrl, resolveProfileAvatarUrl } from '@/lib/profileAvatar'
import type { UserStatus } from '@/types/app.types'
import { adminDeleteProfile, adminUpdateProfile, fetchProfilesForAdmin } from '@/lib/adminProfileRpc'
import { useJobScope } from '@/hooks/useJobScope'

const ROLE_COLORS: Record<string, string> = {
  user: 'secondary',
  inspector: 'default',
  document: 'outline',
  engineer: 'default',
  admin: 'destructive',
  super_admin: 'destructive',
}
const STATUS_BADGE: Record<UserStatus, { label: string; className: string }> = {
  pending:  { label: 'รออนุมัติ', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  approved: { label: 'อนุมัติแล้ว', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: 'ปฏิเสธแล้ว', className: 'border-rose-200 bg-rose-50 text-rose-700' },
}
/** Radix Select.Item cannot use value=""; reserve empty selection for placeholder UX. */
const SELECT_NONE = '__none__'

function canModifyAdminTarget(actorRole: string | null | undefined, target: Profile): boolean {
  const targetRole = normalizeRole(target.role)
  if (targetRole === 'super_admin' || targetRole === 'admin') return isSuperAdmin(actorRole)
  return true
}

function userDisplayName(u: Profile) {
  return [u.fname, u.lname].filter(Boolean).join(' ') || '-'
}

function displayPhone(u: Profile) {
  const p = u.phone?.trim()
  return p || '-'
}

function UserProfileAvatar({
  profile,
  className,
  size = 'sm',
  sessionAvatarUrl,
  currentUserId,
  onPreview,
}: {
  profile: Profile
  className?: string
  size?: 'sm' | 'md' | 'lg'
  sessionAvatarUrl?: string | null
  currentUserId?: string | null
  onPreview?: (profile: Profile, avatarUrl: string) => void
}) {
  const avatarUrl = resolveProfileAvatarUrl(profile, { currentUserId, sessionAvatarUrl })
  return (
    <UserAvatar
      profile={profile}
      avatarUrl={avatarUrl}
      size={size}
      className={cn('shrink-0 ring-1 ring-[color:var(--glass-border-subtle)]', className)}
      onImageClick={avatarUrl && onPreview ? () => onPreview(profile, avatarUrl) : undefined}
    />
  )
}

export function UsersPage() {
  const role = useAuthStore((s) => s.role)
  const { clients, jobs } = useMasterDataStore()
  const { superAdminJobFilter } = useJobScope()
  const currentProfileId = useAuthStore((s) => s.profile?.id)
  const authUser = useAuthStore((s) => s.user)
  const actorEmail = authUser?.email
  const sessionAvatarUrl = readAuthAvatarUrl(authUser?.user_metadata)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [draftRole, setDraftRole] = useState<UserRole>('user')
  const [draftStatus, setDraftStatus] = useState<UserStatus>('pending')
  const [draftClient, setDraftClient] = useState(SELECT_NONE)
  const [draftJob, setDraftJob] = useState(SELECT_NONE)
  const [saving, setSaving] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [avatarPreview, setAvatarPreview] = useState<{ src: string; title: string } | null>(null)

  const openAvatarPreview = useCallback((profile: Profile, avatarUrl: string) => {
    const name = userDisplayName(profile)
    setAvatarPreview({
      src: profileAvatarPreviewUrl(avatarUrl),
      title: name !== '-' ? name : 'รูปโปรไฟล์',
    })
  }, [])

  const assignableRoles = useMemo(() => assignableRolesFor(role), [role])

  useDesktopSearchRegistration({
    placeholder: 'ค้นหา รหัสพนักงาน ชื่อ เบอร์โทร Role User Group โครงการ…',
    ariaLabel: 'ค้นหาในตารางผู้ใช้',
    showRequestFilterButton: false,
    search: userSearch,
    onSearchChange: setUserSearch,
  })

  async function load() {
    setLoading(true)
    const { profiles, error: profileErr } = await fetchProfilesForAdmin()
    if (profileErr) toast.error(profileErr)
    setUsers(profiles)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useDataSyncRefetch(['profiles', '*'], load)

  usePullToRefreshOnLoad(load)

  useEffect(() => {
    if (!editUser) return
    setDraftRole(normalizeRole(editUser.role) ?? 'user')
    setDraftStatus(editUser.status)
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

  async function setStatus(userId: string, status: UserStatus) {
    const target = users.find((u) => u.id === userId)
    if (!target) return
    if (!canModifyAdminTarget(role, target)) {
      toast.error('ไม่มีสิทธิ์แก้ไขบัญชีผู้ดูแลระบบ')
      return
    }
    const { profile: updated, error } = await adminUpdateProfile({
      target_id: userId,
      new_role: target.role,
      new_status: status,
      new_client_id: target.client_id,
      new_client_name: target.client_name,
      new_job_id: target.job_id,
      new_inspector_id: target.inspector_id,
    })
    if (error || !updated) {
      toast.error(error || 'อัปเดตสถานะไม่สำเร็จ')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? (updated as Profile) : u)))
    toast.success(
      status === 'approved' ? 'อนุมัติแล้ว' : status === 'rejected' ? 'ปฏิเสธแล้ว' : 'ตั้งเป็นรออนุมัติ',
    )
  }

  const scopeUsers = useMemo(() => {
    if (!isSuperAdmin(role) || superAdminJobFilter === 'all') return users
    return users.filter((u) => u.job_id === superAdminJobFilter)
  }, [users, role, superAdminJobFilter])

  const pendingCount = scopeUsers.filter((u) => u.status === 'pending').length

  const superAdminShowsAllJobs = isSuperAdmin(role) && superAdminJobFilter === 'all'

  const usersByJobSummary = useMemo(() => {
    if (!superAdminShowsAllJobs) return []
    const bucket = new Map<number | null, { jobId: number | null; jobName: string; total: number; pending: number; approved: number; rejected: number }>()
    for (const u of scopeUsers) {
      const key = u.job_id ?? null
      const found = bucket.get(key)
      if (found) {
        found.total += 1
        if (u.status === 'pending') found.pending += 1
        if (u.status === 'approved') found.approved += 1
        if (u.status === 'rejected') found.rejected += 1
        continue
      }
      bucket.set(key, {
        jobId: key,
        jobName: key == null ? 'ไม่ระบุโครงการ' : jobs.find((j) => j.id === key)?.job_name ?? `Job #${key}`,
        total: 1,
        pending: u.status === 'pending' ? 1 : 0,
        approved: u.status === 'approved' ? 1 : 0,
        rejected: u.status === 'rejected' ? 1 : 0,
      })
    }
    return Array.from(bucket.values()).sort((a, b) => a.jobName.localeCompare(b.jobName, 'th'))
  }, [scopeUsers, jobs, superAdminShowsAllJobs])

  const filteredUsers = useMemo(() => {
    const t = userSearch.trim().toLowerCase()
    return scopeUsers.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (!t) return true
      const c = clientLabel(u)
      const j = jobLabel(u)
      const blob = [u.employee_id, u.fname, u.lname, u.phone, u.role, c, j].join(' ').toLowerCase()
      return blob.includes(t)
    })
  }, [scopeUsers, userSearch, statusFilter, clients, jobs])

  const filteredJobCounts = useMemo(() => {
    if (!superAdminShowsAllJobs) return new Map<string, number>()
    const counts = new Map<string, number>()
    for (const u of filteredUsers) {
      const key = jobLabel(u)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [filteredUsers, superAdminShowsAllJobs, jobs])

  async function saveEdit() {
    if (!editUser) return
    if (!canModifyAdminTarget(role, editUser)) {
      toast.error('ไม่มีสิทธิ์แก้ไขบัญชีผู้ดูแลระบบ')
      return
    }
    if (!canAssignRole(role, draftRole)) {
      toast.error('เฉพาะ Super Admin เท่านั้นที่แต่งตั้ง Super Admin ได้')
      return
    }
    const cid = draftClient === SELECT_NONE ? null : Number.parseInt(draftClient, 10)
    const jid = draftJob === SELECT_NONE ? null : Number.parseInt(draftJob, 10)
    const client = cid != null ? clients.find((c) => c.id === cid) : undefined
    setSaving(true)
    const { profile: updated, error } = await adminUpdateProfile({
      target_id: editUser.id,
      new_role: draftRole,
      new_status: draftStatus,
      new_client_id: cid,
      new_client_name: client?.client_name ?? null,
      new_job_id: draftRole === 'super_admin' ? null : jid,
      new_inspector_id: editUser.inspector_id,
    })
    setSaving(false)
    if (error || !updated) {
      toast.error(error || 'บันทึกไม่สำเร็จ')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? (updated as Profile) : u)))
    toast.success('บันทึกการแก้ไขเรียบร้อย')
    setEditUser(null)
  }

  async function confirmDelete() {
    if (deleteUserId === null) return
    const target = users.find((u) => u.id === deleteUserId)
    if (target && !canModifyAdminTarget(role, target)) {
      toast.error('ไม่มีสิทธิ์แก้ไขบัญชีผู้ดูแลระบบ')
      setDeleteUserId(null)
      return
    }
    const { error } = await adminDeleteProfile(deleteUserId)
    if (error) {
      toast.error(error)
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
    toast.success('ลบผู้ใช้งานแล้ว')
    setDeleteUserId(null)
  }

  if (!canManageUsers(role)) {
    return <Navigate to={APP_HOME} replace />
  }

  return (
    <div className={app.pageAdmin}>
      <h1 className={rq.heroTitle}>จัดการผู้ใช้งาน ({filteredUsers.length}{userSearch.trim() || statusFilter !== 'all' ? ` / ${users.length}` : ''})</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--pour-line)] pb-3">
        <nav aria-label="กรองสถานะผู้ใช้" className="flex min-w-0 flex-wrap items-center gap-1" role="tablist">
          {([['all', 'ทั้งหมด'], ['pending', 'รออนุมัติ'], ['approved', 'อนุมัติแล้ว'], ['rejected', 'ปฏิเสธแล้ว']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              role="tab"
              aria-selected={statusFilter === val}
              className={cn(
                'pour-interactive inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                statusFilter === val
                  ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
                  : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
              )}
            >
              {label}
              {val === 'pending' && pendingCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums',
                    statusFilter === 'pending' ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className={app.mobileCardStackCompact}>
        {superAdminShowsAllJobs && !loading && usersByJobSummary.length > 0 && (
          <div className="rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/75 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium text-[color:var(--pour-ink-1)]">จำนวนผู้ใช้แยกตามโครงการ</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {usersByJobSummary.map((s) => (
                <div key={String(s.jobId ?? 'none')} className="rounded-lg border border-[color:var(--glass-border-subtle)] bg-white/70 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-[color:var(--pour-ink-0)]" title={s.jobName}>{s.jobName}</p>
                  <p className="mt-1 text-xs text-[color:var(--pour-ink-1)]">
                    ทั้งหมด {s.total} คน · รอ {s.pending} · อนุมัติ {s.approved}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <div className={rq.dataRowEmpty}>กำลังโหลด…</div>
        ) : filteredUsers.length === 0 ? (
          <div className={rq.dataRowEmpty}>
            {users.length === 0 ? 'ไม่มีผู้ใช้' : 'ไม่พบผู้ใช้ที่ตรงกับคำค้น'}
          </div>
        ) : (
          filteredUsers.map((u, idx) => {
            const allowManage = canModifyAdminTarget(role, u)
            const currentJobLabel = jobLabel(u)
            const prevJobLabel = idx > 0 ? jobLabel(filteredUsers[idx - 1] as Profile) : null
            const showGroupHeader = superAdminShowsAllJobs && currentJobLabel !== prevJobLabel
            return (
            <Fragment key={u.id}>
              {showGroupHeader && (
                <div className="rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/80 px-3 py-1.5 text-xs font-semibold text-[color:var(--pour-ink-0)] backdrop-blur-sm">
                  {currentJobLabel} · {filteredJobCounts.get(currentJobLabel) ?? 0} คน
                </div>
              )}
              <div className={adminDataRow.card}>
                <dl className={adminDataRow.fields}>
                  <div>
                    <dt className={adminDataRow.label}>ชื่อ</dt>
                    <dd className={cn(adminDataRow.value, 'flex min-w-0 items-center gap-2.5 font-semibold')}>
                      <UserProfileAvatar
                        profile={u}
                        currentUserId={currentProfileId}
                        sessionAvatarUrl={sessionAvatarUrl}
                        onPreview={openAvatarPreview}
                      />
                      <span className="min-w-0 break-words">{userDisplayName(u)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>User Group</dt>
                    <dd className={cn(adminDataRow.value, 'text-[color:var(--pour-ink-1)]')}>{clientLabel(u)}</dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>รหัสพนักงาน</dt>
                    <dd className="font-pour-mono text-xs text-[color:var(--pour-ink-1)]">{u.employee_id ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>เบอร์โทร</dt>
                    <dd className="font-pour-mono text-xs tabular-nums text-[color:var(--pour-ink-1)]">{displayPhone(u)}</dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>โครงการ</dt>
                    <dd className={cn(adminDataRow.value, 'text-[color:var(--pour-ink-1)]')}>{jobLabel(u)}</dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>วันที่สมัคร</dt>
                    <dd className={cn(adminDataRow.value, 'text-[color:var(--pour-ink-1)]')}>{formatDate(u.created_at)}</dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>Role</dt>
                    <dd>
                      <Badge variant={ROLE_COLORS[u.role] as 'default' | 'secondary' | 'destructive'} className="text-xs">
                        {roleDisplayLabel(u.role)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className={adminDataRow.label}>สถานะ</dt>
                    <dd>
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_BADGE[u.status].className)}>
                        {STATUS_BADGE[u.status].label}
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className={adminDataRow.actions}>
                  {allowManage && u.status === 'pending' && (
                    <>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => void setStatus(u.id, 'approved')} aria-label="อนุมัติ">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => void setStatus(u.id, 'rejected')} aria-label="ปฏิเสธ">
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {allowManage && u.status === 'approved' && (
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => void setStatus(u.id, 'rejected')} aria-label="ปฏิเสธ">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {allowManage && u.status === 'rejected' && (
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => void setStatus(u.id, 'approved')} aria-label="อนุมัติ">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {allowManage && (
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setEditUser(u)} aria-label="แก้ไข">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {allowManage && u.id !== currentProfileId && (
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteUserId(u.id)} aria-label="ลบ">
                      <Trash2 className="h-3.5 w-3.5 text-pour-subtle" />
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
              {['ชื่อ', 'User Group', 'รหัสพนักงาน', 'เบอร์โทร', 'โครงการ', 'วันที่สมัคร', 'Role', 'สถานะ', 'การจัดการ'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={tableCompact.body}>
            {loading ? (
              <tr>
                <td colSpan={9} className={tableCompact.emptyCell}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className={tableCompact.emptyCell}>
                  {users.length === 0 ? 'ไม่มีผู้ใช้' : 'ไม่พบผู้ใช้ที่ตรงกับคำค้น'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const allowManage = canModifyAdminTarget(role, u)
                const currentJobLabel = jobLabel(u)
                const prevJobLabel = idx > 0 ? jobLabel(filteredUsers[idx - 1] as Profile) : null
                const showGroupHeader = superAdminShowsAllJobs && currentJobLabel !== prevJobLabel
                return (
                <Fragment key={u.id}>
                  {showGroupHeader && (
                    <tr className="border-t border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg)]/85 text-[color:var(--pour-ink-0)] first:border-t-0">
                      <td colSpan={9} className="px-2.5 py-2 align-middle text-xs font-semibold leading-snug text-[color:var(--pour-ink-0)] sm:px-3 sm:text-sm">
                        {currentJobLabel} · {filteredJobCounts.get(currentJobLabel) ?? 0} คน
                      </td>
                    </tr>
                  )}
                  <tr key={u.id}>
                    <td className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserProfileAvatar
                          profile={u}
                          currentUserId={currentProfileId}
                          sessionAvatarUrl={sessionAvatarUrl}
                          onPreview={openAvatarPreview}
                        />
                        <span className="min-w-0 break-words">{userDisplayName(u)}</span>
                      </div>
                    </td>
                    <td className="min-w-0 break-words text-[color:var(--pour-ink-1)]" title={clientLabel(u)}>
                      {clientLabel(u)}
                    </td>
                    <td className="min-w-0 break-words font-mono tabular-nums">{u.employee_id ?? '-'}</td>
                    <td className="min-w-0 whitespace-nowrap font-mono text-xs tabular-nums text-[color:var(--pour-ink-1)]">
                      {displayPhone(u)}
                    </td>
                    <td className="min-w-0 break-words text-[color:var(--pour-ink-1)]" title={jobLabel(u)}>
                      {jobLabel(u)}
                    </td>
                    <td className="min-w-0 whitespace-nowrap text-xs text-pour-muted">{formatDate(u.created_at)}</td>
                    <td className="min-w-0">
                      <Badge variant={ROLE_COLORS[u.role] as 'default' | 'secondary' | 'destructive'} className="text-xs">
                        {roleDisplayLabel(u.role)}
                      </Badge>
                    </td>
                    <td className="min-w-0 whitespace-nowrap">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_BADGE[u.status].className)}>
                        {STATUS_BADGE[u.status].label}
                      </span>
                    </td>
                    <td className="shrink-0 whitespace-nowrap">
                      <div className="flex gap-0.5">
                        {allowManage && u.status === 'pending' && (
                          <>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => void setStatus(u.id, 'approved')} aria-label="อนุมัติ">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50" onClick={() => void setStatus(u.id, 'rejected')} aria-label="ปฏิเสธ">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {allowManage && u.status === 'approved' && (
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-400 hover:bg-rose-50" onClick={() => void setStatus(u.id, 'rejected')} aria-label="ปฏิเสธ">
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {allowManage && u.status === 'rejected' && (
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => void setStatus(u.id, 'approved')} aria-label="อนุมัติ">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {allowManage && (
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setEditUser(u)} aria-label="แก้ไข">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {allowManage && u.id !== currentProfileId && (
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteUserId(u.id)} aria-label="ลบ">
                            <Trash2 className="h-3.5 w-3.5 text-pour-subtle" />
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
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null)
        }}
      >
        <DialogContent className={cn(modal.lg, 'rounded-2xl border-[color:var(--glass-border-subtle)]')}>
          <DialogHeader className="min-w-0 pr-10 text-left sm:pr-12">
            <DialogTitle className="break-words text-[color:var(--pour-ink-0)]">แก้ไขผู้ใช้งาน</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="min-w-0 space-y-4">
              <div className="flex min-w-0 items-center gap-3">
                <UserProfileAvatar
                  profile={editUser}
                  size="lg"
                  currentUserId={currentProfileId}
                  sessionAvatarUrl={sessionAvatarUrl}
                  onPreview={openAvatarPreview}
                />
                <p className="min-w-0 break-words text-sm leading-snug text-pour-muted">
                  {userDisplayName(editUser) !== '-' ? userDisplayName(editUser) : editUser.employee_id || editUser.id}
                </p>
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>สถานะการอนุมัติ</p>
                <SearchableSelect
                  value={draftStatus}
                  onValueChange={(v) => setDraftStatus(v as UserStatus)}
                  options={(['pending', 'approved', 'rejected'] as const).map((s) => ({
                    value: s,
                    label: STATUS_BADGE[s].label,
                  }))}
                  triggerClassName="h-auto min-h-9 whitespace-normal py-2 text-left text-sm"
                  listClassName="max-h-[min(50dvh,18rem)]"
                />
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>Role</p>
                <SearchableSelect
                  value={draftRole}
                  onValueChange={(v) => setDraftRole(v as UserRole)}
                  options={assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                  triggerClassName="h-auto min-h-9 whitespace-normal py-2 text-left text-sm"
                  listClassName="max-h-[min(50dvh,18rem)]"
                />
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>User Group</p>
                <SearchableSelect
                  value={draftClient}
                  onValueChange={setDraftClient}
                  placeholder="ไม่ระบุ"
                  options={[
                    { value: SELECT_NONE, label: 'ไม่ระบุ' },
                    ...mapSearchableOptions(clients, (c) => String(c.id), (c) => c.client_name),
                  ]}
                  triggerClassName="h-auto min-h-9 whitespace-normal py-2 text-left text-sm"
                  listClassName="max-h-[min(50dvh,18rem)]"
                />
              </div>
              <div>
                <p className={cn(rq.dataRowLabel, 'mb-1.5')}>โครงการ</p>
                <SearchableSelect
                  value={draftJob}
                  onValueChange={setDraftJob}
                  placeholder="ไม่ระบุ"
                  options={[
                    { value: SELECT_NONE, label: 'ไม่ระบุ' },
                    ...mapSearchableOptions(jobs, (j) => String(j.id), (j) => j.job_name),
                  ]}
                  triggerClassName="h-auto min-h-9 whitespace-normal py-2 text-left text-sm"
                  listClassName="max-h-[min(50dvh,18rem)]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="modalAction"
              className="rounded-xl border-[color:var(--pour-surface-border)]"
              onClick={() => setEditUser(null)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="modalAction"
              className="rounded-xl shadow-sm shadow-[color:var(--pour-accent)]/20"
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

      <ImageLightboxDialog
        open={avatarPreview !== null}
        onOpenChange={(open) => {
          if (!open) setAvatarPreview(null)
        }}
        src={avatarPreview?.src}
        title={avatarPreview?.title ?? 'รูปโปรไฟล์'}
      />
    </div>
  )
}

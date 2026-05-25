import type { UserRole } from '@/types/app.types'
import type { InspectorBookerScope } from '@/lib/inspectorScope'

/** Legacy DB value — treated as inspector in app logic */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null
  if (role === 'manager') return 'inspector'
  const r = role as UserRole
  if (
    r === 'super_admin'
    || r === 'admin'
    || r === 'user'
    || r === 'inspector'
    || r === 'document'
    || r === 'engineer'
  ) {
    return r
  }
  return null
}

export const ROLE_LABELS: Record<UserRole | 'manager', string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
  inspector: 'Inspector',
  document: 'Document',
  engineer: 'Engineer',
  manager: 'Inspector',
}

export const ASSIGNABLE_ROLES: UserRole[] = [
  'user',
  'inspector',
  'document',
  'engineer',
  'admin',
  'super_admin',
]

/** Roles the actor may assign in Users settings (super_admin only for super_admin). */
export function assignableRolesFor(actorRole: string | null | undefined): UserRole[] {
  if (isSuperAdmin(actorRole)) return [...ASSIGNABLE_ROLES]
  return ASSIGNABLE_ROLES.filter((r) => r !== 'super_admin')
}

export function canAssignRole(actorRole: string | null | undefined, role: UserRole): boolean {
  return assignableRolesFor(actorRole).includes(role)
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'super_admin'
}

export function isJobAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'admin'
}

export function isPlatformStaff(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin'
}

/** Super Admin only — manage users across all jobs */
export function canManageUsers(role: string | null | undefined): boolean {
  return isSuperAdmin(role) || isJobAdmin(role)
}

/** Super Admin only — CRUD Jobs registry */
export function canManageJobsRegistry(role: string | null | undefined): boolean {
  return isSuperAdmin(role)
}

/** Super Admin only — เลือกปลายทางอัปโหลดรูป (Drive / R2) */
export function canManageUploadSettings(role: string | null | undefined): boolean {
  return isSuperAdmin(role)
}

/** จองคอนกรีตผ่าน flow ปกติ (/requests/new) */
export function canBookConcrete(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin' || r === 'user' || r === 'engineer'
}

/** สร้างรายการจาก CST shortcut */
export function canUseCstShortcut(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin' || r === 'document' || r === 'engineer'
}

export function canEditCst(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin' || r === 'document' || r === 'engineer'
}

/** Master data + ตั้งสาย Inspector (หัวสาย / สมาชิก) */
export function canEditMasterData(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin' || r === 'document' || r === 'engineer'
}

export function canEditBookingSummary(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin' || r === 'document' || r === 'engineer'
}

/** เปลี่ยน status / workflow จอง (อนุมัติ สั่งเท ฯลฯ) */
export function canWorkflowActOnRequest(opts: {
  role: string | null | undefined
  bookerScope: InspectorBookerScope
  bookedBy: string | null | undefined
  actorProfileId?: string | null
}): boolean {
  const { bookerScope, bookedBy, actorProfileId } = opts
  const role = normalizeRole(opts.role)
  if (!role) return false
  if (role === 'super_admin' || role === 'admin' || role === 'engineer') return true
  if (role !== 'inspector') return false
  if (
    actorProfileId
    && bookedBy === actorProfileId
    && bookerScope
    && bookerScope.has(actorProfileId)
  ) {
    return true
  }
  if (!bookedBy?.trim()) return false
  if (!bookerScope || bookerScope.size === 0) return false
  return bookerScope.has(bookedBy)
}

/** User — จัดการคำขอของตัวเอง (ไม่รวม workflow ของสาย) */
export function canOwnerActOnRequest(
  role: string | null | undefined,
  isOwner: boolean,
): boolean {
  return normalizeRole(role) === 'user' && isOwner
}

/** แนบไฟล์/รูปโดยไม่เปลี่ยน flow (Document, Engineer, Admin) */
export function canUploadRequestAttachments(
  role: string | null | undefined,
  isOwner: boolean,
): boolean {
  const r = normalizeRole(role)
  if (r === 'super_admin' || r === 'admin' || r === 'document' || r === 'engineer') return true
  if (r === 'user' && isOwner) return true
  return false
}

export function isInspectorRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'inspector'
}

/** ป้าย role สำหรับ UI (รองรับ manager เก่าใน DB) */
export function roleDisplayLabel(role: string | null | undefined): string {
  if (!role) return '—'
  const key = normalizeRole(role) ?? role
  return ROLE_LABELS[key as UserRole] ?? ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role
}

/** Bypass job-scoped reads in app (RLS still applies at DB for non-super_admin). */
export function bypassesJobScopeInApp(role: string | null | undefined): boolean {
  return isSuperAdmin(role)
}

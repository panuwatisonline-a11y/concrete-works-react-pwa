import { supabase } from '@/lib/supabase'
import { parseStructureListTokens, STRUCTURE_LIST_JOIN } from '@/lib/structureListTokens'
import { isInspectorRole, normalizeRole, ROLE_LABELS } from '@/lib/permissions'
import type { Profile } from '@/types/app.types'

export type InspectorRow = {
  id: number
  inspector_name: string
  primary_profile_id: string | null
  created_at?: string
}

export type InspectorMemberRow = {
  id: number
  inspector_id: number
  profile_id: string
}

export type InspectorMemberProfile = {
  profile_id: string
  fname: string | null
  lname: string | null
  employee_id: string | null
  role?: string | null
}

export type InspectorWithMembers = InspectorRow & {
  members: InspectorMemberProfile[]
  primary?: InspectorMemberProfile | null
}

export function inspectorPrimaryLabel(row: InspectorWithMembers): string {
  if (row.primary) return profilePickerLabel(row.primary)
  return row.inspector_name
}

export const PROFILE_ROLE_LABELS: Record<string, string> = ROLE_LABELS

export function profilePickerLabel(p: {
  fname: string | null
  lname: string | null
  employee_id: string | null
  role?: string | null
}): string {
  const name = [p.fname, p.lname].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'
  const emp = p.employee_id?.trim()
  const base = emp ? `${name} · ${emp}` : name
  const roleKey = p.role?.trim()
  if (!roleKey) return base
  const roleLabel = PROFILE_ROLE_LABELS[roleKey] ?? roleKey
  return `${base} · ${roleLabel}`
}

/** คั่น profile id — ใช้ | ไม่ใช้ comma เพื่อไม่ชนกับ uuid/ชื่อ */
export const PROFILE_ID_LIST_JOIN = '|'

export function serializeProfileIdList(ids: Iterable<string>, masterOrder: string[]): string {
  const set = new Set(ids)
  const picked = masterOrder.filter((id) => set.has(id))
  const extras = [...set].filter((id) => !masterOrder.includes(id))
  return [...picked, ...extras].join(PROFILE_ID_LIST_JOIN)
}

export function parseProfileIdList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  if (raw.includes(PROFILE_ID_LIST_JOIN)) {
    return raw.split(PROFILE_ID_LIST_JOIN).map((s) => s.trim()).filter(Boolean)
  }
  return parseStructureListTokens(raw)
}

/** ใส่หัวสายใน list อัตโนมัติ (ยังเอาออกจาก checkbox ได้) */
export function memberIdsIncludingPrimary(
  memberIdsValue: string,
  primaryProfileId: string,
  masterOrder: string[],
): string {
  const primary = primaryProfileId.trim()
  if (!primary) return memberIdsValue
  const ids = parseProfileIdList(memberIdsValue)
  if (ids.includes(primary)) return memberIdsValue
  return serializeProfileIdList([primary, ...ids], masterOrder)
}

/** null = admin (no scope limit); Set = allowed booked_by profile ids */
export type InspectorBookerScope = Set<string> | null

export async function fetchBookerIdsForInspector(inspectorId: number): Promise<Set<string>> {
  const [membersRes, inspRes] = await Promise.all([
    supabase.from('Inspector_Member').select('profile_id').eq('inspector_id', inspectorId),
    supabase.from('Inspector').select('primary_profile_id').eq('id', inspectorId).maybeSingle(),
  ])
  if (membersRes.error) throw membersRes.error
  if (inspRes.error) throw inspRes.error

  const ids = new Set((membersRes.data ?? []).map((r) => r.profile_id))
  const primary = inspRes.data?.primary_profile_id
  if (primary) ids.add(primary)
  return ids
}

export async function fetchBookerScopeForProfile(profile: Profile | null): Promise<InspectorBookerScope> {
  if (!profile) return new Set()
  if (normalizeRole(profile.role) === 'admin') return null
  if (!isInspectorRole(profile.role) || profile.inspector_id == null) return new Set()
  const scope = await fetchBookerIdsForInspector(profile.inspector_id)
  scope.add(profile.id)
  return scope
}

export async function replaceInspectorMembers(
  inspectorId: number,
  profileIds: string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from('Inspector_Member')
    .delete()
    .eq('inspector_id', inspectorId)
  if (delErr) throw delErr

  const unique = [...new Set(profileIds.map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) return

  const { error: insErr } = await supabase.from('Inspector_Member').insert(
    unique.map((profile_id) => ({ inspector_id: inspectorId, profile_id })),
  )
  if (insErr) throw insErr
}

export function formatMemberList(members: InspectorMemberProfile[]): string {
  if (!members.length) return '—'
  const labels = members.map((m) => profilePickerLabel(m))
  if (labels.length <= 2) return labels.join(', ')
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
}

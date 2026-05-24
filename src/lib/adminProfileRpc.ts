import { supabase } from '@/lib/supabase'
import type { Profile, UserRole, UserStatus } from '@/types/app.types'

export type AdminUpdateProfileArgs = {
  target_id: string
  new_role: UserRole
  new_status: UserStatus
  new_client_id: number | null
  new_client_name: string | null
  new_job_id: number | null
  new_inspector_id: number | null
}

/** โหลด profiles สำหรับ Admin — ใช้ RPC (ข้าม RLS ตามสิทธิ์) */
export async function fetchProfilesForAdmin(): Promise<{
  profiles: Profile[]
  error: string | null
}> {
  const rpc = await supabase.rpc('admin_list_profiles')
  if (!rpc.error && rpc.data) {
    return { profiles: rpc.data as Profile[], error: null }
  }
  return {
    profiles: [],
    error: rpc.error?.message || 'โหลดผู้ใช้ไม่สำเร็จ',
  }
}

/** บันทึก role/status — RPC เท่านั้น (ห้าม fallback UPDATE ตรง เพื่อไม่ให้ bypass การตรวจ super_admin) */
export async function adminUpdateProfile(
  args: AdminUpdateProfileArgs,
): Promise<{ profile: Profile | null; error: string | null }> {
  const rpc = await supabase.rpc('admin_update_profile', args)
  if (!rpc.error && rpc.data) {
    return { profile: rpc.data as Profile, error: null }
  }

  const msg = rpc.error?.message || ''
  if (msg.includes('only super_admin can assign super_admin')) {
    return { profile: null, error: 'เฉพาะ Super Admin เท่านั้นที่แต่งตั้ง Super Admin ได้' }
  }
  if (msg.includes('profiles_role_check')) {
    return {
      profile: null,
      error: 'Role นี้ยังไม่ถูกอนุญาตใน DB — รัน migration profiles_role_check บน Supabase',
    }
  }
  return { profile: null, error: msg || 'บันทึกไม่สำเร็จ' }
}

export async function adminDeleteProfile(targetId: string): Promise<{ error: string | null }> {
  const rpc = await supabase.rpc('admin_delete_profile', { target_id: targetId })
  if (!rpc.error) return { error: null }
  return { error: rpc.error.message || 'ลบไม่สำเร็จ' }
}

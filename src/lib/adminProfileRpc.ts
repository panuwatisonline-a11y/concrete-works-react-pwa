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

/** โหลด profiles สำหรับ Admin — ใช้ RPC ก่อน แล้ว fallback ตารางตรง */
export async function fetchProfilesForAdmin(): Promise<{
  profiles: Profile[]
  error: string | null
}> {
  const rpc = await supabase.rpc('admin_list_profiles')
  if (!rpc.error && rpc.data) {
    return { profiles: rpc.data as Profile[], error: null }
  }

  const direct = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (direct.error) {
    return {
      profiles: [],
      error: direct.error.message || rpc.error?.message || 'โหลดผู้ใช้ไม่สำเร็จ',
    }
  }
  return { profiles: (direct.data ?? []) as Profile[], error: null }
}

/** บันทึก role/status ฯลฯ — RPC ข้าม RLS */
export async function adminUpdateProfile(
  args: AdminUpdateProfileArgs,
): Promise<{ profile: Profile | null; error: string | null }> {
  const rpc = await supabase.rpc('admin_update_profile', args)
  if (!rpc.error && rpc.data) {
    return { profile: rpc.data as Profile, error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: args.new_role,
      status: args.new_status,
      client_id: args.new_client_id,
      client_name: args.new_client_name,
      job_id: args.new_job_id,
      inspector_id: args.new_inspector_id,
    })
    .eq('id', args.target_id)
    .select('*')
    .maybeSingle()

  if (error || !data) {
    const msg = error?.message || rpc.error?.message || ''
    const roleCheck = msg.includes('profiles_role_check')
    return {
      profile: null,
      error: roleCheck
        ? 'Role นี้ยังไม่ถูกอนุญาตใน DB — รัน migration profiles_role_check บน Supabase'
        : msg || 'บันทึกไม่สำเร็จ — รัน migration admin_profile_rpc บน Supabase',
    }
  }
  return { profile: data as Profile, error: null }
}

export async function adminDeleteProfile(targetId: string): Promise<{ error: string | null }> {
  const rpc = await supabase.rpc('admin_delete_profile', { target_id: targetId })
  if (!rpc.error) return { error: null }

  const { error } = await supabase.from('profiles').delete().eq('id', targetId)
  if (error) {
    return { error: error.message || rpc.error?.message || 'ลบไม่สำเร็จ' }
  }
  return { error: null }
}

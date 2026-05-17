import { reloadMasterData } from '@/lib/reloadMasterData'

export type AdminTableLoadOptions = { background?: boolean }

/** หลัง CRUD สำเร็จ — รอตารางอัปเดต (ไม่ซ่อนแถว) + sync master cache สำหรับ dropdown หน้าอื่น */
export async function refreshAfterAdminMutation(
  load: (opts?: AdminTableLoadOptions) => Promise<void>,
): Promise<void> {
  await load({ background: true })
  void reloadMasterData()
}

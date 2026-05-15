import { reloadMasterData } from '@/lib/reloadMasterData'

/** ส่งหลัง reload master data — หน้าที่ mount อยู่ฟัง event นี้เพื่อรีเฟรชข้อมูลของตัวเอง */
export const PULL_REFRESH_PAGE_EVENT = 'pour:pull-refresh-page'

export async function executePullRefresh(): Promise<void> {
  await reloadMasterData()
  window.dispatchEvent(new CustomEvent(PULL_REFRESH_PAGE_EVENT))
}

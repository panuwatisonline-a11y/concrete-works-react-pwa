import { reloadMasterData } from '@/lib/reloadMasterData'

/** ส่งหลัง reload master data — หน้าที่ mount อยู่ฟัง event นี้เพื่อรีเฟรชข้อมูลของตัวเอง */
export const PULL_REFRESH_PAGE_EVENT = 'pour:pull-refresh-page'

export interface PullRefreshPageDetail {
  /** ให้หน้าที่รีเฟรชลงทะเบียน Promise เพื่อให้ pull-to-refresh รอจนดึงข้อมูลหน้าจบ */
  waitFor: (work: void | Promise<void>) => void
}

function isThenable(v: unknown): v is Promise<void> {
  return typeof v === 'object' && v !== null && typeof (v as Promise<void>).then === 'function'
}

export async function executePullRefresh(): Promise<void> {
  await reloadMasterData()

  const pending: Promise<void>[] = []
  const waitFor = (work: void | Promise<void>) => {
    if (isThenable(work)) pending.push(work)
  }

  window.dispatchEvent(
    new CustomEvent<PullRefreshPageDetail>(PULL_REFRESH_PAGE_EVENT, {
      detail: { waitFor },
    }),
  )

  await Promise.allSettled(pending)
}

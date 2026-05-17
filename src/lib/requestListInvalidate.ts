/** หลังเปลี่ยนสถานะ/แก้คำขอ — ให้หน้ารายการรีเฟรช (ฟัง event นี้) */
export const REQUEST_LIST_INVALIDATED_EVENT = 'pour:request-list-invalidated'

/** ล้าง cache รายการคำขอของ SW แล้วแจ้งหน้าที่ mount อยู่ */
export async function notifyRequestListChanged(): Promise<void> {
  if (typeof caches !== 'undefined') {
    try {
      await caches.delete('requests-cache')
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(new CustomEvent(REQUEST_LIST_INVALIDATED_EVENT))
}

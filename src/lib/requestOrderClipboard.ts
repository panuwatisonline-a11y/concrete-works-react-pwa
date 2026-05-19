import { getBookingSummaryRowFields } from '@/lib/bookingSummaryRow'
import { formatDate, formatTime } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

function clipCell(v: string | null | undefined): string {
  if (v == null || v === '' || v === '-') return '-'
  return v
}

/** ข้อความสำหรับแชร์/คัดลอกเมื่อสั่งเทแล้ว (status 4) */
export function formatRequestOrderLoadClipboardText(r: RequestWithRelations): string {
  const f = getBookingSummaryRowFields(r)
  const pourDate = r.casting_date ?? r.request_date
  const sampleQty = r.sample_qty != null ? `${r.sample_qty} ก้อน` : '-'

  return [
    '***สั่งโหลดคอนกรีต***',
    `วันที่: ${formatDate(pourDate)}`,
    `เวลา: ${formatTime(r.request_time)}`,
    '---',
    `งาน: ${clipCell(f.concrete)}`,
    `โครงสร้าง: ${clipCell(f.structure)}`,
    `หมายเลขโครงสร้าง: ${clipCell(f.structureNo)}`,
    `สถานที่/ตำแหน่ง: ${clipCell(f.location)}`,
    `Supplier: ${clipCell(f.supplier)}`,
    `Mix Code: ${clipCell(f.mixcode)}`,
    `Slump: ${clipCell(f.slump)}`,
    `Strength: ${clipCell(f.strength)}`,
    `Volume: ${clipCell(f.volume)} cu.m.`,
    `จำนวนตัวอย่าง: ${sampleQty}`,
    '---',
    `ผู้จอง: ${clipCell(f.booker)}`,
    `โทร: ${clipCell(f.bookerPhone)}`,
  ].join('\n')
}

export async function copyRequestOrderLoadToClipboard(r: RequestWithRelations): Promise<void> {
  const text = formatRequestOrderLoadClipboardText(r)
  if (!navigator.clipboard?.writeText) {
    throw new Error('เบราว์เซอร์ไม่รองรับการคัดลอก')
  }
  await navigator.clipboard.writeText(text)
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '-'
  return time.slice(0, 5)
}

export function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase()
}

/** ตัวเลขปริมาตร (m³ / cu.m) — แสดงทศนิยม 2 ตำแหน่งเสมอ */
export function formatVolumeNumber(value: number | null | undefined, empty = '—'): string {
  if (value == null || Number.isNaN(value)) return empty
  return value.toFixed(2)
}

/** ปริมาตรจากค่าที่พิมพ์หรือตัวเลข — ทศนิยม 2 ตำแหน่ง */
export function formatVolumeNumberFromInput(
  value: number | string | null | undefined,
  empty = '—',
): string {
  if (value === '' || value == null) return empty
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (Number.isNaN(n)) return empty
  return n.toFixed(2)
}

/** บรรทัดแสดง cu.m (ใช้ทั่วแอป) */
export function formatVolumeCuM(
  value: number | string | null | undefined,
  empty = '-',
): string {
  if (value === '' || value == null) return empty
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (Number.isNaN(n)) return empty
  return `${n.toFixed(2)} cu.m`
}

/** เปอร์เซ็นต์ — ทศนิยม 2 ตำแหน่ง (ไม่รวมเครื่องหมาย %) */
export function formatPercentNumber(value: number | null | undefined, empty = '—'): string {
  if (value == null || Number.isNaN(value)) return empty
  return value.toFixed(2)
}

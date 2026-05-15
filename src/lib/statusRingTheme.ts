/** สี accent แบบ liquid glass สำหรับการ์ดสรุปสถานะ (ตรงกับ STATUS_COLORS ใน app.types) */
export type StatusRingTheme = {
  color: string
  glow: string
  tint: string
}

export const STATUS_RING_THEME: Record<number, StatusRingTheme> = {
  1: { color: '#6b7280', glow: '#d1d5db', tint: 'rgba(107, 114, 128, 0.08)' },
  2: { color: '#d97706', glow: '#fcd34d', tint: 'rgba(217, 119, 6, 0.1)' },
  3: { color: '#171717', glow: '#737373', tint: 'rgba(23, 23, 23, 0.07)' },
  4: { color: '#0891b2', glow: '#67e8f9', tint: 'rgba(8, 145, 178, 0.1)' },
  5: { color: '#b45309', glow: '#fdba74', tint: 'rgba(180, 83, 9, 0.11)' },
  6: { color: '#dc2626', glow: '#fca5a5', tint: 'rgba(220, 38, 38, 0.09)' },
  7: { color: '#9ca3af', glow: '#e5e7eb', tint: 'rgba(156, 163, 175, 0.12)' },
  8: { color: '#16a34a', glow: '#86efac', tint: 'rgba(22, 163, 74, 0.1)' },
}

export const DEFAULT_STATUS_RING: StatusRingTheme = {
  color: '#525252',
  glow: '#a3a3a3',
  tint: 'rgba(82, 82, 82, 0.08)',
}

export function getStatusRingTheme(statusId: number): StatusRingTheme {
  return STATUS_RING_THEME[statusId] ?? DEFAULT_STATUS_RING
}

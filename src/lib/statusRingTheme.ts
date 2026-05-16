/** สี accent แบบ liquid glass สำหรับการ์ดสรุปสถานะ (ตรงกับ STATUS_COLORS ใน app.types) */
export type StatusRingTheme = {
  color: string
  glow: string
  tint: string
}

export const STATUS_RING_THEME: Record<number, StatusRingTheme> = {
  1: { color: '#a3a3a3', glow: '#d4d4d4', tint: 'rgba(163, 163, 163, 0.12)' },
  2: { color: '#fbbf24', glow: '#fde68a', tint: 'rgba(251, 191, 36, 0.14)' },
  3: { color: '#e5e5e5', glow: '#a3a3a3', tint: 'rgba(229, 229, 229, 0.1)' },
  4: { color: '#22d3ee', glow: '#67e8f9', tint: 'rgba(34, 211, 238, 0.12)' },
  5: { color: '#fb923c', glow: '#fdba74', tint: 'rgba(251, 146, 60, 0.14)' },
  6: { color: '#f87171', glow: '#fca5a5', tint: 'rgba(248, 113, 113, 0.12)' },
  7: { color: '#9ca3af', glow: '#e5e7eb', tint: 'rgba(156, 163, 175, 0.14)' },
  8: { color: '#4ade80', glow: '#86efac', tint: 'rgba(74, 222, 128, 0.12)' },
}

export const DEFAULT_STATUS_RING: StatusRingTheme = {
  color: '#a3a3a3',
  glow: '#d4d4d4',
  tint: 'rgba(163, 163, 163, 0.1)',
}

export function getStatusRingTheme(statusId: number): StatusRingTheme {
  return STATUS_RING_THEME[statusId] ?? DEFAULT_STATUS_RING
}

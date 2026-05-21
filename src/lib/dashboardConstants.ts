import { LOSS_MONTHS } from '@/lib/lossConcreteAnalytics'

export { LOSS_MONTHS as DASHBOARD_MONTHS }

/** สถานะ Complete ในแอป (เทียบกับ legacy sheet ที่ใช้เลข 7) */
export const DASHBOARD_COMPLETE_STATUS = '8'

export const DASHBOARD_STATUS_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

export interface DashboardStatusMeta {
  short: string
  legend: string
  color: string
}

export const DASHBOARD_STATUS_INFO: Record<string, DashboardStatusMeta> = {
  '1': { short: 'P', legend: 'Pending', color: '#a3a3a3' },
  '2': { short: 'W', legend: 'Wait Approve', color: '#fbbf24' },
  '3': { short: 'A', legend: 'Approved', color: '#38bdf8' },
  '4': { short: 'P', legend: 'Poured', color: '#22d3ee' },
  '5': { short: 'D', legend: 'Postponed', color: '#fb923c' },
  '6': { short: 'R', legend: 'Reject', color: '#f87171' },
  '7': { short: 'C', legend: 'Cancel', color: '#64748b' },
  '8': { short: 'D', legend: 'Complete', color: '#4ade80' },
}

export const SUPPLIER_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#0EA5E9',
  '#64748B',
] as const

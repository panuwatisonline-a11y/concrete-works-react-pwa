import type { ElementType } from 'react'
import {
  Users,
  Building2,
  MapPin,
  HardHat,
  Layers,
  FlaskConical,
  TestTube2,
  Code2,
  GitBranch,
  Briefcase,
  Gauge,
  BarChart3,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react'
import { canManageUsers } from '@/lib/permissions'

export type AdminNavItem = {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

/** ลำดับเมนูตั้งค่า — sidebar / drawer (ทุก role เห็น; สิทธิ์แก้ไขแยกตาม permissions) */
export const adminConsoleNavLinks: AdminNavItem[] = [
  { to: '/cst', label: 'CST', icon: FlaskConical },
  { to: '/admin/cst-machine', label: 'CST Machine', icon: Gauge },
  { to: '/cst/concrete-summary', label: 'Concrete Summary', icon: BarChart3 },
  { to: '/admin/loss-concrete', label: 'Loss Concrete', icon: TrendingDown },
  { to: '/admin/location', label: 'Location', icon: MapPin },
  { to: '/admin/concrete-works', label: 'Concrete Works', icon: HardHat },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mixed Code', icon: TestTube2 },
  { to: '/admin/abc-code', label: 'ABC', icon: Code2 },
  { to: '/admin/wbs-code', label: 'WBS', icon: GitBranch },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/client', label: 'Client', icon: Building2 },
  { to: '/admin/inspector', label: 'Inspector', icon: ShieldCheck },
  { to: '/admin/users', label: 'User Settings', icon: Users },
]

export function adminConsoleLinks(role: string | null | undefined): AdminNavItem[] {
  if (!role) return []
  if (canManageUsers(role)) return adminConsoleNavLinks
  return adminConsoleNavLinks.filter((l) => l.to !== '/admin/users')
}

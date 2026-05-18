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
} from 'lucide-react'

export type AdminNavItem = {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

/** ลำดับเมนูผู้ดูแล — sidebar / drawer Admin */
export const adminConsoleNavLinks: AdminNavItem[] = [
  { to: '/cst', label: 'CST', icon: FlaskConical },
  { to: '/admin/cst-machine', label: 'CST Machine', icon: Gauge },
  { to: '/cst/concrete-summary', label: 'Concrete Summary', icon: BarChart3 },
  { to: '/admin/location', label: 'Location', icon: MapPin },
  { to: '/admin/concrete-works', label: 'Concrete Works', icon: HardHat },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mixed Code', icon: TestTube2 },
  { to: '/admin/abc-code', label: 'ABC', icon: Code2 },
  { to: '/admin/wbs-code', label: 'WBS', icon: GitBranch },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/client', label: 'Client', icon: Building2 },
  { to: '/admin/users', label: 'User Settings', icon: Users },
]

const managerConsoleNavLinks: AdminNavItem[] = [
  { to: '/cst', label: 'CST', icon: FlaskConical },
  { to: '/cst/concrete-summary', label: 'Concrete Summary', icon: BarChart3 },
]

export function adminConsoleLinks(role: string | null | undefined): AdminNavItem[] {
  if (role === 'admin') return adminConsoleNavLinks
  if (role === 'manager') return managerConsoleNavLinks
  return []
}

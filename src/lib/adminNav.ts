import type { SvgIconComponent } from '@mui/icons-material'
import AccountTree from '@mui/icons-material/AccountTree'
import BarChart from '@mui/icons-material/BarChart'
import Biotech from '@mui/icons-material/Biotech'
import Business from '@mui/icons-material/Business'
import Code from '@mui/icons-material/Code'
import Engineering from '@mui/icons-material/Engineering'
import Layers from '@mui/icons-material/Layers'
import People from '@mui/icons-material/People'
import Place from '@mui/icons-material/Place'
import Science from '@mui/icons-material/Science'
import Speed from '@mui/icons-material/Speed'
import TrendingDown from '@mui/icons-material/TrendingDown'
import VerifiedUser from '@mui/icons-material/VerifiedUser'
import Work from '@mui/icons-material/Work'
import CloudUpload from '@mui/icons-material/CloudUpload'
import { canManageUsers, canManageJobsRegistry, canManageUploadSettings } from '@/lib/permissions'

export type AdminNavItem = {
  to: string
  label: string
  icon: SvgIconComponent
  end?: boolean
}

/** ลำดับเมนูตั้งค่า — sidebar / drawer (ทุก role เห็น; สิทธิ์แก้ไขแยกตาม permissions) */
export const adminConsoleNavLinks: AdminNavItem[] = [
  { to: '/cst', label: 'CST', icon: Science },
  { to: '/admin/cst-machine', label: 'CST Machine', icon: Speed },
  { to: '/cst/concrete-summary', label: 'Concrete Summary', icon: BarChart },
  { to: '/admin/loss-concrete', label: 'Loss Concrete', icon: TrendingDown },
  { to: '/admin/location', label: 'Location', icon: Place },
  { to: '/admin/concrete-works', label: 'Concrete Works', icon: Engineering },
  { to: '/admin/structure', label: 'Structure', icon: Layers },
  { to: '/admin/mixcode', label: 'Mixed Code', icon: Biotech },
  { to: '/admin/abc-code', label: 'ABC', icon: Code },
  { to: '/admin/wbs-code', label: 'WBS', icon: AccountTree },
  { to: '/admin/jobs', label: 'Jobs', icon: Work },
  { to: '/admin/client', label: 'User Group', icon: Business },
  { to: '/admin/inspector', label: 'Inspector (QC)', icon: VerifiedUser },
  { to: '/admin/users', label: 'User Settings', icon: People },
  { to: '/admin/upload-settings', label: 'Upload Settings', icon: CloudUpload },
]

export function adminConsoleLinks(role: string | null | undefined): AdminNavItem[] {
  if (!role) return []
  let links = adminConsoleNavLinks
  if (!canManageJobsRegistry(role)) {
    links = links.filter((l) => l.to !== '/admin/jobs')
  }
  if (!canManageUsers(role)) {
    links = links.filter((l) => l.to !== '/admin/users')
  }
  if (!canManageUploadSettings(role)) {
    links = links.filter((l) => l.to !== '/admin/upload-settings')
  }
  return links
}

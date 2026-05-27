import type { SvgIconComponent } from '@mui/icons-material'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import EventRepeat from '@mui/icons-material/EventRepeat'
import Gavel from '@mui/icons-material/Gavel'
import LocalShipping from '@mui/icons-material/LocalShipping'
import PendingActions from '@mui/icons-material/PendingActions'
import TaskAlt from '@mui/icons-material/TaskAlt'
import Block from '@mui/icons-material/Block'
import Timeline from '@mui/icons-material/Timeline'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import ListAlt from '@mui/icons-material/ListAlt'
import Person from '@mui/icons-material/Person'
import AddCircle from '@mui/icons-material/AddCircle'

/** ไอคอนตาม workflow สถานะคำขอ (status_id 1–8) */
export const STATUS_ICONS: Record<number, SvgIconComponent> = {
  1: PendingActions,
  2: Gavel,
  3: CheckCircle,
  4: LocalShipping,
  5: EventRepeat,
  6: Block,
  7: CancelOutlined,
  8: TaskAlt,
}

export function getStatusIcon(statusId: number): SvgIconComponent {
  return STATUS_ICONS[statusId] ?? PendingActions
}

export const REQUEST_LIST_TAB_ICONS = {
  summary: Timeline,
  calendar: CalendarMonth,
  latest: ListAlt,
  mine: Person,
} as const

export { AddCircle }

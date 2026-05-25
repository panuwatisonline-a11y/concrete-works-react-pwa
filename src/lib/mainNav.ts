import type { SvgIconComponent } from '@mui/icons-material'
import AddCircle from '@mui/icons-material/AddCircle'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Description from '@mui/icons-material/Description'
import ListAlt from '@mui/icons-material/ListAlt'
import Person from '@mui/icons-material/Person'
import Timeline from '@mui/icons-material/Timeline'
import { APP_HOME } from '@/lib/appHome'
import { canBookConcrete } from '@/lib/permissions'

export type MainNavItem = {
  to: string
  label: string
  icon: SvgIconComponent
  end?: boolean
}

const BASE_MAIN_LINKS: MainNavItem[] = [
  { to: APP_HOME, label: 'สถานะ', icon: Timeline, end: true },
  { to: '/requests?view=calendar', label: 'ปฏิทินจอง', icon: CalendarMonth },
  { to: '/requests/booking-summary', label: 'สรุปรายการจอง', icon: ListAlt },
  { to: '/preview/forms', label: 'ตัวอย่างแบบฟอร์ม', icon: Description },
  { to: '/profile', label: 'โปรไฟล์', icon: Person },
]

const BOOK_LINK: MainNavItem = {
  to: '/requests/new',
  label: 'จองคอนกรีต',
  icon: AddCircle,
}

export function mainNavLinks(role: string | null | undefined): MainNavItem[] {
  const links = [...BASE_MAIN_LINKS]
  if (canBookConcrete(role)) {
    links.splice(1, 0, BOOK_LINK)
  }
  return links
}

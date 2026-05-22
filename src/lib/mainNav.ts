import type { ElementType } from 'react'
import { Activity, CalendarDays, ClipboardList, Files, PlusCircle, User } from 'lucide-react'
import { APP_HOME } from '@/lib/appHome'
import { canBookConcrete } from '@/lib/permissions'

export type MainNavItem = {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const BASE_MAIN_LINKS: MainNavItem[] = [
  { to: APP_HOME, label: 'สถานะ', icon: Activity, end: true },
  { to: '/requests?view=calendar', label: 'ปฏิทินจอง', icon: CalendarDays },
  { to: '/requests/booking-summary', label: 'สรุปรายการจอง', icon: ClipboardList },
  { to: '/preview/forms', label: 'ตัวอย่างแบบฟอร์ม', icon: Files },
  { to: '/profile', label: 'โปรไฟล์', icon: User },
]

const BOOK_LINK: MainNavItem = {
  to: '/requests/new',
  label: 'จองคอนกรีต',
  icon: PlusCircle,
}

export function mainNavLinks(role: string | null | undefined): MainNavItem[] {
  const links = [...BASE_MAIN_LINKS]
  if (canBookConcrete(role)) {
    links.splice(1, 0, BOOK_LINK)
  }
  return links
}

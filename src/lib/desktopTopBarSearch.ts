/**
 * Desktop top search bar: copy and behavior depend on the current route
 * so the field matches each page (requests vs admin vs profile, etc.).
 */

/** Request list — matches fields used in `collectRequestIdsMatchingSearch`. */
export const REQUEST_LIST_SEARCH_PLACEHOLDER =
  'ค้นหา User Group, งานคอนกรีต, โครงสร้าง, Location, Mix, กำลัง, ABC, WBS…'

/** ข้อความสั้นสำหรับแถบค้นหา desktop (ไม่ล้น top bar) */
export const REQUEST_LIST_SEARCH_PLACEHOLDER_DESKTOP = 'ค้นหาในรายการคำขอ…'

export const REQUEST_LIST_SEARCH_ARIA = 'ค้นหาในคำขอ'

export const REQUEST_DETAIL_SEARCH_PLACEHOLDER =
  'ค้นหารายการคำขอ — กด Enter เพื่อไปหน้ารายการพร้อมคำค้นนี้'

export const REQUEST_DETAIL_SEARCH_PLACEHOLDER_DESKTOP = 'ค้นหาคำขอ — Enter ไปรายการ…'

export const REQUEST_DETAIL_SEARCH_ARIA = 'ค้นหาคำขอ แล้วกด Enter เพื่อไปหน้ารายการ'

/** CST list — ค้นหาในคำขอ Complete (เดียวกับรายการคำขอ) */
export const CST_LIST_SEARCH_PLACEHOLDER =
  'ค้นหา CST — User Group, โครงสร้าง, Location, Mix, ABC, WBS…'

export const CST_LIST_SEARCH_PLACEHOLDER_DESKTOP = 'ค้นหา CST…'

export const CST_LIST_SEARCH_ARIA = 'ค้นหาในหน้า CST'

export const BOOKING_SUMMARY_SEARCH_PLACEHOLDER =
  'ค้นหาในตารางสรุป — งานคอนกรีต, โครงสร้าง, ผู้จอง, เบอร์โทร, Mix…'

export const BOOKING_SUMMARY_SEARCH_PLACEHOLDER_DESKTOP = 'ค้นหาในตารางสรุป…'

export const BOOKING_SUMMARY_SEARCH_ARIA = 'ค้นหาในหน้าสรุปรายการจอง'

export const CONCRETE_SUMMARY_SEARCH_PLACEHOLDER =
  'ค้นหา Concrete Summary — โครงสร้าง, Location, Mix, Supplier…'

export const CONCRETE_SUMMARY_SEARCH_PLACEHOLDER_DESKTOP = 'ค้นหา Concrete Summary…'

export const CONCRETE_SUMMARY_SEARCH_ARIA = 'ค้นหาในหน้า Concrete Summary'

/** ข้อความในแถบค้นหา desktop — กันข้อความยาวจากหน้าลูกทำให้ล้น */
export function topBarPlaceholder(text: string, maxChars = 38): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars - 1)}…`
}

export interface DesktopSearchBarConfig {
  bindFilter: boolean
  showRequestFilterButton: boolean
  placeholder: string
  ariaLabel: string
  inputDisabled: boolean
}

function adminIdle(pathname: string): DesktopSearchBarConfig {
  let placeholder = 'ค้นหา — ใช้ที่หน้าสถานะคำขอ'
  if (pathname.startsWith('/admin/users')) {
    placeholder = 'Users — ค้นหาในตารางหน้านี้'
  } else if (pathname.startsWith('/admin/client')) {
    placeholder = 'User Group — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/location')) {
    placeholder = 'Location — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/concrete-works')) {
    placeholder = 'Concrete Works — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/structure')) {
    placeholder = 'Structure — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/mixcode')) {
    placeholder = 'Mixcode — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/abc-code')) {
    placeholder = 'ABC Code — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/wbs-code')) {
    placeholder = 'WBS Code — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/jobs')) {
    placeholder = 'Jobs — ค้นหาในตาราง'
  } else if (pathname.startsWith('/admin/cst-machine')) {
    placeholder = 'CST Machine — ค้นหาในตาราง'
  } else if (pathname === '/admin' || pathname === '/admin/') {
    placeholder = 'Dashboard — ค้นหาที่หน้าสถานะ'
  }
  return {
    bindFilter: false,
    showRequestFilterButton: false,
    placeholder,
    ariaLabel: 'ช่องค้นหาไม่ใช้ในหน้านี้',
    inputDisabled: true,
  }
}

export function getDesktopSearchBarConfig(pathname: string): DesktopSearchBarConfig {
  if (pathname === '/requests/new') {
    return {
      bindFilter: false,
      showRequestFilterButton: false,
      placeholder: 'จองคอนกรีต — ใช้ฟอร์มด้านล่าง',
      ariaLabel: 'การค้นหารายการคำขอไม่ใช้ในหน้านี้',
      inputDisabled: true,
    }
  }
  if (pathname.startsWith('/profile')) {
    return {
      bindFilter: false,
      showRequestFilterButton: false,
      placeholder: 'โปรไฟล์ — ค้นหาที่หน้าสถานะ',
      ariaLabel: 'การค้นหาคำขอไม่ใช้ในหน้าโปรไฟล์',
      inputDisabled: true,
    }
  }
  if (pathname.startsWith('/cst/concrete-summary')) {
    return {
      bindFilter: true,
      showRequestFilterButton: false,
      placeholder: CONCRETE_SUMMARY_SEARCH_PLACEHOLDER_DESKTOP,
      ariaLabel: CONCRETE_SUMMARY_SEARCH_ARIA,
      inputDisabled: false,
    }
  }
  if (pathname.startsWith('/cst')) {
    return {
      bindFilter: true,
      showRequestFilterButton: true,
      placeholder: CST_LIST_SEARCH_PLACEHOLDER_DESKTOP,
      ariaLabel: CST_LIST_SEARCH_ARIA,
      inputDisabled: false,
    }
  }
  if (pathname.startsWith('/requests/booking-summary')) {
    return {
      bindFilter: true,
      showRequestFilterButton: false,
      placeholder: BOOKING_SUMMARY_SEARCH_PLACEHOLDER_DESKTOP,
      ariaLabel: BOOKING_SUMMARY_SEARCH_ARIA,
      inputDisabled: false,
    }
  }
  if (pathname.startsWith('/admin')) {
    return adminIdle(pathname)
  }
  if (pathname.startsWith('/requests/')) {
    return {
      bindFilter: true,
      showRequestFilterButton: true,
      placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER_DESKTOP,
      ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
      inputDisabled: false,
    }
  }
  return {
    bindFilter: true,
    showRequestFilterButton: true,
    placeholder: REQUEST_LIST_SEARCH_PLACEHOLDER_DESKTOP,
    ariaLabel: REQUEST_LIST_SEARCH_ARIA,
    inputDisabled: false,
  }
}

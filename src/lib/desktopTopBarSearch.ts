/**
 * Desktop top search bar: copy and behavior depend on the current route
 * so the field matches each page (requests vs admin vs profile, etc.).
 */

/** Request list — matches fields used in `collectRequestIdsMatchingSearch`. */
export const REQUEST_LIST_SEARCH_PLACEHOLDER =
  'ค้นหา Client, งานคอนกรีต, โครงสร้าง, Location, Mix, กำลัง, ABC, WBS…'

export const REQUEST_LIST_SEARCH_ARIA = 'ค้นหาในคำขอ'

export const REQUEST_DETAIL_SEARCH_PLACEHOLDER =
  'ค้นหารายการคำขอ — กด Enter เพื่อไปหน้ารายการพร้อมคำค้นนี้'

export const REQUEST_DETAIL_SEARCH_ARIA = 'ค้นหาคำขอ แล้วกด Enter เพื่อไปหน้ารายการ'

/** CST list — ค้นหาในคำขอ Complete (เดียวกับรายการคำขอ) */
export const CST_LIST_SEARCH_PLACEHOLDER =
  'ค้นหา CST — Client, โครงสร้าง, Location, Mix, ABC, WBS…'

export const CST_LIST_SEARCH_ARIA = 'ค้นหาในหน้า CST'

export interface DesktopSearchBarConfig {
  bindFilter: boolean
  showRequestFilterButton: boolean
  placeholder: string
  ariaLabel: string
  inputDisabled: boolean
}

function adminIdle(pathname: string): DesktopSearchBarConfig {
  let placeholder = 'หน้า Admin — การค้นหากลางใช้เฉพาะรายการคำขอ'
  if (pathname.startsWith('/admin/users')) {
    placeholder = 'Users Settings — จัดการผู้ใช้จากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/client')) {
    placeholder = 'Client — แก้ไขรายชื่อบริษัทจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/location')) {
    placeholder = 'Location — ค้นหา/แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/concrete-works')) {
    placeholder = 'Concrete Works — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/structure')) {
    placeholder = 'Structure — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/mixcode')) {
    placeholder = 'Mixcode — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/abc-code')) {
    placeholder = 'ABC Code — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/wbs-code')) {
    placeholder = 'WBS Code — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/jobs')) {
    placeholder = 'โครงการ (Jobs) — แก้ไขจากตารางในหน้านี้'
  } else if (pathname.startsWith('/admin/cst-machine')) {
    placeholder = 'CST Machine — ค้นหา/แก้ไขเครื่องอัดจากตารางในหน้านี้'
  } else if (pathname === '/admin' || pathname === '/admin/') {
    placeholder = 'Dashboard — การค้นหากลางใช้ที่หน้าสถานะ (คำขอ)'
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
      placeholder: 'หน้าจองคอนกรีต — ใช้แบบฟอร์มด้านล่าง (การค้นหารายการใช้ที่หน้าสถานะ)',
      ariaLabel: 'การค้นหารายการคำขอไม่ใช้ในหน้านี้',
      inputDisabled: true,
    }
  }
  if (pathname.startsWith('/profile')) {
    return {
      bindFilter: false,
      showRequestFilterButton: false,
      placeholder: 'หน้าโปรไฟล์ — การค้นหารายการคำขอใช้ที่เมนูสถานะ',
      ariaLabel: 'การค้นหาคำขอไม่ใช้ในหน้าโปรไฟล์',
      inputDisabled: true,
    }
  }
  if (pathname.startsWith('/cst')) {
    return {
      bindFilter: true,
      showRequestFilterButton: true,
      placeholder: CST_LIST_SEARCH_PLACEHOLDER,
      ariaLabel: CST_LIST_SEARCH_ARIA,
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
      placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER,
      ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
      inputDisabled: false,
    }
  }
  return {
    bindFilter: true,
    showRequestFilterButton: true,
    placeholder: REQUEST_LIST_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_LIST_SEARCH_ARIA,
    inputDisabled: false,
  }
}

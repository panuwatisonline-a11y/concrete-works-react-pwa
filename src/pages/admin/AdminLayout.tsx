import { Outlet } from 'react-router-dom'

/** Admin routes use the global header; this outlet is only a layout boundary for nested routes. */
export function AdminLayout() {
  return <Outlet />
}

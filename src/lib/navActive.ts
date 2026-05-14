/** ใช้กับ NavLink เมื่อ `to` มี query — RR จับ active จาก pathname อย่างเดียวอาจผิด */
export function isNavToActive(
  to: string,
  loc: { pathname: string; search: string },
): boolean {
  let path: string
  let want: URLSearchParams
  try {
    const u = new URL(to, 'http://_')
    path = u.pathname
    want = u.searchParams
  } catch {
    return false
  }
  if (loc.pathname !== path) return false
  if ([...want.keys()].length === 0) return true
  const have = new URLSearchParams(loc.search)
  for (const k of want.keys()) {
    if (have.get(k) !== want.get(k)) return false
  }
  return true
}

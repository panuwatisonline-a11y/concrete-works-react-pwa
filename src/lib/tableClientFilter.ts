/** Client-side substring match for desktop search + tables. */
export function filterTableRows<T>(rows: T[], query: string, keys: string[]): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    keys.some((k) => String((row as Record<string, unknown>)[k] ?? '').toLowerCase().includes(q)),
  )
}

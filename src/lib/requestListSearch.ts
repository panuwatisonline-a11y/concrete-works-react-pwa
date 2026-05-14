/**
 * Free-text search for Request list: normalize for PostgREST `.or()` (commas separate clauses).
 */
export function sanitizeRequestListSearch(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,()]/g, ' ')
    .replace(/%/g, '')
    .replace(/_/g, ' ')
    .replace(/["']/g, '')
    .trim()
}

/**
 * PostgREST `or` filter string for Supabase `.or(...)` on Request + embedded relations.
 * Returns `null` when there is nothing to search.
 */
export function buildRequestListSearchOrClause(raw: string): string | null {
  const q = sanitizeRequestListSearch(raw)
  if (!q) return null
  const p = `%${q}%`
  const parts: string[] = [
    `structure_no.ilike.${p}`,
    `remarks.ilike.${p}`,
    `client.client_name.ilike.${p}`,
    `location.full_location.ilike.${p}`,
    `location.location1.ilike.${p}`,
    `concrete_work.concrete_work.ilike.${p}`,
    `structure.structure_name.ilike.${p}`,
    `mixcode.mixcode.ilike.${p}`,
    `mixcode.strength_type.ilike.${p}`,
    `mixcode.slump.ilike.${p}`,
    `abc_code.full_abc.ilike.${p}`,
    `abc_code.description.ilike.${p}`,
    `wbs_code.full_wbs.ilike.${p}`,
    `wbs_code.description.ilike.${p}`,
  ]
  if (/^\d+$/.test(q)) {
    parts.push(`strength.eq.${q}`)
    parts.push(`mixcode.strength.eq.${q}`)
  }
  return parts.join(',')
}

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Free-text search for Request list: normalize user input.
 * (Case folding is handled by Postgres `ilike`, not here.)
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

/** Wrap a value for PostgREST `or=(...,col.op."value",...)` (escapes `"` and `\`). */
export function quotePostgrestOrFilterValue(value: string): string {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

const IN_CHUNK = 180

async function forEachChunk<T>(items: T[], size: number, fn: (chunk: T[]) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size))
  }
}

/**
 * Resolves matching `Request.id` values by running several same-table `ilike` / `eq`
 * queries. PostgREST `.or()` cannot combine filters across different joined tables in
 * one clause (see @supabase/postgrest-js `or()` docs), so we merge IDs client-side.
 *
 * @returns `null` when there is no search text (caller should not add an id filter).
 *          `[]` when there is a query but no row matches any branch.
 */
export async function collectRequestIdsMatchingSearch(
  supabase: SupabaseClient,
  raw: string,
): Promise<string[] | null> {
  const q = sanitizeRequestListSearch(raw)
  if (!q) return null

  const pat = `%${q}%`
  const qv = quotePostgrestOrFilterValue(pat)
  const ids = new Set<string>()
  const add = (rows: { id: string }[] | null | undefined) => {
    rows?.forEach((r) => ids.add(r.id))
  }

  const isDigits = /^\d+$/.test(q)

  const tasks: PromiseLike<unknown>[] = []

  // --- Request (same table only in one `.or`) ---
  const requestOrParts = [`structure_no.ilike.${qv}`, `remarks.ilike.${qv}`]
  if (isDigits) {
    requestOrParts.push(`strength.eq.${q}`)
  }
  tasks.push(
    supabase
      .from('Request')
      .select('id')
      .or(requestOrParts.join(','))
      .then(({ data, error }) => {
        if (error) console.error('request search (Request):', error.message)
        else add(data)
      }),
  )

  // --- Client → client_id ---
  tasks.push(
    supabase
      .from('Client')
      .select('id')
      .ilike('client_name', pat)
      .then(async ({ data: clients, error }) => {
        if (error) {
          console.error('request search (Client):', error.message)
          return
        }
        const refIds = clients?.map((c) => c.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('client_id', chunk)
          if (e2) console.error('request search (Request by client_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- Location ---
  tasks.push(
    supabase
      .from('Location')
      .select('id')
      .or(`full_location.ilike.${qv},location1.ilike.${qv}`)
      .then(async ({ data: locs, error }) => {
        if (error) {
          console.error('request search (Location):', error.message)
          return
        }
        const refIds = locs?.map((l) => l.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('location_id', chunk)
          if (e2) console.error('request search (Request by location_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- Concrete Works ---
  tasks.push(
    supabase
      .from('Concrete Works')
      .select('id')
      .ilike('concrete_work', pat)
      .then(async ({ data: rows, error }) => {
        if (error) {
          console.error('request search (Concrete Works):', error.message)
          return
        }
        const refIds = rows?.map((r) => r.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('concrete_work_id', chunk)
          if (e2) console.error('request search (Request by concrete_work_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- Structure ---
  tasks.push(
    supabase
      .from('Structure')
      .select('id')
      .ilike('structure_name', pat)
      .then(async ({ data: rows, error }) => {
        if (error) {
          console.error('request search (Structure):', error.message)
          return
        }
        const refIds = rows?.map((r) => r.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('structure_id', chunk)
          if (e2) console.error('request search (Request by structure_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- Mixed Code ---
  const mixOrParts = [`mixcode.ilike.${qv}`, `strength_type.ilike.${qv}`, `slump.ilike.${qv}`]
  if (isDigits) mixOrParts.push(`strength.eq.${q}`)
  tasks.push(
    supabase
      .from('Mixed Code')
      .select('id')
      .or(mixOrParts.join(','))
      .then(async ({ data: rows, error }) => {
        if (error) {
          console.error('request search (Mixed Code):', error.message)
          return
        }
        const refIds = rows?.map((r) => r.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('mixcode_id', chunk)
          if (e2) console.error('request search (Request by mixcode_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- ABC Code ---
  tasks.push(
    supabase
      .from('ABC Code')
      .select('id')
      .or(`full_abc.ilike.${qv},description.ilike.${qv}`)
      .then(async ({ data: rows, error }) => {
        if (error) {
          console.error('request search (ABC Code):', error.message)
          return
        }
        const refIds = rows?.map((r) => r.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('abc_code_id', chunk)
          if (e2) console.error('request search (Request by abc_code_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- WBS Code ---
  tasks.push(
    supabase
      .from('WBS Code')
      .select('id')
      .or(`full_wbs.ilike.${qv},description.ilike.${qv}`)
      .then(async ({ data: rows, error }) => {
        if (error) {
          console.error('request search (WBS Code):', error.message)
          return
        }
        const refIds = rows?.map((r) => r.id) ?? []
        await forEachChunk(refIds, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('wbs_code_id', chunk)
          if (e2) console.error('request search (Request by wbs_code_id):', e2.message)
          else add(data)
        })
      }),
  )

  // --- Booker (profiles) ---
  tasks.push(
    supabase
      .from('profiles')
      .select('id')
      .or(`fname.ilike.${qv},lname.ilike.${qv},employee_id.ilike.${qv}`)
      .then(async ({ data: profs, error }) => {
        if (error) {
          console.error('request search (profiles):', error.message)
          return
        }
        const uuids = profs?.map((p) => p.id) ?? []
        await forEachChunk(uuids, IN_CHUNK, async (chunk) => {
          if (chunk.length === 0) return
          const { data, error: e2 } = await supabase.from('Request').select('id').in('booked_by', chunk)
          if (e2) console.error('request search (Request by booked_by):', e2.message)
          else add(data)
        })
      }),
  )

  await Promise.all(tasks)
  return [...ids]
}

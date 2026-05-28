import { supabase } from '@/lib/supabase'
import { applyJobScope, resolveInsertJobId, resolveQueryJobScope, withJobId } from '@/lib/jobScope'
import { useAuthStore } from '@/stores/authStore'
import { useJobFilterStore } from '@/stores/jobFilterStore'

function currentScope() {
  const { profile, role } = useAuthStore.getState()
  const superAdminFilter = useJobFilterStore.getState().superAdminJobFilter
  return resolveQueryJobScope({ role, profile, superAdminFilter })
}

function currentInsertJobId(): number {
  const { profile, role } = useAuthStore.getState()
  const superAdminFilter = useJobFilterStore.getState().superAdminJobFilter
  return resolveInsertJobId({ role, profile, superAdminFilter })
}

export function scopeFromAuth() {
  return currentScope()
}

export function insertJobIdFromAuth(): number {
  return currentInsertJobId()
}

export function withInsertJobId<T extends Record<string, unknown>>(row: T): T & { job_id: number } {
  return withJobId(row, currentInsertJobId())
}

type OrderOpts = { column: string; ascending?: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyScopeToQuery(query: any): any {
  return applyJobScope(query, currentScope())
}

/** Scoped select builder — chain `.order()`, `.eq()`, etc. then await. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scopedSelect(table: string, columns = '*'): any {
  return applyJobScope(supabase.from(table).select(columns), currentScope())
}

export async function fetchScopedRows<T>(
  table: string,
  order?: OrderOpts,
): Promise<{ data: T[] | null; error: Error | null }> {
  const scope = currentScope()
  let query = supabase.from(table).select('*')
  query = applyJobScope(query, scope)
  if (order) {
    query = query.order(order.column, { ascending: order.ascending ?? true })
  }
  const { data, error } = await query
  return { data: data as T[] | null, error: error ? new Error(error.message) : null }
}

export async function insertScopedRow<T extends Record<string, unknown>>(
  table: string,
  row: T,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from(table).insert(withInsertJobId(row))
  return { error: error ? new Error(error.message) : null }
}

export async function insertScopedRowReturning<T extends Record<string, unknown>, R = { id: number }>(
  table: string,
  row: T,
  columns = 'id',
): Promise<{ data: R | null; error: Error | null }> {
  const { data, error } = await supabase
    .from(table)
    .insert(withInsertJobId(row))
    .select(columns)
    .single()
  return {
    data: (data as R | null) ?? null,
    error: error ? new Error(error.message) : null,
  }
}

export async function fetchScopedRowById<T>(
  table: string,
  id: string | number,
  columns = '*',
): Promise<{ data: T | null; error: Error | null }> {
  const scope = currentScope()
  let query = supabase.from(table).select(columns).eq('id', id)
  query = applyJobScope(query, scope)
  const { data, error } = await query.maybeSingle()
  return {
    data: (data as T | null) ?? null,
    error: error ? new Error(error.message) : null,
  }
}

export async function updateScopedRowById<T extends Record<string, unknown>>(
  table: string,
  id: string | number,
  patch: T,
): Promise<{ error: Error | null }> {
  const scope = currentScope()
  let query = supabase.from(table).update(patch).eq('id', id)
  query = applyJobScope(query, scope)
  const { error } = await query
  return { error: error ? new Error(error.message) : null }
}

export async function deleteScopedRowById(
  table: string,
  id: string | number,
): Promise<{ error: Error | null }> {
  const scope = currentScope()
  let query = supabase.from(table).delete().eq('id', id)
  query = applyJobScope(query, scope)
  const { error } = await query
  return { error: error ? new Error(error.message) : null }
}

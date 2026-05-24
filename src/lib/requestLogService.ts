import { withInsertJobId } from '@/lib/jobScopeQueries'
import { supabase } from '@/lib/supabase'

async function requestJobId(requestId: string): Promise<number | null> {
  const { data, error } = await supabase.from('Request').select('job_id').eq('id', requestId).maybeSingle()
  if (error || !data?.job_id) return null
  return data.job_id as number
}

/**
 * บันทึก Request_Log action `booked` ครั้งเดียวต่อคำขอ — กันซ้ำจาก trigger + แอป หรือ double-submit
 */
export async function ensureBookedRequestLog(requestId: string, userId: string): Promise<{ error: string | null }> {
  const { data: rows, error: selErr } = await supabase
    .from('Request_Log')
    .select('id')
    .eq('request_id', requestId)
    .eq('action', 'booked')
    .limit(1)

  if (selErr) return { error: selErr.message }
  if (rows && rows.length > 0) return { error: null }

  const jobId = await requestJobId(requestId)
  const base = {
    request_id: requestId,
    status_id: 1,
    action: 'booked',
    action_by: userId,
  }

  const { error: insErr } = await supabase.from('Request_Log').insert(
    jobId != null ? { ...base, job_id: jobId } : withInsertJobId(base),
  )

  if (!insErr) return { error: null }
  if (insErr.code === '23505') return { error: null }
  return { error: insErr.message }
}

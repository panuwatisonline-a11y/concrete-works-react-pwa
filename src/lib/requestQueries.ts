import { supabase } from '@/lib/supabase'
import type { RequestLogWithProfile, RequestWithRelations } from '@/types/app.types'

export const REQUEST_LIST_SELECT = `
  *,
  status:Status(id, status_name),
  client:Client(id, client_name),
  location:Location(id, full_location, location1),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type, supplier),
  abc_code:"ABC Code"(id, full_abc),
  wbs_code:"WBS Code"(id, full_wbs),
  booked_by_profile:profiles!booked_by(fname, lname, employee_id, phone)
`

export const REQUEST_DETAIL_SELECT = `
  *,
  status:Status(id, status_name),
  client:Client(id, client_name),
  location:Location(id, full_location),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type, sample_type, supplier),
  abc_code:"ABC Code"(id, full_abc),
  wbs_code:"WBS Code"(id, full_wbs),
  booked_by_profile:profiles!booked_by(fname, lname, phone)
`

export async function fetchRequestById(id: string): Promise<RequestWithRelations | null> {
  const { data, error } = await supabase
    .from('Request')
    .select(REQUEST_DETAIL_SELECT)
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as RequestWithRelations
}

export async function fetchRequestLogs(requestId: string): Promise<RequestLogWithProfile[]> {
  const { data, error } = await supabase
    .from('Request_Log')
    .select(`*, profile:profiles!action_by(fname, lname)`)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as RequestLogWithProfile[]
}

import { supabase } from '@/lib/supabase'

/**
 * อัปเดตเฉพาะคอลัมน์ `booking_ok` ในตาราง Request — ไม่เขียน Request_Log หรือตารางอื่น
 */
export async function setRequestBookingOk(
  requestId: string,
  bookingOk: boolean | null,
): Promise<void> {
  const { error } = await supabase
    .from('Request')
    .update({ booking_ok: bookingOk })
    .eq('id', requestId)
  if (error) throw error
}

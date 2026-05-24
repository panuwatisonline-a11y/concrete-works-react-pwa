import { toast } from 'sonner'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { applyJobScope, resolveQueryJobScope } from '@/lib/jobScope'
import { useAuthStore } from '@/stores/authStore'
import { useJobFilterStore } from '@/stores/jobFilterStore'
import { useMasterDataStore } from '@/stores/masterDataStore'

const MASTER_DATA_TIMEOUT_MS = 25_000

function scopedTableQuery(table: string) {
  const { profile, role } = useAuthStore.getState()
  const superAdminFilter = useJobFilterStore.getState().superAdminJobFilter
  const scope = resolveQueryJobScope({ role, profile, superAdminFilter })
  return applyJobScope(supabase.from(table).select('*'), scope)
}

/** โหลด master data ใหม่ — ใช้ตอน pull-to-refresh และ init */
export async function reloadMasterData(): Promise<void> {
  const { setAll, setLoaded } = useMasterDataStore.getState()

  if (!isSupabaseConfigured) {
    console.error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY at build time. Add env vars on the host (Cloudflare Pages / Vercel) and redeploy.',
    )
    toast.error(
      'ตั้งค่า Supabase ไม่ครบ — ใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY บน Cloudflare/Vercel แล้ว Redeploy',
    )
    setLoaded(true)
    return
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Master data exceeded ${MASTER_DATA_TIMEOUT_MS}ms`)),
        MASTER_DATA_TIMEOUT_MS,
      )
    })

    const [
      { data: statuses },
      { data: clients },
      { data: locations },
      { data: concreteWorks },
      { data: structures },
      { data: mixcodes },
      { data: abcCodes },
      { data: abcCode1 },
      { data: abcCode2 },
      { data: abcCode3 },
      { data: abcCode4 },
      { data: wbsCodes },
      { data: wbs1 },
      { data: wbs2 },
      { data: wbs3 },
      { data: wbs4 },
      { data: wbs5 },
      { data: wbs6 },
      { data: wbs7 },
      { data: jobs },
      { data: compressionMachines },
    ] = await Promise.race([
      Promise.all([
        supabase.from('Status').select('*').order('id'),
        scopedTableQuery('Client').order('client_name'),
        scopedTableQuery('Location').order('id'),
        scopedTableQuery('Concrete Works').order('concrete_work'),
        scopedTableQuery('Structure').order('structure_name'),
        scopedTableQuery('Mixed Code').order('mixcode'),
        scopedTableQuery('ABC Code').order('id'),
        scopedTableQuery('ABC Code1').order('code_name'),
        scopedTableQuery('ABC Code2').order('code_name'),
        scopedTableQuery('ABC Code3').order('code_name'),
        scopedTableQuery('ABC Code4').order('code_name'),
        scopedTableQuery('WBS Code').order('id'),
        scopedTableQuery('WBS1').order('code_name'),
        scopedTableQuery('WBS2').order('code_name'),
        scopedTableQuery('WBS3').order('code_name'),
        scopedTableQuery('WBS4').order('code_name'),
        scopedTableQuery('WBS5').order('code_name'),
        scopedTableQuery('WBS6').order('code_name'),
        scopedTableQuery('WBS7').order('code_name'),
        supabase.from('Jobs').select('*').order('job_name'),
        scopedTableQuery('Compression Machine')
          .select('id, machine, serial, k1, k2, cal_date, file, k, k_display, job_id')
          .order('machine'),
      ]),
      timeoutPromise,
    ])

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }

    setAll({
      statuses: statuses ?? [],
      clients: clients ?? [],
      locations: locations ?? [],
      concreteWorks: (concreteWorks as never) ?? [],
      structures: structures ?? [],
      mixcodes: (mixcodes as never) ?? [],
      abcCodes: (abcCodes as never) ?? [],
      abcCode1: abcCode1 ?? [],
      abcCode2: abcCode2 ?? [],
      abcCode3: abcCode3 ?? [],
      abcCode4: abcCode4 ?? [],
      wbsCodes: (wbsCodes as never) ?? [],
      wbs1: wbs1 ?? [],
      wbs2: wbs2 ?? [],
      wbs3: wbs3 ?? [],
      wbs4: wbs4 ?? [],
      wbs5: wbs5 ?? [],
      wbs6: wbs6 ?? [],
      wbs7: wbs7 ?? [],
      jobs: jobs ?? [],
      compressionMachines: compressionMachines ?? [],
    })
  } catch (e) {
    console.error('Master data load:', e)
    toast.error('โหลดข้อมูลอ้างอิงไม่สำเร็จ — ลองรีเฟรช หรือตรวจ Supabase / เครือข่าย')
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    setLoaded(true)
  }
}

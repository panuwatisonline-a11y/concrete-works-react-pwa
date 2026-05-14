import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMasterDataStore } from '@/stores/masterDataStore'

export function useMasterDataInit() {
  const { isLoaded, setAll, setLoaded } = useMasterDataStore()

  useEffect(() => {
    if (isLoaded) return

    async function load() {
      try {
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
        ] = await Promise.all([
          supabase.from('Status').select('*').order('id'),
          supabase.from('Client').select('*').order('client_name'),
          supabase.from('Location').select('*').order('id'),
          supabase.from('Concrete Works').select('*').order('concrete_work'),
          supabase.from('Structure').select('*').order('structure_name'),
          supabase.from('Mixed Code').select('*').order('mixcode'),
          supabase.from('ABC Code').select('*').order('id'),
          supabase.from('ABC Code1').select('*').order('code_name'),
          supabase.from('ABC Code2').select('*').order('code_name'),
          supabase.from('ABC Code3').select('*').order('code_name'),
          supabase.from('ABC Code4').select('*').order('code_name'),
          supabase.from('WBS Code').select('*').order('id'),
          supabase.from('WBS1').select('*').order('code_name'),
          supabase.from('WBS2').select('*').order('code_name'),
          supabase.from('WBS3').select('*').order('code_name'),
          supabase.from('WBS4').select('*').order('code_name'),
          supabase.from('WBS5').select('*').order('code_name'),
          supabase.from('WBS6').select('*').order('code_name'),
          supabase.from('WBS7').select('*').order('code_name'),
          supabase.from('Jobs').select('*').order('job_name'),
        ])

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
        })
      } catch (e) {
        console.error('Master data load:', e)
      } finally {
        setLoaded(true)
      }
    }

    load()
  }, [isLoaded, setAll, setLoaded])
}

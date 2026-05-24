import { useEffect, useMemo } from 'react'
import type { ConcreteWork, MixedCode, Structure } from '@/types/app.types'
import {
  filterMixcodesByConcreteWorkAndStructure,
  filterMixcodesForBooking,
  mixcodePickerEmptyMessage,
} from '@/lib/mixcodeBookingFilter'

type UseBookingMixcodePickerOpts = {
  mixcodes: MixedCode[]
  concreteWork: ConcreteWork | undefined
  structure: Structure | undefined
  dwgStrengthOption: string
  getMixcodeId: () => string
  setMixcodeId: (id: string) => void
  scopeEmptyMessage?: string
}

export function useBookingMixcodePicker({
  mixcodes,
  concreteWork,
  structure,
  dwgStrengthOption,
  getMixcodeId,
  setMixcodeId,
  scopeEmptyMessage,
}: UseBookingMixcodePickerOpts) {
  const scopeMixcodes = useMemo(
    () => filterMixcodesByConcreteWorkAndStructure({ mixcodes, concreteWork, structure }),
    [mixcodes, concreteWork, structure],
  )

  const pickerMixcodes = useMemo(
    () => filterMixcodesForBooking(scopeMixcodes, dwgStrengthOption),
    [scopeMixcodes, dwgStrengthOption],
  )

  const mixcodePickerLocked = pickerMixcodes.length === 1

  const pickerEmptyMessage = useMemo(
    () =>
      mixcodePickerEmptyMessage({
        dwgStrengthOption,
        scopeMixcodes,
        pickerMixcodes,
        scopeEmptyMessage,
      }),
    [dwgStrengthOption, scopeMixcodes, pickerMixcodes, scopeEmptyMessage],
  )

  useEffect(() => {
    if (pickerMixcodes.length === 1) {
      const only = String(pickerMixcodes[0].id)
      if (getMixcodeId() !== only) setMixcodeId(only)
      return
    }
    const cur = getMixcodeId()
    if (!cur) return
    if (!pickerMixcodes.some((m) => String(m.id) === cur)) setMixcodeId('')
  }, [pickerMixcodes, getMixcodeId, setMixcodeId])

  return {
    scopeMixcodes,
    pickerMixcodes,
    mixcodePickerLocked,
    pickerEmptyMessage,
  }
}

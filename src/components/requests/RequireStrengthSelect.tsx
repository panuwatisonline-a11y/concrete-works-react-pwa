import { useMemo } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DWG_STRENGTH_SELECT_PLACEHOLDER, listMixcodeStrengthOptions } from '@/lib/mixcodeStrengthOptions'
import type { MixedCode } from '@/types/app.types'

type Props = {
  value: string
  onChange: (value: string) => void
  mixcodes: MixedCode[]
  disabled?: boolean
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function RequireStrengthSelect({
  value,
  onChange,
  mixcodes,
  disabled,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: Props) {
  const options = useMemo(() => listMixcodeStrengthOptions(mixcodes), [mixcodes])

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      placeholder={options.length ? DWG_STRENGTH_SELECT_PLACEHOLDER : 'ยังไม่มี Strength ใน Mixcode'}
      options={options}
    />
  )
}

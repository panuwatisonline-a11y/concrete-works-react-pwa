import { useMemo } from 'react'
import { SearchableSelect, SELECT_CONTENT_ELEVATED_Z } from '@/components/ui/searchable-select'
import { DWG_STRENGTH_SELECT_PLACEHOLDER, listMixcodeStrengthOptions } from '@/lib/mixcodeStrengthOptions'
import type { MixedCode } from '@/types/app.types'

type Props = {
  value: string
  onChange: (value: string) => void
  mixcodes: MixedCode[]
  disabled?: boolean
  /** เปิดภายใน Dialog ชั้น WF/CST — z-index สูงกว่าเนื้อหา modal */
  inDialog?: boolean
}

export function RequireStrengthSelect({ value, onChange, mixcodes, disabled, inDialog }: Props) {
  const options = useMemo(() => listMixcodeStrengthOptions(mixcodes), [mixcodes])

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder={options.length ? DWG_STRENGTH_SELECT_PLACEHOLDER : 'ยังไม่มี Strength ใน Mixcode'}
      options={options}
      contentClassName={inDialog ? SELECT_CONTENT_ELEVATED_Z : undefined}
    />
  )
}

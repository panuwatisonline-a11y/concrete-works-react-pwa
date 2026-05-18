import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_CONTENT_ELEVATED_Z,
} from '@/components/ui/select'
import { DWG_STRENGTH_SELECT_PLACEHOLDER, listMixcodeStrengthOptions } from '@/lib/mixcodeStrengthOptions'
import type { MixedCode } from '@/types/app.types'

type Props = {
  value: string
  onChange: (value: string) => void
  mixcodes: MixedCode[]
  disabled?: boolean
}

export function RequireStrengthSelect({ value, onChange, mixcodes, disabled }: Props) {
  const options = useMemo(() => listMixcodeStrengthOptions(mixcodes), [mixcodes])

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={options.length ? DWG_STRENGTH_SELECT_PLACEHOLDER : 'ยังไม่มี Strength ใน Mixcode'} />
      </SelectTrigger>
      <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

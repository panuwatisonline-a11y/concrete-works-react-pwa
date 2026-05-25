import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

export { SELECT_CONTENT_ELEVATED_Z } from '@/components/ui/select'

export type SearchableSelectOption = {
  value: string
  label: string
  keywords?: string
}

export type SearchableSelectProps = {
  value?: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  listClassName?: string
  id?: string
  'aria-invalid'?: boolean
}

export function mapSearchableOptions<T>(
  items: readonly T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
  getKeywords?: (item: T) => string | undefined,
): SearchableSelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
    keywords: getKeywords?.(item),
  }))
}

function optionHaystack(option: SearchableSelectOption): string {
  return `${option.label} ${option.keywords ?? ''}`.toLowerCase()
}

export function SearchableSelect({
  value = '',
  onValueChange,
  options,
  placeholder = 'เลือก…',
  searchPlaceholder = 'พิมพ์เพื่อค้นหา…',
  emptyMessage = 'ไม่พบรายการ',
  disabled,
  triggerClassName,
  id,
  'aria-invalid': ariaInvalid,
}: SearchableSelectProps) {
  const selected = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  return (
    <Autocomplete
      id={id}
      disabled={disabled}
      options={options}
      value={selected}
      onChange={(_event, option) => onValueChange(option?.value ?? '')}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      noOptionsText={emptyMessage}
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase()
        if (!q) return opts
        return opts.filter((option) => optionHaystack(option).includes(q))
      }}
      slotProps={{
        popper: { sx: { zIndex: 300 } },
      }}
      className={triggerClassName}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={selected ? placeholder : searchPlaceholder}
          error={ariaInvalid}
          size="small"
          fullWidth
        />
      )}
    />
  )
}

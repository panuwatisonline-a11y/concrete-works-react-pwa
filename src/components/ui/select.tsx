/**
 * Radix Select API shim — ใช้ MUI; ในแอปใช้ SearchableSelect (Autocomplete) เป็นหลัก
 */
import * as React from 'react'
import MuiSelect, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'

export const SELECT_CONTENT_ELEVATED_Z = 'z-[300]'

type SelectContextValue = {
  value?: string
  onValueChange?: (value: string) => void
  labelId?: string
}

const SelectContext = React.createContext<SelectContextValue>({})

function Select({
  value,
  onValueChange,
  children,
  disabled,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  disabled?: boolean
}) {
  const labelId = React.useId()
  return (
    <SelectContext.Provider value={{ value, onValueChange, labelId }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        {children}
      </FormControl>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  if (value) return null
  return <span className="text-[color:var(--mui-palette-text-disabled)]">{placeholder}</span>
}

const SelectTrigger = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode; id?: string }>(
  ({ className, children, id }, ref) => {
    const { value, onValueChange, labelId } = React.useContext(SelectContext)
    return (
      <MuiSelect
        ref={ref}
        labelId={labelId}
        id={id}
        value={value ?? ''}
        displayEmpty
        className={className}
        onChange={(e: SelectChangeEvent<string>) => onValueChange?.(e.target.value)}
        renderValue={() => children}
      />
    )
  },
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>
const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

const SelectLabel = React.forwardRef<HTMLLabelElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const { labelId } = React.useContext(SelectContext)
    return (
      <InputLabel ref={ref} id={labelId} className={className}>
        {children}
      </InputLabel>
    )
  },
)
SelectLabel.displayName = 'SelectLabel'

const SelectItem = React.forwardRef<HTMLLIElement, { value: string; children?: React.ReactNode; className?: string; disabled?: boolean }>(
  ({ value, children, className, disabled }, ref) => (
    <MenuItem ref={ref} value={value} className={className} disabled={disabled}>
      {children}
    </MenuItem>
  ),
)
SelectItem.displayName = 'SelectItem'

const SelectSeparator = () => <Box sx={{ my: 0.5, borderTop: 1, borderColor: 'divider' }} />

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

import * as React from 'react'
import TextField from '@mui/material/TextField'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, value, defaultValue, id, name, disabled, placeholder, onChange, onBlur, rows = 4, ...props }, ref) => {
    const isControlled = value !== undefined
    return (
      <TextField
        id={id}
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        multiline
        minRows={rows}
        fullWidth
        size="small"
        className={className}
        inputRef={ref}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>}
        onBlur={onBlur as React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>}
        {...(isControlled ? { value: String(value) } : defaultValue !== undefined ? { defaultValue: String(defaultValue) } : {})}
        slotProps={{ htmlInput: props }}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }

import * as React from 'react'
import FormLabel from '@mui/material/FormLabel'

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<typeof FormLabel>>(
  ({ className, ...props }, ref) => (
    <FormLabel
      ref={ref}
      className={className}
      sx={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1, color: 'text.primary' }}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export { Label }

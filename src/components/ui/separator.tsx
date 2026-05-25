import * as React from 'react'
import Divider from '@mui/material/Divider'

const Separator = React.forwardRef<
  HTMLHRElement,
  React.ComponentProps<typeof Divider> & { decorative?: boolean; orientation?: 'horizontal' | 'vertical' }
>(({ className, orientation = 'horizontal', decorative: _decorative, ...props }, ref) => (
  <Divider
    ref={ref}
    className={className}
    orientation={orientation}
    flexItem={orientation === 'vertical'}
    {...props}
  />
))
Separator.displayName = 'Separator'

export { Separator }

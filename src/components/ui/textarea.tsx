import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, value, defaultValue, ...props }, ref) => {
    const isControlled = value !== undefined
    const filledFromValue = isControlled && String(value ?? '').trim() !== ''
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border-[1.5px] border-[#e2e6ec] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:font-normal placeholder:text-[#b4bcc8] focus-visible:border-[#2563eb] focus-visible:outline-none focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.10)] disabled:cursor-not-allowed disabled:opacity-50',
          '[&:not(:placeholder-shown)]:border-[#c7f0d0] [&:not(:placeholder-shown)]:bg-white',
          filledFromValue && 'border-[#c7f0d0] bg-white',
          className,
        )}
        ref={ref}
        {...props}
        {...(isControlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }

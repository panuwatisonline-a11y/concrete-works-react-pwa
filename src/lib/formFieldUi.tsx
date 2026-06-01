import { cn } from '@/lib/utils'

export function fieldWrapClass(message?: string) {
  return cn(
    'space-y-1.5 rounded-xl transition-shadow',
    message &&
      'ring-2 ring-[color:color-mix(in_srgb,hsl(var(--destructive))_35%,transparent)] ring-offset-2 ring-offset-[color:var(--pour-bg)]',
  )
}

export function FieldErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" data-field-error className="pour-field-error">
      {message}
    </p>
  )
}

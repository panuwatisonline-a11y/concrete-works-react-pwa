import { cn } from '@/lib/utils'
import type { Profile } from '@/types/app.types'

interface UserAvatarProps {
  profile: Profile | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ profile, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const initials = [profile?.fname?.[0], profile?.lname?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  const sizeClass = cn(
    size === 'sm' && 'h-7 w-7 text-xs',
    size === 'md' && 'h-9 w-9 text-sm',
    size === 'lg' && 'h-12 w-12 text-base',
  )

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        referrerPolicy="no-referrer"
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-black font-semibold text-white select-none',
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  )
}

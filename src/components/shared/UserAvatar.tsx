import { cn } from '@/lib/utils'
import type { Profile } from '@/types/app.types'

interface UserAvatarProps {
  profile: Profile | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ profile, size = 'md', className }: UserAvatarProps) {
  const initials = [profile?.fname?.[0], profile?.lname?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-black font-semibold text-white select-none',
        size === 'sm' && 'h-7 w-7 text-xs',
        size === 'md' && 'h-9 w-9 text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
        className
      )}
    >
      {initials}
    </div>
  )
}

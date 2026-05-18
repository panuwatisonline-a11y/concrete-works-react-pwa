import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/app.types'

interface UserAvatarProps {
  profile: Profile | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** เมื่อมีรูป — คลิกเพื่อดูขนาดใหญ่ */
  onImageClick?: () => void
}

export function UserAvatar({ profile, avatarUrl, size = 'md', className, onImageClick }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const initials = [profile?.fname?.[0], profile?.lname?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  const sizeClass = cn(
    size === 'sm' && 'h-7 w-7 text-xs',
    size === 'md' && 'h-9 w-9 text-sm',
    size === 'lg' && 'h-12 w-12 text-base',
  )

  const showImage = Boolean(avatarUrl) && !imgFailed

  if (showImage) {
    const img = (
      <img
        src={avatarUrl!}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={cn('rounded-full object-cover', sizeClass, onImageClick && 'pointer-events-none', className)}
      />
    )
    if (onImageClick) {
      return (
        <button
          type="button"
          onClick={onImageClick}
          className={cn(
            'shrink-0 rounded-full transition hover:ring-2 hover:ring-[color:var(--pour-accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent-ring)]',
            sizeClass,
            className,
          )}
          aria-label="ดูรูปโปรไฟล์ขนาดใหญ่"
        >
          {img}
        </button>
      )
    }
    return img
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-black font-semibold text-white select-none',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

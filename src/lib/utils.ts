import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '-'
  return time.slice(0, 5)
}

export function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase()
}

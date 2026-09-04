import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function getTimeTogether(startDate: string) {
  const start = new Date(startDate)
  const now = new Date()
  const diff = now.getTime() - start.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export function getNextAnniversary(startDate: string) {
  const start = new Date(startDate)
  const now = new Date()

  const nextAnniversary = new Date(start)
  nextAnniversary.setFullYear(now.getFullYear())

  if (nextAnniversary <= now) {
    nextAnniversary.setFullYear(now.getFullYear() + 1)
  }

  const diff = nextAnniversary.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, date: nextAnniversary }
}

export function isLetterUnlocked(unlockDate: string | null, locked: boolean): boolean {
  if (!locked) return true
  if (!unlockDate) return false
  return new Date(unlockDate) <= new Date()
}

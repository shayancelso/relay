import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getHealthColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export function getHealthBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700'
  if (score >= 60) return 'bg-amber-50 text-amber-700'
  if (score >= 40) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-700'
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-50 text-red-700 border-red-200'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-stone-100 text-stone-600 border-stone-200'
    case 'pending_approval': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'approved': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'intro_sent': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'meeting_booked': return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'in_progress': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'stalled': return 'bg-red-50 text-red-700 border-red-200'
    case 'cancelled': return 'bg-stone-100 text-stone-400 border-stone-200'
    default: return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export function getSegmentColor(segment: string): string {
  switch (segment) {
    case 'commercial': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'corporate': return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'enterprise': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'fins': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'international': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export function formatSegment(segment: string): string {
  switch (segment) {
    case 'commercial': return 'Commercial'
    case 'corporate': return 'Corporate'
    case 'enterprise': return 'Enterprise'
    case 'fins': return 'FINS'
    case 'international': return 'International'
    default: return segment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

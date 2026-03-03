// ---------------------------------------------------------------------------
// Shared equity scope-filtering utilities
// Used by Rules page (BookOfBusinessTab) and Team page (chart + enrichment)
// ---------------------------------------------------------------------------

import type { EquityRuleScope } from '@/lib/equity-types'

const TODAY = new Date('2026-03-02')
const RAMP_MONTHS = 12

/**
 * Returns true when a rep has been active for fewer than 12 months (on-ramp).
 * `createdAt` is an ISO date string, `role` must be 'rep', `capacity` > 0.
 */
export function isRepOnRamp(createdAt: string, capacity: number, role: string): boolean {
  if (role !== 'rep' || capacity === 0) return false
  const msElapsed = TODAY.getTime() - new Date(createdAt).getTime()
  const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 30.44)
  return monthsElapsed < RAMP_MONTHS
}

/**
 * Filter reps by scope.  Returns the full array when scope is undefined/empty.
 *
 * Each rep must satisfy:
 *  - `specialties` — rep's specialties array
 *  - `created_at`, `capacity`, `role` — for on-ramp check
 */
export function filterRepsByScope<
  T extends { specialties: string[]; created_at: string; capacity: number; role: string },
>(reps: T[], scope?: EquityRuleScope): T[] {
  if (!scope) return reps

  let filtered = reps

  // Exclude on-ramp reps
  if (scope.excludeOnRamp) {
    filtered = filtered.filter(r => !isRepOnRamp(r.created_at, r.capacity, r.role))
  }

  // Filter by rep specialties (case-insensitive match)
  if (scope.repSpecialties && scope.repSpecialties.length > 0) {
    const allowed = new Set(scope.repSpecialties.map(s => s.toLowerCase()))
    filtered = filtered.filter(r =>
      r.specialties.some(s => allowed.has(s.toLowerCase())),
    )
  }

  return filtered
}

/**
 * Filter accounts by segment scope.  Returns the full array when scope has
 * no segment filter.
 */
export function filterAccountsByScope<T extends { segment: string }>(
  accounts: T[],
  scope?: EquityRuleScope,
): T[] {
  if (!scope?.segments || scope.segments.length === 0) return accounts
  const allowed = new Set(scope.segments)
  return accounts.filter(a => allowed.has(a.segment))
}

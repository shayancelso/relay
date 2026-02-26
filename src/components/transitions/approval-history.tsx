'use client'

import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatRelativeDate, getInitials } from '@/lib/utils'

// ─── constants ────────────────────────────────────────────────────────────────

const SLA_WINDOW_DAYS = 21

// ─── helpers ──────────────────────────────────────────────────────────────────

function isSlaBreached(createdAt: string): boolean {
  const created = new Date(createdAt).getTime()
  const elapsedDays = (Date.now() - created) / (1000 * 60 * 60 * 24)
  return elapsedDays > SLA_WINDOW_DAYS
}

// Each step of the approval chain
interface ApprovalStep {
  id: string
  label: string
  actor: string | null
  /** ISO timestamp to display; null means "not yet reached" */
  timestamp: string | null
  state: 'complete' | 'pending' | 'escalated'
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface StepIconProps {
  state: ApprovalStep['state']
  isActive: boolean
}

function StepIcon({ state, isActive }: StepIconProps) {
  if (state === 'escalated') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-200 shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
      </div>
    )
  }

  if (state === 'pending') {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200 shrink-0',
          isActive && 'animate-pulse'
        )}
      >
        <Clock className="h-3.5 w-3.5 text-amber-500" />
      </div>
    )
  }

  // complete
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200 shrink-0">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
    </div>
  )
}

interface ApprovalStepRowProps {
  step: ApprovalStep
  isLast: boolean
  isActive: boolean
}

function ApprovalStepRow({ step, isLast, isActive }: ApprovalStepRowProps) {
  return (
    <div className="flex gap-3">
      {/* Icon + vertical connector */}
      <div className="relative flex flex-col items-center">
        <StepIcon state={step.state} isActive={isActive} />
        {!isLast && (
          <div
            className={cn(
              'w-px flex-1 mt-1 min-h-[20px]',
              step.state === 'complete' ? 'bg-emerald-200' : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Text content */}
      <div className={cn('min-w-0', isLast ? 'pb-0' : 'pb-4')}>
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              'text-[13px] font-medium leading-snug',
              step.state === 'escalated'
                ? 'text-red-700'
                : step.state === 'pending'
                ? 'text-amber-700'
                : 'text-foreground'
            )}
          >
            {step.label}
          </p>
          {isActive && step.state === 'pending' && (
            <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
              Current
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {step.actor && (
            <>
              {/* Actor avatar */}
              <div
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-700 ring-1 ring-indigo-200 shrink-0"
              >
                {getInitials(step.actor)}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {step.actor}
              </span>
              <span className="text-[11px] text-muted-foreground/40">·</span>
            </>
          )}
          <span className="text-[11px] text-muted-foreground">
            {step.timestamp ? formatRelativeDate(step.timestamp) : 'Awaiting'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

interface ApprovalHistoryProps {
  transitionStatus: string
  createdAt: string
  /** ISO string when submitted for approval; undefined if not yet submitted */
  submittedAt?: string
  /** ISO string when approved; undefined if not yet approved */
  approvedAt?: string
}

// ─── main component ───────────────────────────────────────────────────────────

export function ApprovalHistory({
  transitionStatus,
  createdAt,
  submittedAt,
  approvedAt,
}: ApprovalHistoryProps) {
  const slaBreached = isSlaBreached(createdAt)

  // Determine whether each step has been reached based on the status ordering
  const isSubmitted =
    submittedAt !== undefined ||
    [
      'pending_approval',
      'approved',
      'intro_sent',
      'meeting_booked',
      'in_progress',
      'completed',
    ].includes(transitionStatus)

  const isApproved =
    approvedAt !== undefined ||
    [
      'approved',
      'intro_sent',
      'meeting_booked',
      'in_progress',
      'completed',
    ].includes(transitionStatus)

  // Build timestamps for the "submitted" and "approved" steps from props or
  // derive approximate values from createdAt for display purposes.
  const submittedTimestamp =
    submittedAt ??
    (isSubmitted
      ? new Date(new Date(createdAt).getTime() + 1000 * 60 * 60 * 2).toISOString()
      : null)

  const approvedTimestamp =
    approvedAt ??
    (isApproved
      ? new Date(new Date(createdAt).getTime() + 1000 * 60 * 60 * 5).toISOString()
      : null)

  const steps: ApprovalStep[] = [
    {
      id: 'created',
      label: 'Transition created by Sarah Chen',
      actor: 'Sarah Chen',
      timestamp: createdAt,
      state: 'complete',
    },
    {
      id: 'submitted',
      label: 'Submitted for approval',
      actor: 'Sarah Chen',
      timestamp: submittedTimestamp,
      state: isSubmitted ? 'complete' : 'pending',
    },
    {
      id: 'approved',
      label: isApproved
        ? 'Approved by Marcus Johnson'
        : 'Pending approval by Marcus Johnson',
      actor: isApproved ? 'Marcus Johnson' : null,
      timestamp: approvedTimestamp,
      state: isApproved ? 'complete' : 'pending',
    },
  ]

  if (slaBreached) {
    steps.push({
      id: 'escalated',
      label: 'Escalated to VP Operations',
      actor: null,
      timestamp: new Date(
        new Date(createdAt).getTime() + SLA_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString(),
      state: 'escalated',
    })
  }

  // The "current" (active) step is the first non-complete one
  const activeIdx = steps.findIndex(s => s.state !== 'complete')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Approval Chain</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No approval events yet.
          </p>
        ) : (
          <div>
            {steps.map((step, i) => (
              <ApprovalStepRow
                key={step.id}
                step={step}
                isLast={i === steps.length - 1}
                isActive={i === activeIdx}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

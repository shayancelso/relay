'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  Sparkles,
  Mail,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Clock,
  ThumbsUp,
  RotateCcw,
  SendHorizonal,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatStatus, getStatusColor, getInitials } from '@/lib/utils'

// ─── constants ───────────────────────────────────────────────────────────────

const SLA_WINDOW_DAYS = 21

const WORKFLOW_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'intro_sent', label: 'Intro Sent' },
  { value: 'meeting_booked', label: 'Meeting' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function computeSla(createdAt: string): {
  daysRemaining: number
  progressPct: number
  isBreached: boolean
} {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const elapsedDays = (now - created) / (1000 * 60 * 60 * 24)
  const daysRemaining = Math.max(0, SLA_WINDOW_DAYS - elapsedDays)
  const progressPct = Math.min(100, (elapsedDays / SLA_WINDOW_DAYS) * 100)
  return {
    daysRemaining: Math.round(daysRemaining),
    progressPct,
    isBreached: daysRemaining === 0,
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface ApprovalBannerProps {
  onApprove: () => void
  onRequestChanges: () => void
}

function ApprovalBanner({ onApprove, onRequestChanges }: ApprovalBannerProps) {
  return (
    <div
      role="region"
      aria-label="Approval request"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              Approval Required
            </span>
          </div>
          <p className="text-[12px] text-amber-700 mt-1">
            Requested by{' '}
            <span className="font-semibold">Sarah Chen</span>
            <span className="mx-1 opacity-50">·</span>
            2 hours ago
          </p>
        </div>

        {/* Approver */}
        <div className="flex items-center gap-2">
          <div
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 shrink-0 ring-1 ring-indigo-200"
          >
            {getInitials('Marcus Johnson')}
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium text-foreground leading-none">
              Marcus Johnson
            </p>
            <p className="text-[11px] text-muted-foreground">Director AM</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onApprove}
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          aria-label="Approve this transition"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRequestChanges}
          className="h-8 text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
          aria-label="Request changes to this transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Request Changes
        </Button>
      </div>
    </div>
  )
}

interface SlaBarProps {
  createdAt: string
}

function SlaBar({ createdAt }: SlaBarProps) {
  const { daysRemaining, progressPct, isBreached } = computeSla(createdAt)

  if (isBreached) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="text-[12px] font-semibold text-red-700">
            BREACHED — Auto-escalated to VP Operations
          </span>
        </div>
        <Progress
          value={100}
          className="h-1.5 bg-red-200 [&>[data-slot=progress-indicator]]:bg-red-500"
          aria-label="SLA progress"
          aria-valuenow={100}
        />
      </div>
    )
  }

  const isWarning = daysRemaining < 7
  const isCritical = daysRemaining < 3

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[12px] font-medium',
              isCritical
                ? 'text-red-600'
                : isWarning
                ? 'text-amber-600'
                : 'text-muted-foreground'
            )}
          >
            SLA: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </span>
          {isCritical && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 uppercase tracking-wide">
              <AlertTriangle className="h-2.5 w-2.5" />
              Escalation triggered
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {SLA_WINDOW_DAYS}d window
        </span>
      </div>
      <Progress
        value={progressPct}
        aria-label={`SLA: ${daysRemaining} days remaining`}
        aria-valuenow={progressPct}
        className={cn(
          'h-1.5',
          isCritical
            ? 'bg-red-100 [&>[data-slot=progress-indicator]]:bg-red-500'
            : isWarning
            ? 'bg-amber-100 [&>[data-slot=progress-indicator]]:bg-amber-500'
            : 'bg-muted [&>[data-slot=progress-indicator]]:bg-primary'
        )}
      />
    </div>
  )
}

// ─── props ───────────────────────────────────────────────────────────────────

interface TransitionActionsProps {
  transitionId: string
  currentStatus: string
  hasBrief: boolean
  createdAt: string
}

// ─── main component ──────────────────────────────────────────────────────────

export function TransitionActions({
  transitionId: _transitionId,
  currentStatus: initialStatus,
  hasBrief: _hasBrief,
  createdAt,
}: TransitionActionsProps) {
  const [status, setStatus] = useState(initialStatus)

  // ── status helpers ──────────────────────────────────────────────────────

  function updateStatus(newStatus: string) {
    if (newStatus === status) return
    const prev = status
    setStatus(newStatus)
    toast.success(`Status updated to ${formatStatus(newStatus)}`, {
      description: `Was: ${formatStatus(prev)}`,
    })
  }

  function handleApprove() {
    setStatus('approved')
    toast.success('Transition approved', {
      description: 'Marcus Johnson approved this transition.',
    })
  }

  function handleRequestChanges() {
    setStatus('draft')
    toast.info('Changes requested', {
      description: 'Transition returned to draft for revisions.',
    })
  }

  function handleSubmitForApproval() {
    setStatus('pending_approval')
    toast.success('Submitted for approval', {
      description: 'Marcus Johnson has been notified.',
    })
  }

  // ── quick action handlers ───────────────────────────────────────────────

  function handleGenerateBrief() {
    toast.success('Generating transition brief…', {
      description: 'This will appear in the Briefs section shortly.',
    })
  }

  function handleDraftEmail() {
    toast.success('Opening email composer…', {
      description: 'Draft email template loaded.',
    })
  }

  function handleScheduleMeeting() {
    toast.success('Opening meeting scheduler…', {
      description: 'Checking calendar availability.',
    })
  }

  function handleAddNote() {
    toast.success('Opening note editor…', {
      description: 'Add a note to this transition.',
    })
  }

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <Card className="p-4 space-y-4">
      {/* ── Approval workflow area ── */}
      {status === 'pending_approval' ? (
        <ApprovalBanner
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
        />
      ) : status === 'draft' ? (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                  getStatusColor(status)
                )}
              >
                {formatStatus(status)}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSubmitForApproval}
            className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            aria-label="Submit this transition for approval"
          >
            <SendHorizonal className="h-3.5 w-3.5" />
            Submit for Approval
          </Button>
        </div>
      ) : (
        /* ── Clean horizontal pill progression for all other statuses ── */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                getStatusColor(status)
              )}
            >
              {formatStatus(status)}
            </span>
          </div>
          <div
            role="group"
            aria-label="Transition status steps"
            className="flex flex-wrap gap-1.5"
          >
            {WORKFLOW_STATUSES.map(s => {
              const isActive = status === s.value
              return (
                <button
                  key={s.value}
                  onClick={() => updateStatus(s.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[12px] font-medium transition-all',
                    isActive
                      ? cn(getStatusColor(s.value), 'shadow-sm')
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-pressed={isActive}
                  aria-label={`Set status to ${s.label}`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SLA indicator ── */}
      <SlaBar createdAt={createdAt} />

      {/* ── Divider ── */}
      <div className="border-t border-border" />

      {/* ── Quick actions row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateBrief}
          className="h-8 text-xs gap-1.5"
          aria-label="Generate transition brief"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Generate Brief
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDraftEmail}
          className="h-8 text-xs gap-1.5"
          aria-label="Draft introduction email"
        >
          <Mail className="h-3.5 w-3.5 text-sky-500" />
          Draft Email
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleScheduleMeeting}
          className="h-8 text-xs gap-1.5"
          aria-label="Schedule handoff meeting"
        >
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          Schedule Meeting
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddNote}
          className="h-8 text-xs gap-1.5"
          aria-label="Add a note to this transition"
        >
          <MessageSquare className="h-3.5 w-3.5 text-stone-400" />
          Add Note
        </Button>

        <div className="flex-1" />

        {status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus('completed')}
            className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            aria-label="Mark transition as complete"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark Complete
          </Button>
        )}
        {status !== 'cancelled' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus('cancelled')}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            aria-label="Cancel this transition"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}

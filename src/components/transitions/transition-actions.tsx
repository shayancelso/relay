'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Sparkles, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatStatus, getStatusColor } from '@/lib/utils'

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'intro_sent', label: 'Intro Sent' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface TransitionActionsProps {
  transitionId: string
  currentStatus: string
  hasBrief: boolean
}

export function TransitionActions({
  transitionId,
  currentStatus: initialStatus,
  hasBrief,
}: TransitionActionsProps) {
  const [status, setStatus] = useState(initialStatus)

  function updateStatus(newStatus: string) {
    if (newStatus === status) return
    const prev = status
    setStatus(newStatus)
    toast.success(
      `Status changed to ${formatStatus(newStatus)}`,
      {
        description: `Was: ${formatStatus(prev)}`,
      }
    )
  }

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

  return (
    <Card className="p-4">
      {/* Status pill selector */}
      <div className="space-y-3">
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

        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => {
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

      {/* Divider */}
      <div className="my-3 border-t border-border" />

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick actions */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateBrief}
          className="h-8 text-xs gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Generate Brief
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDraftEmail}
          className="h-8 text-xs gap-1.5"
        >
          <Mail className="h-3.5 w-3.5 text-sky-500" />
          Draft Email
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleScheduleMeeting}
          className="h-8 text-xs gap-1.5"
        >
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          Schedule Meeting
        </Button>

        <div className="flex-1" />

        {/* Terminal actions */}
        {status !== 'completed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus('completed')}
            className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}

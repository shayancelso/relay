'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusColor,
  getPriorityColor,
  getHealthBg,
} from '@/lib/utils'
import { ArrowRight, Building2, Calendar, DollarSign, Check } from 'lucide-react'
import { TransitionActions } from '@/components/transitions/transition-actions'
import { TransitionTimeline } from '@/components/transitions/transition-timeline'
import { ApprovalHistory } from '@/components/transitions/approval-history'
import { BriefSection } from '@/components/briefs/brief-section'
import { EmailSection } from '@/components/emails/email-section'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUS_STEPS = [
  'draft',
  'pending_approval',
  'approved',
  'intro_sent',
  'meeting_booked',
  'in_progress',
  'completed',
]

interface TransitionDetailClientProps {
  transition: any
  account: any
  fromOwner: any
  toOwner: any
  contacts: any[]
  brief: any
  activities: any[]
  emails: any[]
}

export function TransitionDetailClient({
  transition,
  account,
  fromOwner,
  toOwner,
  contacts,
  brief,
  activities,
  emails,
}: TransitionDetailClientProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(transition.status)

  const currentStepIdx = STATUS_STEPS.indexOf(currentStatus)

  function handleStepClick(step: string, idx: number) {
    if (idx === currentStepIdx) return
    const prev = currentStatus
    setCurrentStatus(step)
    toast.success(`Status updated to ${formatStatus(step)}`, {
      description: `Was: ${formatStatus(prev)}`,
    })
  }

  return (
    <div className="space-y-6" data-tour="transitions">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {account?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <span>{fromOwner?.full_name}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{toOwner?.full_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(transition.priority)}>
            {transition.priority}
          </Badge>
          <Badge className={getStatusColor(currentStatus)}>
            {formatStatus(currentStatus)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between overflow-x-auto gap-0">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-start flex-1">
                {i > 0 && (
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={`connector-${s}-${i <= currentStepIdx}`}
                      initial={false}
                      animate={{
                        backgroundColor: i <= currentStepIdx
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--border))',
                      }}
                      transition={{ duration: 0.4 }}
                      className="h-px flex-1 mt-4"
                    />
                  </AnimatePresence>
                )}
                <button
                  onClick={() => handleStepClick(s, i)}
                  className="flex flex-col items-center gap-1 shrink-0 group"
                  aria-label={`Set status to ${formatStatus(s)}`}
                  aria-pressed={i === currentStepIdx}
                >
                  <motion.div
                    animate={{
                      backgroundColor:
                        i <= currentStepIdx
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted))',
                      color:
                        i <= currentStepIdx
                          ? 'hsl(var(--primary-foreground))'
                          : 'hsl(var(--muted-foreground))',
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-shadow',
                      i === currentStepIdx && 'ring-2 ring-primary/30',
                      i !== currentStepIdx && 'group-hover:opacity-80 cursor-pointer'
                    )}
                  >
                    {i < currentStepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </motion.div>
                  <motion.span
                    animate={{
                      color:
                        i <= currentStepIdx
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted-foreground))',
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-xs whitespace-nowrap text-center px-1 font-medium"
                  >
                    {formatStatus(s)}
                  </motion.span>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> ARR
            </div>
            <p className="text-xl font-bold">
              {formatCurrency(account?.arr || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              Health
            </div>
            <Badge className={getHealthBg(account?.health_score || 0)}>
              {account?.health_score}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" /> Due Date
            </div>
            <p className="text-sm font-medium">
              {transition.due_date ? formatDate(transition.due_date) : 'Not set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              Reason
            </div>
            <p className="text-sm font-medium capitalize">
              {transition.reason.replace(/_/g, ' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <TransitionActions
        transitionId={transition.id}
        currentStatus={currentStatus}
        hasBrief={!!brief}
        createdAt={transition.created_at}
      />

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Brief */}
          <div data-tour="ai-brief">
            <BriefSection
              transitionId={transition.id}
              brief={brief ?? null}
              account={account}
              contacts={contacts}
              fromOwner={fromOwner}
              toOwner={toOwner}
              notes={transition.notes}
            />
          </div>

          {/* Emails */}
          <EmailSection
            transitionId={transition.id}
            emails={emails}
            contacts={contacts}
            account={account}
            fromOwner={fromOwner}
            toOwner={toOwner}
            briefContent={brief?.content}
          />

          {/* Notes */}
          {transition.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{transition.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Timeline + Approval Chain */}
        <div className="space-y-6">
          <TransitionTimeline activities={activities} />
          <ApprovalHistory
            transitionStatus={currentStatus}
            createdAt={transition.created_at}
          />
        </div>
      </div>
    </div>
  )
}

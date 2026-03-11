'use client'

import { useState, useRef } from 'react'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusColor,
  getPriorityColor,
  getHealthBg,
  getInitials,
  getSegmentColor,
  formatSegment,
} from '@/lib/utils'
import {
  ArrowRight,
  ArrowLeftRight,
  Building2,
  Calendar,
  DollarSign,
  Check,
  X,
  Send,
  MessageSquare,
  Video,
  Heart,
  Clock,
  GitBranch,
  TrendingUp,
} from 'lucide-react'
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
  const { isTrialMode, enterDemoMode } = useTrialMode()
  const [currentStatus, setCurrentStatus] = useState<string>(transition.status)

  if (isTrialMode) {
    return <TrialPageEmpty icon={ArrowLeftRight} title="Transition Detail" description="This is demo data. Connect your CRM to see real transitions." ctaLabel="Go to Transitions" ctaHref="/transitions" onExploreDemo={enterDemoMode} />
  }
  const [briefTrigger, setBriefTrigger] = useState(0)
  const [emailTrigger, setEmailTrigger] = useState(0)
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addedNotes, setAddedNotes] = useState<{ text: string; time: string }[]>([])
  const meetingRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)

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
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="p-5 sm:p-6">
          {/* Top row: Account name + badges */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate">{account?.name}</h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {account?.segment && (
                    <Badge variant="outline" className={cn('text-[10px] capitalize', getSegmentColor(account.segment))}>
                      {formatSegment(account.segment)}
                    </Badge>
                  )}
                  {account?.industry && (
                    <span className="text-[11px] text-muted-foreground">{account.industry}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wide font-semibold', getPriorityColor(transition.priority))}>
                {transition.priority}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] font-semibold', getStatusColor(currentStatus))}>
                {formatStatus(currentStatus)}
              </Badge>
            </div>
          </div>

          {/* Handoff participants */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
            {/* From */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-[11px] font-bold text-rose-700 ring-2 ring-background">
                {getInitials(fromOwner?.full_name || '??')}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">From</p>
                <p className="text-[13px] font-semibold truncate">{fromOwner?.full_name}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-1.5 px-2 shrink-0">
              <div className="h-px w-4 sm:w-8 bg-border" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="h-px w-4 sm:w-8 bg-border" />
            </div>

            {/* To */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-[11px] font-bold text-blue-700 ring-2 ring-background">
                {getInitials(toOwner?.full_name || '??')}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">To</p>
                <p className="text-[13px] font-semibold truncate">{toOwner?.full_name}</p>
              </div>
            </div>

            {/* Reason pill — right side */}
            <div className="ml-auto hidden sm:flex items-center gap-1.5 rounded-full bg-background border px-3 py-1">
              <GitBranch className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[11px] font-medium text-muted-foreground capitalize">{transition.reason?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status stepper */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-5 px-4 sm:px-6">
          <div className="relative flex items-start justify-between">
            {/* Background track */}
            <div className="absolute top-[14px] sm:top-[18px] left-[20px] sm:left-[24px] right-[20px] sm:right-[24px] h-[2px] bg-border/60 rounded-full" />
            {/* Filled track */}
            <motion.div
              className="absolute top-[14px] sm:top-[18px] left-[20px] sm:left-[24px] h-[2px] rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
              initial={false}
              animate={{
                width: currentStepIdx === 0
                  ? '0%'
                  : `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ maxWidth: 'calc(100% - 40px)' }}
            />

            {STATUS_STEPS.map((s, i) => {
              const isCompleted = i < currentStepIdx
              const isCurrent = i === currentStepIdx
              const isFuture = i > currentStepIdx

              return (
                <button
                  key={s}
                  onClick={() => handleStepClick(s, i)}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 z-10 group flex-1"
                  aria-label={`Set status to ${formatStatus(s)}`}
                  aria-pressed={isCurrent}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1 : 1,
                    }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                    className={cn(
                      'relative flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-300',
                      isCompleted && 'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
                      isCurrent && 'bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-[3px] ring-primary/20',
                      isFuture && 'bg-background border-2 border-border text-muted-foreground/60 group-hover:border-muted-foreground/40 group-hover:text-muted-foreground cursor-pointer',
                    )}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-primary/10" />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      'hidden sm:block text-[10px] whitespace-nowrap text-center px-0.5 transition-colors duration-300',
                      isCompleted && 'text-emerald-600 font-semibold',
                      isCurrent && 'text-primary font-semibold',
                      isFuture && 'text-muted-foreground/50 font-medium group-hover:text-muted-foreground/70',
                    )}
                  >
                    {formatStatus(s)}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key metrics strip */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">ARR</p>
            <p className="text-lg font-bold tabular-nums tracking-tight">{formatCurrency(account?.arr || 0)}</p>
          </div>
        </div>

        <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition-colors group-hover:bg-rose-100">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Health</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold tabular-nums">{account?.health_score ?? '—'}</span>
              <div className="flex-1 h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (account?.health_score ?? 0) >= 70 ? 'bg-emerald-500' : (account?.health_score ?? 0) >= 40 ? 'bg-amber-500' : 'bg-red-500',
                  )}
                  style={{ width: `${Math.min(account?.health_score ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Due Date</p>
            <p className="text-[13px] font-semibold">{transition.due_date ? formatDate(transition.due_date) : 'Not set'}</p>
          </div>
        </div>

        <div className="group flex items-center gap-3 rounded-xl border bg-card p-4 card-hover">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500 transition-colors group-hover:bg-violet-100">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Contacts</p>
            <p className="text-lg font-bold tabular-nums">{contacts.length}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <TransitionActions
        transitionId={transition.id}
        currentStatus={currentStatus}
        hasBrief={!!brief}
        createdAt={transition.created_at}
        onGenerateBrief={() => setBriefTrigger(n => n + 1)}
        onDraftEmail={() => setEmailTrigger(n => n + 1)}
        onScheduleMeeting={() => {
          setShowMeetingScheduler(true)
          setTimeout(() => meetingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
        }}
        onAddNote={() => {
          setShowNoteInput(true)
          setTimeout(() => noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
        }}
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
              triggerGenerate={briefTrigger}
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
            triggerCompose={emailTrigger}
          />

          {/* Meeting Scheduler */}
          {showMeetingScheduler && (
            <Card ref={meetingRef} className="border-violet-200/60 bg-violet-50/20 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-violet-400 to-purple-400" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                      <Video className="h-4 w-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Schedule Handoff Meeting</CardTitle>
                  </div>
                  <button
                    onClick={() => setShowMeetingScheduler(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                    <Input
                      type="date"
                      value={meetingDate}
                      onChange={e => setMeetingDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
                    <Input
                      type="time"
                      value={meetingTime}
                      onChange={e => setMeetingTime(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!meetingDate || !meetingTime) {
                        toast.error('Please select a date and time')
                        return
                      }
                      toast.success('Meeting scheduled', {
                        description: `Handoff meeting set for ${meetingDate} at ${meetingTime}. Calendar invites sent to ${fromOwner?.full_name || 'outgoing AM'}, ${toOwner?.full_name || 'incoming AM'}, and key contacts.`,
                      })
                      setShowMeetingScheduler(false)
                      setMeetingDate('')
                      setMeetingTime('')
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Schedule & Send Invites
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMeetingScheduler(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Note */}
          {showNoteInput && (
            <Card ref={noteRef} className="border-stone-200/60 bg-stone-50/20 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-stone-300 to-stone-400" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
                      <MessageSquare className="h-4 w-4 text-stone-500" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Add Note</CardTitle>
                  </div>
                  <button
                    onClick={() => { setShowNoteInput(false); setNoteText('') }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Add a note about this transition..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!noteText.trim()) {
                        toast.error('Please enter a note')
                        return
                      }
                      setAddedNotes(prev => [...prev, { text: noteText.trim(), time: new Date().toLocaleString() }])
                      toast.success('Note added')
                      setNoteText('')
                      setShowNoteInput(false)
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Save Note
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowNoteInput(false); setNoteText('') }}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(transition.notes || addedNotes.length > 0) && (
            <Card className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
                    <MessageSquare className="h-4 w-4 text-stone-500" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Notes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {transition.notes && (
                  <div className="rounded-lg bg-muted/30 border border-border/50 p-3.5">
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/80">{transition.notes}</p>
                  </div>
                )}
                {addedNotes.map((note, i) => (
                  <div key={i} className="rounded-lg bg-muted/30 border border-border/50 p-3.5">
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/80">{note.text}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {note.time}
                    </p>
                  </div>
                ))}
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

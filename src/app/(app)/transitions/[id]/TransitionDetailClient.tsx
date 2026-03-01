'use client'

import { useState, useRef } from 'react'
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
} from '@/lib/utils'
import { ArrowRight, Building2, Calendar, DollarSign, Check, X, Send, MessageSquare, Video } from 'lucide-react'
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
            <Card ref={meetingRef} className="border-violet-200 bg-violet-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-violet-600" />
                    <CardTitle className="text-sm">Schedule Handoff Meeting</CardTitle>
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
            <Card ref={noteRef} className="border-stone-200 bg-stone-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-stone-500" />
                    <CardTitle className="text-sm">Add Note</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transition.notes && (
                  <p className="text-sm whitespace-pre-wrap">{transition.notes}</p>
                )}
                {addedNotes.map((note, i) => (
                  <div key={i} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{note.time}</p>
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

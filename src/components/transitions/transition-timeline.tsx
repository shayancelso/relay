'use client'

import { useState, useRef } from 'react'
import { formatRelativeDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  Mail,
  Calendar,
  ArrowLeftRight,
  FileText,
  Send,
  CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Per-type icon background + icon color
const ACTIVITY_CONFIG: Record<
  string,
  { icon: LucideIcon; bg: string; iconClass: string }
> = {
  status_change: {
    icon: ArrowLeftRight,
    bg: 'bg-amber-50',
    iconClass: 'text-amber-600',
  },
  brief_generated: {
    icon: FileText,
    bg: 'bg-violet-50',
    iconClass: 'text-violet-600',
  },
  email_sent: {
    icon: Mail,
    bg: 'bg-sky-50',
    iconClass: 'text-sky-600',
  },
  meeting_booked: {
    icon: Calendar,
    bg: 'bg-indigo-50',
    iconClass: 'text-indigo-600',
  },
  note_added: {
    icon: MessageSquare,
    bg: 'bg-stone-100',
    iconClass: 'text-stone-500',
  },
  completed: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
}

const DEFAULT_CONFIG = {
  icon: MessageSquare,
  bg: 'bg-stone-100',
  iconClass: 'text-stone-500',
}

interface Activity {
  id: string
  type: string
  description: string
  created_at: string
  created_by_user?: { full_name: string } | null
}

interface TransitionTimelineProps {
  activities: Activity[]
}

// Demo seed so the list is never empty in isolation
const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'status_change',
    description: 'Status changed from draft to pending approval',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_by_user: { full_name: 'Sarah Chen' },
  },
  {
    id: 'act-2',
    type: 'brief_generated',
    description: 'Transition brief generated for Acme Corp handoff',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
    created_by_user: null,
  },
  {
    id: 'act-3',
    type: 'email_sent',
    description: 'Introduction email sent to incoming rep Jordan Lee',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_by_user: { full_name: 'Sarah Chen' },
  },
  {
    id: 'act-4',
    type: 'meeting_booked',
    description: 'Handoff call scheduled for Friday at 2 PM',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    created_by_user: { full_name: 'Jordan Lee' },
  },
]

export function TransitionTimeline({ activities: initialActivities }: TransitionTimelineProps) {
  const seed = initialActivities.length > 0 ? initialActivities : DEMO_ACTIVITIES
  const [activities, setActivities] = useState<Activity[]>(seed)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleAddNote() {
    const trimmed = note.trim()
    if (!trimmed) return

    setSubmitting(true)

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: 'note_added',
      description: trimmed,
      created_at: new Date().toISOString(),
      created_by_user: { full_name: 'You' },
    }

    // Prepend so newest is at the top — or append if you prefer chronological
    setActivities(prev => [newActivity, ...prev])
    setNote('')
    setSubmitting(false)
    toast.success('Note added')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAddNote()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        {/* Timeline list */}
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No activity yet</p>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, i) => {
              const config = ACTIVITY_CONFIG[activity.type] ?? DEFAULT_CONFIG
              const Icon = config.icon
              const isLast = i === activities.length - 1

              return (
                <div key={activity.id} className="flex gap-3">
                  {/* Icon + connector line */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                        config.bg
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('pb-4 min-w-0', isLast && 'pb-1')}>
                    <p className="text-[13px] text-foreground leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="font-medium">
                        {activity.created_by_user?.full_name ?? 'System'}
                      </span>
                      <span className="opacity-40">·</span>
                      <span>{formatRelativeDate(activity.created_at)}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add note input */}
        <div className="pt-3 mt-2 border-t border-border">
          <div className="flex gap-2 items-end">
            <div
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                'bg-stone-100'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a note… (Cmd+Enter to send)"
                rows={1}
                className={cn(
                  'text-[13px] resize-none min-h-[36px] pr-10 py-2 leading-snug',
                  'transition-all duration-150',
                  note && 'min-h-[72px]'
                )}
              />
              <Button
                size="sm"
                disabled={!note.trim() || submitting}
                onClick={handleAddNote}
                className={cn(
                  'absolute right-2 bottom-2 h-6 w-6 p-0 rounded-md transition-opacity',
                  note.trim() ? 'opacity-100' : 'opacity-30'
                )}
                aria-label="Send note"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1 pl-10">
            Cmd+Enter to send
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

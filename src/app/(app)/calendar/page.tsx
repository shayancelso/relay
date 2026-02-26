'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Video,
  Phone,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react'
import { cn, getStatusColor } from '@/lib/utils'
import { demoTransitions, demoAccounts, demoTeamMembers } from '@/lib/demo-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = 'meeting' | 'call' | 'deadline'
type CalendarView = 'month' | 'week'

interface CalendarEvent {
  id: string
  date: string         // 'YYYY-MM-DD'
  time: string         // '10:00 AM'
  title: string
  accountName: string
  fromOwnerName: string
  toOwnerName: string
  type: EventType
  transitionStatus: string
}

// ---------------------------------------------------------------------------
// Generate mock events from demoTransitions
// ---------------------------------------------------------------------------

// Spread ~15 events across Feb 2026 with deterministic day assignments
const mockTimes = [
  '9:00 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '9:30 AM', '11:30 AM', '1:00 PM',
  '1:30 PM', '4:30 PM', '5:00 PM',
]

// Day assignments for each transition index (spread through Feb 2026)
const mockDays = [3, 5, 7, 9, 10, 12, 13, 14, 17, 18, 19, 20, 21, 24, 25]

function getEventConfig(status: string): { title: (name: string) => string; type: EventType } {
  if (status === 'meeting_booked' || status === 'in_progress') {
    return { title: (name) => `Handoff meeting: ${name}`, type: 'meeting' }
  }
  if (status === 'intro_sent') {
    return { title: (name) => `Intro call: ${name}`, type: 'call' }
  }
  if (status === 'pending_approval') {
    return { title: (name) => `Review deadline: ${name}`, type: 'deadline' }
  }
  if (status === 'approved') {
    return { title: (name) => `Handoff meeting: ${name}`, type: 'meeting' }
  }
  if (status === 'draft') {
    return { title: (name) => `Intro call: ${name}`, type: 'call' }
  }
  return { title: (name) => `Sync: ${name}`, type: 'meeting' }
}

const calendarEvents: CalendarEvent[] = demoTransitions
  .slice(0, 15)
  .map((t, i) => {
    const account = demoAccounts.find((a) => a.id === t.account_id)
    const fromOwner = demoTeamMembers.find((u) => u.id === t.from_owner_id)
    const toOwner = demoTeamMembers.find((u) => u.id === t.to_owner_id)
    const { title, type } = getEventConfig(t.status)
    const accountName = account?.name ?? 'Unknown Account'
    const day = mockDays[i] ?? i + 1

    return {
      id: `event-${t.id}`,
      date: `2026-02-${String(day).padStart(2, '0')}`,
      time: mockTimes[i] ?? '10:00 AM',
      title: title(accountName),
      accountName,
      fromOwnerName: fromOwner?.full_name ?? 'Unknown',
      toOwnerName: toOwner?.full_name ?? 'Unknown',
      type,
      transitionStatus: t.status,
    }
  })

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EVENT_TYPE_CONFIG: Record<EventType, {
  icon: React.ElementType
  badgeCls: string
  label: string
  dotColor: string
}> = {
  meeting: {
    icon: Video,
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Meeting',
    dotColor: 'bg-violet-400',
  },
  call: {
    icon: Phone,
    badgeCls: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Call',
    dotColor: 'bg-sky-400',
  },
  deadline: {
    icon: AlertCircle,
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Deadline',
    dotColor: 'bg-amber-400',
  },
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------------------------------------------------------------------------
// Calendar grid helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function buildCalendarGrid(year: number, month: number): Array<{ day: number | null; dateStr: string | null }> {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const cells: Array<{ day: number | null; dateStr: string | null }> = []

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: null })
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    })
  }
  return cells
}

// ---------------------------------------------------------------------------
// Event card
// ---------------------------------------------------------------------------

function EventCard({ event }: { event: CalendarEvent }) {
  const cfg = EVENT_TYPE_CONFIG[event.type]
  const Icon = cfg.icon

  return (
    <div className="card-hover rounded-lg border border-border bg-card p-3 space-y-2 cursor-default">
      {/* Top row: time + type badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="tabular-nums">{event.time}</span>
        </div>
        <Badge variant="outline" className={cn('text-[10px] h-5', cfg.badgeCls)}>
          <Icon className="h-2.5 w-2.5 mr-1" />
          {cfg.label}
        </Badge>
      </div>

      {/* Title */}
      <p className="text-[12px] font-semibold leading-snug line-clamp-2">{event.title}</p>

      {/* Account badge */}
      <Badge
        variant="outline"
        className="text-[10px] font-normal max-w-full truncate"
      >
        {event.accountName}
      </Badge>

      {/* Participants */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Users className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {event.fromOwnerName}
          <span className="text-muted-foreground/50 mx-1">→</span>
          {event.toOwnerName}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// Demo: fixed to Feb 2026
const DEMO_YEAR = 2026
const DEMO_MONTH = 1 // 0-indexed → February
const TODAY_STR = '2026-02-26'

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month')

  const calendarGrid = buildCalendarGrid(DEMO_YEAR, DEMO_MONTH)

  // Map date string → events
  const eventsByDate: Record<string, CalendarEvent[]> = {}
  calendarEvents.forEach((e) => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  // Upcoming events sorted by date then time
  const upcomingEvents = [...calendarEvents].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time.localeCompare(b.time)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Transition meetings &amp; deadlines</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/30">
          <button
            onClick={() => setView('month')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-150',
              view === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-3 w-3" />
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-150',
              view === 'week'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3 w-3" />
            Week
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar grid (left, 2/3) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="h-7 w-7 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <CardTitle className="text-sm font-semibold">
                    {MONTH_NAMES[DEMO_MONTH]} {DEMO_YEAR}
                  </CardTitle>
                  <button
                    className="h-7 w-7 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', cfg.dotColor)} />
                      {cfg.label}
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-4 px-4">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1.5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {calendarGrid.map((cell, idx) => {
                  const isToday = cell.dateStr === TODAY_STR
                  const events = cell.dateStr ? eventsByDate[cell.dateStr] ?? [] : []
                  const hasEvents = events.length > 0

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'relative bg-background min-h-[56px] p-1.5 transition-colors',
                        cell.day ? 'hover:bg-muted/40 cursor-default' : 'bg-muted/20',
                      )}
                    >
                      {cell.day !== null && (
                        <>
                          {/* Day number */}
                          <div className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-medium mx-auto',
                            isToday
                              ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-500 text-white font-semibold'
                              : 'text-foreground/80',
                          )}>
                            {cell.day}
                          </div>

                          {/* Event dots */}
                          {hasEvents && (
                            <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
                              {events.slice(0, 3).map((e, i) => {
                                const dotColor = EVENT_TYPE_CONFIG[e.type].dotColor
                                return (
                                  <span
                                    key={i}
                                    className={cn('h-1.5 w-1.5 rounded-full', dotColor)}
                                    title={e.title}
                                  />
                                )
                              })}
                              {events.length > 3 && (
                                <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                                  +{events.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend row */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Today
                </div>
                <span>{calendarEvents.length} events this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming sidebar (right, 1/3) */}
        <div className="space-y-3">
          <Card className="sticky top-0">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[12px] font-semibold">Upcoming</CardTitle>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {upcomingEvents.length} events
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-3 pb-3">
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
                {upcomingEvents.map((event) => {
                  // Format date label
                  const d = new Date(event.date + 'T00:00:00')
                  const dateLabel = d.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                  const isToday = event.date === TODAY_STR

                  return (
                    <div key={event.id}>
                      {/* Date separator if first event of that date */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider',
                          isToday ? 'text-emerald-600' : 'text-muted-foreground'
                        )}>
                          {isToday ? 'Today' : dateLabel}
                        </span>
                        <div className="flex-1 h-px bg-border/60" />
                      </div>
                      <EventCard event={event} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

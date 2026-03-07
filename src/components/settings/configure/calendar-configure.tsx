'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarType = 'google' | 'outlook'

interface CalendarConfigureProps {
  calendar: CalendarType
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarConfigure({ calendar }: CalendarConfigureProps) {
  const isGoogle = calendar === 'google'

  const [calendarSource, setCalendarSource] = useState('work-only')
  const [startHour, setStartHour] = useState('09:00')
  const [endHour, setEndHour] = useState('17:00')
  const [createIntroMeetings, setCreateIntroMeetings] = useState(true)
  const [createHandoffMeetings, setCreateHandoffMeetings] = useState(true)
  const [createFollowUps, setCreateFollowUps] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState('30')
  const [bufferTime, setBufferTime] = useState('10')

  const HOURS = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0')
    const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
    return { value: `${h}:00`, label }
  })

  return (
    <div className="space-y-6">
      {/* Connected account */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">
              Connected to {isGoogle ? 'Google Calendar' : 'Microsoft Outlook'}
            </p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              {isGoogle
                ? 'Account: sarah.chen@wealthsimple.com · 3 calendars accessible'
                : 'Account: sarah.chen@wealthsimple.com · Exchange Online'}
            </p>
          </div>
          <button onClick={() => toast.success('Re-authenticated', { description: `${isGoogle ? 'Google Calendar' : 'Outlook'} credentials refreshed.` })} className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            Re-authenticate
          </button>
        </div>
      </div>

      {/* Calendar source */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Which calendars to read for availability
        </Label>
        <Select value={calendarSource} onValueChange={setCalendarSource}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="work-only">Work calendar only</SelectItem>
            <SelectItem value="all">All calendars (including personal)</SelectItem>
            <SelectItem value="primary">Primary calendar only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Working hours */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Working hours window (Mon – Fri)
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Relay will only propose meeting times within these hours
        </p>
        <div className="flex items-center gap-3">
          <Select value={startHour} onValueChange={setStartHour}>
            <SelectTrigger className="h-9 text-[12px] w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.filter(h => parseInt(h.value) >= 6 && parseInt(h.value) <= 18).map(h => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[12px] text-muted-foreground">to</span>
          <Select value={endHour} onValueChange={setEndHour}>
            <SelectTrigger className="h-9 text-[12px] w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.filter(h => parseInt(h.value) >= 8 && parseInt(h.value) <= 22).map(h => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Relay creates */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Events Relay can create
        </Label>
        <div className="space-y-2">
          {[
            { label: 'Intro call events', desc: 'Calendar invites when a customer intro meeting is scheduled during a transition', value: createIntroMeetings, onChange: setCreateIntroMeetings },
            { label: 'Handoff meetings', desc: 'Internal handoff calls between outgoing and incoming rep', value: createHandoffMeetings, onChange: setCreateHandoffMeetings },
            { label: 'Follow-up reminders', desc: 'Reminder events 30 days post-transition to check on account health', value: createFollowUps, onChange: setCreateFollowUps },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-[12px] font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch checked={item.value} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Meeting defaults */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Meeting Defaults
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Default duration</Label>
            <Select value={meetingDuration} onValueChange={setMeetingDuration}>
              <SelectTrigger className="h-9 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Buffer between meetings</Label>
            <Select value={bufferTime} onValueChange={setBufferTime}>
              <SelectTrigger className="h-9 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No buffer</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

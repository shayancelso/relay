'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2 } from 'lucide-react'

// ─── Notification rule rows ───────────────────────────────────────────────────

const NOTIFICATION_RULES = [
  { id: 'transition_created',   label: 'Transition created',     desc: 'Posted when a new transition is initiated' },
  { id: 'intro_sent',           label: 'Intro email sent',        desc: 'Posted when a rep sends the intro email to a customer' },
  { id: 'brief_ready',          label: 'Brief ready for review',  desc: 'Posted when an AI brief is generated and awaiting sign-off' },
  { id: 'transition_stalled',   label: 'Transition stalled',      desc: 'Alert when a transition has no activity for 7+ days' },
  { id: 'transition_completed', label: 'Transition completed',    desc: 'Confirmation when a transition is marked complete' },
  { id: 'weekly_digest',        label: 'Weekly digest',           desc: 'Summary of all transition activity sent every Monday' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function SlackConfigure() {
  const [channels, setChannels] = useState<Record<string, string>>({
    transition_created:   '#cs-transitions',
    intro_sent:           '#cs-transitions',
    brief_ready:          '#cs-transitions',
    transition_stalled:   '#cs-alerts',
    transition_completed: '#cs-transitions',
    weekly_digest:        '#cs-leadership',
  })

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_RULES.map(r => [r.id, true]))
  )

  const [mentionReps, setMentionReps] = useState(true)
  const [dmIndividuals, setDmIndividuals] = useState(false)

  const updateChannel = (id: string, value: string) => {
    setChannels(prev => ({ ...prev, [id]: value }))
  }

  const toggleRule = (id: string) => {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      {/* Connected workspace */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Connected to Slack</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              Workspace: Wealthsimple · Bot: @relay-bot · 24 channels accessible
            </p>
          </div>
          <button className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            Re-authenticate
          </button>
        </div>
      </div>

      {/* Notification rules */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Notification Channels
        </Label>
        <p className="text-[10px] text-muted-foreground/70 mb-3">
          Choose which Slack channel receives each type of notification.
        </p>

        <div className="space-y-2">
          {NOTIFICATION_RULES.map(rule => (
            <div
              key={rule.id}
              className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
            >
              <Switch
                checked={enabled[rule.id]}
                onCheckedChange={() => toggleRule(rule.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium">{rule.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{rule.desc}</p>
              </div>
              <Input
                value={channels[rule.id] ?? ''}
                onChange={e => updateChannel(rule.id, e.target.value)}
                disabled={!enabled[rule.id]}
                placeholder="#channel-name"
                className="h-8 w-[160px] text-[11px] shrink-0 font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mention preferences */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Mention Preferences
        </Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Tag reps in transition messages</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                @mention the outgoing and incoming rep in each notification
              </p>
            </div>
            <Switch checked={mentionReps} onCheckedChange={setMentionReps} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">DM individuals for high-priority alerts</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Send direct messages for critical or stalled transitions in addition to channel posts
              </p>
            </div>
            <Switch checked={dmIndividuals} onCheckedChange={setDmIndividuals} />
          </div>
        </div>
      </div>
    </div>
  )
}

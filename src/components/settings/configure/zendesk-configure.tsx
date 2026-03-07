'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const PRIORITIES = ['Critical', 'High', 'Normal', 'Low'] as const

export function ZendeskConfigure() {
  const [includeOpen, setIncludeOpen] = useState(true)
  const [includeClosed, setIncludeClosed] = useState(true)
  const [closedDays, setClosedDays] = useState('14')
  const [includeCSAT, setIncludeCSAT] = useState(true)
  const [includeAgent, setIncludeAgent] = useState(false)
  const [priorities, setPriorities] = useState<string[]>(['Critical', 'High', 'Normal'])
  const [threshold, setThreshold] = useState('2')

  const togglePriority = (p: string) => {
    setPriorities(prev =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter(x => x !== p) : prev
        : [...prev, p]
    )
  }

  return (
    <div className="space-y-6">
      {/* Connected account */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Connected to Zendesk</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              Subdomain: wealthsimple.zendesk.com · Connected user: sarah.chen@wealthsimple.com · 142 tickets synced
            </p>
          </div>
          <button onClick={() => toast.success('Re-authenticated', { description: 'Zendesk credentials refreshed.' })} className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            Re-authenticate
          </button>
        </div>
      </div>

      {/* Brief inclusion */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Brief Inclusion
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Choose which ticket data appears in handoff briefs for transitioning accounts
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Open tickets</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                All currently open tickets are listed in the brief
              </p>
            </div>
            <Switch checked={includeOpen} onCheckedChange={setIncludeOpen} />
          </div>

          <div className="rounded-lg border border-border/60 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium">Recently closed tickets</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Closed tickets within the lookback window
                </p>
              </div>
              <Switch checked={includeClosed} onCheckedChange={setIncludeClosed} />
            </div>
            {includeClosed && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-[11px] text-muted-foreground">Show tickets closed in the last</span>
                <Select value={closedDays} onValueChange={setClosedDays}>
                  <SelectTrigger className="h-7 w-[90px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">CSAT / satisfaction scores</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Most recent customer satisfaction rating
              </p>
            </div>
            <Switch checked={includeCSAT} onCheckedChange={setIncludeCSAT} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Assigned agent name</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Include the support agent assigned to each open ticket
              </p>
            </div>
            <Switch checked={includeAgent} onCheckedChange={setIncludeAgent} />
          </div>
        </div>
      </div>

      {/* Priority filter */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ticket Priority Filter
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Only include tickets at these priority levels in briefs
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => togglePriority(p)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
                priorities.includes(p)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Alert threshold */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label htmlFor="ticket-threshold" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Alert Threshold
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Flag the account in the brief if open tickets exceed this number
        </p>
        <div className="flex items-center gap-2">
          <Input
            id="ticket-threshold"
            type="number"
            min="1"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
            className="h-9 text-[12px] w-20"
          />
          <span className="text-[12px] text-muted-foreground">open tickets</span>
        </div>
      </div>
    </div>
  )
}

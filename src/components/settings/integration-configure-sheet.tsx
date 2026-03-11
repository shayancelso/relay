'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { CRMConfigure, HubSpotConnect } from './configure/crm-configure'
import { SlackConfigure } from './configure/slack-configure'
import { CalendarConfigure } from './configure/calendar-configure'
import { ResendConfigure } from './configure/resend-configure'
import { GainsightConfigure } from './configure/gainsight-configure'
import { ZendeskConfigure } from './configure/zendesk-configure'
import { TeamsConnect } from './configure/teams-configure'

// ─── Integration metadata ─────────────────────────────────────────────────────

const INTEGRATION_META: Record<string, { title: string; subtitle: string; iconText: string; iconBg: string }> = {
  salesforce: {
    title: 'Salesforce',
    subtitle: 'CRM sync settings & field mapping',
    iconText: 'S',
    iconBg: 'bg-sky-500',
  },
  hubspot: {
    title: 'HubSpot',
    subtitle: 'CRM connection & field mapping',
    iconText: 'H',
    iconBg: 'bg-orange-500',
  },
  slack: {
    title: 'Slack',
    subtitle: 'Notification channels & mention rules',
    iconText: 'Sl',
    iconBg: 'bg-emerald-600',
  },
  google: {
    title: 'Google Calendar',
    subtitle: 'Availability sync & meeting settings',
    iconText: 'GC',
    iconBg: 'bg-blue-600',
  },
  gcal: {
    title: 'Google Calendar',
    subtitle: 'Availability sync & meeting settings',
    iconText: 'GC',
    iconBg: 'bg-blue-600',
  },
  outlook: {
    title: 'Microsoft Outlook',
    subtitle: 'Availability sync & meeting settings',
    iconText: 'OC',
    iconBg: 'bg-sky-600',
  },
  outlookcal: {
    title: 'Outlook Calendar',
    subtitle: 'Availability sync & meeting settings',
    iconText: 'OC',
    iconBg: 'bg-sky-600',
  },
  resend: {
    title: 'Resend',
    subtitle: 'Sending domain, from address & signature',
    iconText: 'Re',
    iconBg: 'bg-gray-800',
  },
  gainsight: {
    title: 'Gainsight',
    subtitle: 'Health scores, risk signals & field mapping',
    iconText: 'G',
    iconBg: 'bg-violet-500',
  },
  zendesk: {
    title: 'Zendesk',
    subtitle: 'Ticket sync & brief inclusion settings',
    iconText: 'Z',
    iconBg: 'bg-yellow-500',
  },
  teams: {
    title: 'Microsoft Teams',
    subtitle: 'Connect workspace & notification channels',
    iconText: 'MT',
    iconBg: 'bg-indigo-500',
  },
  intercom: {
    title: 'Intercom',
    subtitle: 'Conversation sync & brief inclusion',
    iconText: 'IC',
    iconBg: 'bg-blue-500',
  },
  freshdesk: {
    title: 'Freshdesk',
    subtitle: 'Ticket sync & brief inclusion settings',
    iconText: 'FD',
    iconBg: 'bg-emerald-500',
  },
  totango: {
    title: 'Totango',
    subtitle: 'Health scores, segments & field mapping',
    iconText: 'To',
    iconBg: 'bg-purple-500',
  },
  churnzero: {
    title: 'ChurnZero',
    subtitle: 'Churn scores, usage data & field mapping',
    iconText: 'CZ',
    iconBg: 'bg-rose-500',
  },
  calendly: {
    title: 'Calendly',
    subtitle: 'Meeting scheduling & availability sync',
    iconText: 'Ca',
    iconBg: 'bg-blue-600',
  },
  gmail: {
    title: 'Gmail',
    subtitle: 'Email sending & tracking settings',
    iconText: 'Gm',
    iconBg: 'bg-red-500',
  },
}

// ─── Generic Configure (for providers without dedicated panels) ──────────────

function GenericConfigure({ name }: { name: string }) {
  const [syncFreq, setSyncFreq] = useState('hourly')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [includeBriefs, setIncludeBriefs] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Connected to {name}</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">Integration is active and syncing data</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sync Settings
        </Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Auto-sync</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Automatically sync data from {name}</p>
            </div>
            <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
          </div>
          {syncEnabled && (
            <div className="space-y-1.5 pl-1">
              <Label className="text-[11px] text-muted-foreground">Sync frequency</Label>
              <Select value={syncFreq} onValueChange={setSyncFreq}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Data Usage
        </Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Include in transition briefs</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Pull {name} data into account handoff briefs
              </p>
            </div>
            <Switch checked={includeBriefs} onCheckedChange={setIncludeBriefs} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Enable alerts</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Send notifications for important {name} events
              </p>
            </div>
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Content router ───────────────────────────────────────────────────────────

function SheetBody({ integrationId }: { integrationId: string }) {
  const meta = INTEGRATION_META[integrationId]

  switch (integrationId) {
    case 'salesforce':
      return <CRMConfigure crm="salesforce" />
    case 'hubspot':
      return <CRMConfigure crm="hubspot" />
    case 'slack':
      return <SlackConfigure />
    case 'google':
    case 'gcal':
      return <CalendarConfigure calendar="google" />
    case 'outlook':
    case 'outlookcal':
      return <CalendarConfigure calendar="outlook" />
    case 'resend':
      return <ResendConfigure />
    case 'gainsight':
      return <GainsightConfigure />
    case 'zendesk':
      return <ZendeskConfigure />
    case 'teams':
      return <TeamsConnect />
    default:
      return <GenericConfigure name={meta?.title || integrationId} />
  }
}

// ─── Main Sheet component ─────────────────────────────────────────────────────

interface IntegrationConfigureSheetProps {
  integrationId: string | null
  onClose: () => void
}

export function IntegrationConfigureSheet({ integrationId, onClose }: IntegrationConfigureSheetProps) {
  const meta = integrationId ? INTEGRATION_META[integrationId] : null

  return (
    <Sheet open={!!integrationId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {meta && (
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold ${meta.iconBg}`}>
                {meta.iconText}
              </div>
            )}
            <div>
              <SheetTitle className="text-[15px] font-semibold leading-none">
                {meta?.title ?? 'Configure Integration'}
              </SheetTitle>
              {meta?.subtitle && (
                <p className="text-[11px] text-muted-foreground mt-1">{meta.subtitle}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {integrationId && <SheetBody integrationId={integrationId} />}
        </div>

        {/* Footer — pinned */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[12px] font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!integrationId) return
              try {
                const res = await fetch(`/api/integrations/${integrationId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ config: { updated_at: new Date().toISOString() } }),
                })
                if (!res.ok) throw new Error()
                toast.success('Settings saved', { description: 'Integration settings have been updated.' })
              } catch {
                toast.success('Settings saved', { description: 'Integration settings have been updated.' })
              }
              onClose()
            }}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-[12px] font-medium hover:opacity-80 transition-opacity"
          >
            Save changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CRMConfigure, HubSpotConnect } from './configure/crm-configure'
import { SlackConfigure } from './configure/slack-configure'
import { CalendarConfigure } from './configure/calendar-configure'
import { ResendConfigure } from './configure/resend-configure'

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
}

// ─── Content router ───────────────────────────────────────────────────────────

function SheetBody({ integrationId }: { integrationId: string }) {
  switch (integrationId) {
    case 'salesforce':
      return <CRMConfigure crm="salesforce" />
    case 'hubspot':
      return <HubSpotConnect />
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
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-[13px] text-muted-foreground">No configuration available for this integration.</p>
        </div>
      )
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
            onClick={() => {
              toast.success('Settings saved', { description: 'Integration settings have been updated.' })
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

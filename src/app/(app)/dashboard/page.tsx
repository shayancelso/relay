'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRole } from '@/lib/role-context'
import { RevOpsDashboard } from '@/components/dashboard/revops-dashboard'
import { LeadershipDashboard } from '@/components/dashboard/leadership-dashboard'
import { RepDashboard } from '@/components/dashboard/rep-dashboard'
import { ProductTour } from '@/components/tour/product-tour'
import { Zap, X, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrialData {
  fullName?: string
  workEmail?: string
  jobTitle?: string
  companyName?: string
  crm?: string
  crmConnected?: boolean
  csvFileName?: string | null
  team?: Array<{ name?: string; email?: string }>
  fieldMappings?: Array<unknown>
  customFields?: Array<{ crmName?: string }>
  rules?: Array<{ enabled?: boolean }>
}

interface ChecklistItem {
  id: string
  label: string
  hint: string
  completed: boolean
  cta?: { label: string; href: string }
}

// ---------------------------------------------------------------------------
// Checklist builder — derives completion from relay-trial-data
// ---------------------------------------------------------------------------

function buildChecklist(data: TrialData): ChecklistItem[] {
  const filledTeam = (data.team ?? []).filter(
    (m) => m.name?.trim() || m.email?.trim()
  ).length
  const enabledRules = (data.rules ?? []).filter((r) => r.enabled).length
  const customFieldCount = (data.customFields ?? []).filter(
    (f) => f.crmName?.trim()
  ).length
  const coreFieldCount = data.fieldMappings?.length ?? 0

  const crmLabel =
    data.crm === 'salesforce'
      ? 'Salesforce connection queued'
      : data.crm === 'hubspot'
      ? 'HubSpot connection queued'
      : data.csvFileName
      ? 'Accounts CSV uploaded'
      : 'CRM selected'

  return [
    {
      id: 'profile',
      label: 'Profile set up',
      hint: [data.companyName, data.jobTitle || data.workEmail]
        .filter(Boolean)
        .join(' · '),
      completed: !!(data.fullName && data.companyName),
    },
    {
      id: 'crm',
      label: crmLabel,
      hint: 'Your real data will appear here once connected',
      completed: !!data.crm,
      cta:
        data.crm && !data.crmConnected && !data.csvFileName && data.crm !== 'other'
          ? { label: 'Connect CRM', href: '/integrations' }
          : undefined,
    },
    {
      id: 'fields',
      label: 'Fields mapped',
      hint: `${coreFieldCount} core${customFieldCount > 0 ? ` · ${customFieldCount} custom` : ''}`,
      completed: coreFieldCount > 0,
    },
    {
      id: 'rules',
      label: 'Routing rules configured',
      hint:
        enabledRules > 0
          ? `${enabledRules} rule${enabledRules !== 1 ? 's' : ''} active`
          : 'No rules enabled yet',
      completed: enabledRules > 0,
      cta: enabledRules === 0 ? { label: 'Configure', href: '/rules' } : undefined,
    },
    {
      id: 'team',
      label: filledTeam > 0 ? 'Team added' : 'Invite your team',
      hint:
        filledTeam > 0
          ? `${filledTeam} member${filledTeam !== 1 ? 's' : ''} invited`
          : 'Add team members to start routing',
      completed: filledTeam > 0,
      cta: filledTeam === 0 ? { label: 'Invite team', href: '/team' } : undefined,
    },
    {
      id: 'transition',
      label: 'Create your first transition',
      hint: 'Start moving accounts between reps',
      completed: false,
      cta: { label: 'Create now', href: '/transitions/new' },
    },
  ]
}

// ---------------------------------------------------------------------------
// Getting Started Checklist — shown to trial users post-onboarding
// ---------------------------------------------------------------------------

function GettingStartedChecklist() {
  const [trialData, setTrialData] = useState<TrialData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('relay-trial-data')
      const demoMode = localStorage.getItem('relay-demo-mode')
      const setupDone = localStorage.getItem('relay-setup-complete')
      if (raw && !demoMode && !setupDone) {
        setTrialData(JSON.parse(raw))
      }
    } catch {
      // ignore
    }
  }, [])

  if (!trialData || dismissed) return null

  const items = buildChecklist(trialData)
  const completedCount = items.filter((i) => i.completed).length
  const pct = Math.round((completedCount / items.length) * 100)

  const dismiss = () => {
    localStorage.setItem('relay-setup-complete', 'true')
    setDismissed(true)
  }

  return (
    <div className="mb-6 rounded-2xl border border-stone-200/80 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-stone-100">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-stone-900">Get started with Relay</p>
            <span className="text-xs text-stone-400 tabular-nums shrink-0">
              {completedCount} of {items.length}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-48 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Items */}
      <div className="px-5 py-1 divide-y divide-stone-50">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2.5">
            {/* Status circle */}
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                item.completed ? 'bg-emerald-500' : 'border-2 border-stone-200'
              )}
            >
              {item.completed && <Check className="w-3 h-3 text-white" />}
            </div>

            {/* Label + hint */}
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'text-sm font-medium',
                  item.completed ? 'text-stone-400' : 'text-stone-800'
                )}
              >
                {item.label}
              </span>
              {item.hint && (
                <span className="ml-2 text-xs text-stone-400 truncate">{item.hint}</span>
              )}
            </div>

            {/* CTA — only on incomplete items */}
            {!item.completed && item.cta && (
              <Link
                href={item.cta.href}
                className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {item.cta.label}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo mode banner — shown to users exploring with sample data
// ---------------------------------------------------------------------------

function DemoBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('relay-demo-mode') === 'true') setShow(true)
    } catch {
      // ignore
    }
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-semibold text-[11px] mr-2">
            Demo mode
          </span>
          You&apos;re exploring with sample data.{' '}
          <Link href="/onboarding" className="text-emerald-600 hover:underline font-medium">
            Start your real setup →
          </Link>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { role } = useRole()

  const dashboard = (() => {
    switch (role) {
      case 'revops_admin': return <RevOpsDashboard />
      case 'am_leadership': return <LeadershipDashboard />
      case 'rep': return <RepDashboard />
    }
  })()

  return (
    <div>
      <GettingStartedChecklist />
      <DemoBanner />
      {dashboard}
      <ProductTour />
    </div>
  )
}

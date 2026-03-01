'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Database,
  Users,
  Workflow,
  ArrowLeftRight,
  Building2,
  TrendingUp,
  Check,
  ChevronRight,
  Clock,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface Props {
  onExploreDemo: () => void
}

interface SetupCard {
  icon: typeof Database
  title: string
  statusText: string
  complete: boolean
  cta: { label: string; href: string }
}

export function TrialDashboard({ onExploreDemo }: Props) {
  const [data, setData] = useState<TrialData | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('relay-trial-data')
      if (raw) setData(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const companyName = data?.companyName || 'your company'
  const firstName = data?.fullName?.split(' ')[0] || 'there'

  const filledTeam = (data?.team ?? []).filter(
    (m) => m.name?.trim() || m.email?.trim()
  ).length
  const enabledRules = (data?.rules ?? []).filter((r) => r.enabled).length
  const coreFieldCount = data?.fieldMappings?.length ?? 0

  const crmDisplayName =
    data?.crm === 'salesforce' ? 'Salesforce' :
    data?.crm === 'hubspot' ? 'HubSpot' :
    data?.crm === 'other' ? 'CSV' : 'CRM'

  const crmStatusText =
    data?.crm === 'salesforce' ? 'Salesforce connection queued — sync pending' :
    data?.crm === 'hubspot' ? 'HubSpot connection queued — sync pending' :
    data?.csvFileName ? `CSV uploaded: ${data.csvFileName}` :
    data?.crm ? 'CRM selected — finish connecting in Integrations' :
    'No CRM connected yet'

  const setupCards: SetupCard[] = [
    {
      icon: Database,
      title: `Connect ${crmDisplayName}`,
      statusText: crmStatusText,
      complete: !!data?.crm,
      cta: { label: 'Go to Integrations', href: '/integrations' },
    },
    {
      icon: Users,
      title: 'Invite your team',
      statusText:
        filledTeam > 0
          ? `${filledTeam} team member${filledTeam !== 1 ? 's' : ''} added`
          : 'No team members added yet',
      complete: filledTeam > 0,
      cta: { label: 'Manage team', href: '/team' },
    },
    {
      icon: Workflow,
      title: 'Assignment rules',
      statusText:
        enabledRules > 0
          ? `${enabledRules} rule${enabledRules !== 1 ? 's' : ''} active · ${coreFieldCount} fields mapped`
          : 'No rules enabled yet',
      complete: enabledRules > 0,
      cta: { label: 'Review rules', href: '/rules' },
    },
    {
      icon: ArrowLeftRight,
      title: 'Create your first transition',
      statusText: 'Start moving accounts between reps',
      complete: false,
      cta: { label: 'Create transition', href: '/transitions/new' },
    },
  ]

  const completedCount = setupCards.filter((c) => c.complete).length

  return (
    <div className="space-y-6">

      {/* ── Welcome header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
            Welcome, {firstName}
          </p>
          <h1 className="text-xl font-bold text-stone-900">
            {companyName}&apos;s Relay workspace is ready
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-lg">
            Complete the steps below to connect your data and start managing account transitions.{' '}
            {completedCount}/{setupCards.length} steps done.
          </p>
        </div>
        <button
          onClick={onExploreDemo}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-medium text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors whitespace-nowrap"
        >
          <Play className="h-3 w-3" />
          Explore demo
        </button>
      </div>

      {/* ── Setup cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {setupCards.map((card) => (
          <div
            key={card.title}
            className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm"
          >
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                card.complete
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-stone-50 border border-stone-200'
              )}
            >
              {card.complete ? (
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
              ) : (
                <card.icon className="h-4 w-4 text-stone-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-semibold',
                card.complete ? 'text-stone-400' : 'text-stone-800'
              )}>
                {card.title}
              </p>
              <p className="mt-0.5 text-xs text-stone-400 leading-relaxed">
                {card.statusText}
              </p>
              {!card.complete && (
                <Link
                  href={card.cta.href}
                  className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {card.cta.label}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty data widgets ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-stone-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Accounts</span>
          </div>
          <p className="text-3xl font-bold text-stone-200">0</p>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Your book of business will appear here once your CRM is connected.
          </p>
          <Link href="/integrations" className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Connect CRM <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="h-4 w-4 text-stone-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Active Transitions</span>
          </div>
          <p className="text-3xl font-bold text-stone-200">0</p>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            Transitions you create will show up here with their status and health.
          </p>
          <Link href="/transitions/new" className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Create first transition <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-stone-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Revenue Tracked</span>
          </div>
          <p className="text-3xl font-bold text-stone-200">—</p>
          <p className="mt-2 text-xs text-stone-400 leading-relaxed">
            ARR and revenue-at-risk data requires CRM account sync.
          </p>
          <Link href="/integrations" className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Set up integration <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── Explore demo footer ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-stone-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-stone-200 shadow-sm">
            <Clock className="h-4 w-4 text-stone-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-700">Not ready to connect your data yet?</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Explore a live demo environment to see what Relay looks like with real account data.
            </p>
          </div>
        </div>
        <button
          onClick={onExploreDemo}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white border border-stone-200 shadow-sm px-4 py-2.5 text-sm font-semibold text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors whitespace-nowrap"
        >
          <Play className="h-3.5 w-3.5 text-emerald-500" />
          Explore demo environment
        </button>
      </div>

    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Check,
  RefreshCw,
  Database,
  Mail,
  Calendar,
  MessageSquare,
  Zap,
  Activity,
  Clock,
  TrendingUp,
  Settings,
  Plus,
  FileText,
  Users,
  Link2,
  BarChart3,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

type Integration = {
  id: string
  name: string
  category: string
  description: string
  icon: string
  color: string
  connected: boolean
  lastSync?: string
  stats?: string[]
  detail?: string
  channel?: string
}

const integrationGroups: { label: string; items: Integration[] }[] = [
  {
    label: 'CRM',
    items: [
      {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'CRM',
        description: 'Bi-directional sync: accounts, contacts, opportunities, activity history',
        icon: 'S',
        color: 'bg-sky-500',
        connected: true,
        lastSync: '2 min ago',
        stats: ['2,000 accounts', '4,200 contacts', '890 opportunities synced'],
        detail: 'Relay reads from Salesforce to enrich transition briefs and writes transition status back.',
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'CRM',
        description: 'Contacts, deals, and engagement data',
        icon: 'H',
        color: 'bg-orange-500',
        connected: false,
      },
    ],
  },
  {
    label: 'Customer Success Platforms',
    items: [
      {
        id: 'gainsight',
        name: 'Gainsight',
        category: 'Customer Success',
        description: 'Health scores, CSM assignments, success plans, risk alerts',
        icon: 'G',
        color: 'bg-violet-500',
        connected: true,
        lastSync: '4 min ago',
        stats: ['Health scores', 'Risk signals', 'CSM assignments'],
        detail: 'Pulls health scores and risk signals into transition briefs.',
      },
      {
        id: 'totango',
        name: 'Totango',
        category: 'Customer Success',
        description: 'Customer health, segments, and lifecycle data',
        icon: 'T',
        color: 'bg-teal-500',
        connected: false,
      },
      {
        id: 'churnzero',
        name: 'ChurnZero',
        category: 'Customer Success',
        description: 'Usage data, health scores, and engagement metrics',
        icon: 'C',
        color: 'bg-rose-500',
        connected: false,
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      {
        id: 'slack',
        name: 'Slack',
        category: 'Communication',
        description: 'Transition notifications, approval requests, and status updates',
        icon: 'Sl',
        color: 'bg-emerald-600',
        connected: true,
        lastSync: 'Live',
        stats: ['#relay-transitions'],
        detail: 'Posts alerts to #relay-transitions. Approval requests delivered as interactive messages.',
        channel: '#relay-transitions',
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        category: 'Communication',
        description: 'Transition notifications and approval workflows',
        icon: 'MT',
        color: 'bg-indigo-500',
        connected: false,
      },
      {
        id: 'gmail',
        name: 'Gmail / Outlook',
        category: 'Communication',
        description: 'Email tracking for intro emails sent during transitions',
        icon: 'Em',
        color: 'bg-red-500',
        connected: true,
        lastSync: '1 min ago',
        stats: ['Opens tracked', 'Replies logged'],
        detail: 'Tracks open and reply rates on intro emails. Data surfaces in transition timelines.',
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        id: 'zendesk',
        name: 'Zendesk',
        category: 'Support',
        description: 'Open tickets and support history included in handoff briefs',
        icon: 'Z',
        color: 'bg-yellow-500',
        connected: true,
        lastSync: '6 min ago',
        stats: ['142 tickets synced'],
        detail: 'Open and recently closed tickets automatically included in every handoff brief.',
      },
      {
        id: 'intercom',
        name: 'Intercom',
        category: 'Support',
        description: 'Conversation history and customer health signals',
        icon: 'In',
        color: 'bg-blue-500',
        connected: false,
      },
      {
        id: 'freshdesk',
        name: 'Freshdesk',
        category: 'Support',
        description: 'Ticket history and CSAT scores for handoff context',
        icon: 'Fr',
        color: 'bg-cyan-500',
        connected: false,
      },
    ],
  },
  {
    label: 'Calendar',
    items: [
      {
        id: 'gcal',
        name: 'Google Calendar',
        category: 'Calendar',
        description: 'Auto-schedule handoff meetings and check rep availability',
        icon: 'GC',
        color: 'bg-blue-600',
        connected: true,
        lastSync: '3 min ago',
        stats: ['12 meetings scheduled this month'],
        detail: 'Reads availability from all reps to auto-propose handoff meeting times.',
      },
      {
        id: 'outlookcal',
        name: 'Outlook Calendar',
        category: 'Calendar',
        description: 'Availability sync and meeting scheduling',
        icon: 'OC',
        color: 'bg-sky-600',
        connected: false,
      },
      {
        id: 'calendly',
        name: 'Calendly',
        category: 'Calendar',
        description: 'Customer-facing scheduling links embedded in transition emails',
        icon: 'Ca',
        color: 'bg-blue-400',
        connected: true,
        lastSync: 'Live',
        stats: ['8 booking links active'],
        detail: 'Scheduling links automatically embedded in intro emails sent to customers.',
      },
    ],
  },
]

const connectedCount = integrationGroups
  .flatMap((g) => g.items)
  .filter((i) => i.connected).length

const totalCount = integrationGroups.flatMap((g) => g.items).length

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <Card className={cn('card-hover group relative overflow-hidden', integration.connected && 'border-border/60')}>
      {integration.connected && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400/60 via-emerald-500/80 to-emerald-400/60" />
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo circle */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold tracking-wide',
              integration.color,
            )}
          >
            {integration.icon}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold leading-none">{integration.name}</span>
                  {integration.connected ? (
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 gap-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground/60">
                      Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">{integration.description}</p>

            {/* Detail / extra info for connected */}
            {integration.connected && integration.detail && (
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{integration.detail}</p>
            )}

            {/* Stats row */}
            {integration.connected && integration.stats && integration.stats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {integration.stats.map((stat) => (
                  <span
                    key={stat}
                    className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            )}

            {/* Last sync + buttons */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                {integration.connected && integration.lastSync ? (
                  <>
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Last sync: {integration.lastSync}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/40">Not connected</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {integration.connected ? (
                  <button className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition-colors flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Configure
                  </button>
                ) : (
                  <button className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1 press-scale">
                    <Plus className="h-3 w-3" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Architecture Diagram ─────────────────────────────────────────────────────

function ArchitectureDiagram() {
  const sources = [
    { name: 'Salesforce', icon: 'S', color: 'bg-sky-500' },
    { name: 'HubSpot', icon: 'H', color: 'bg-orange-500' },
    { name: 'Gainsight', icon: 'G', color: 'bg-violet-500' },
    { name: 'Totango', icon: 'T', color: 'bg-teal-500' },
    { name: 'ChurnZero', icon: 'C', color: 'bg-rose-500' },
    { name: 'Zendesk', icon: 'Z', color: 'bg-yellow-500' },
  ]

  const outputs = [
    { name: 'Handoff Briefs', icon: FileText, color: 'text-violet-500' },
    { name: 'Intro Emails', icon: Mail, color: 'text-blue-500' },
    { name: 'Meeting Scheduling', icon: Calendar, color: 'text-emerald-500' },
    { name: 'Customer Portal', icon: Users, color: 'text-amber-500' },
    { name: 'Slack / Teams Alerts', icon: MessageSquare, color: 'text-indigo-500' },
    { name: 'Analytics', icon: BarChart3, color: 'text-rose-500' },
  ]

  return (
    <Card className="card-hover overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">How Relay Works</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Relay enriches every transition with data from your existing tools
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live sync
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="flex items-stretch gap-0 mt-2">

          {/* ── Left: Data Sources ───────────────────────────────────────── */}
          <div className="flex flex-col gap-0 w-[180px] shrink-0">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 pl-0.5">
              Your Stack (Data Sources)
            </p>
            <div className="flex flex-col gap-1.5">
              {sources.map((src) => (
                <div
                  key={src.name}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 shadow-sm"
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded text-white text-[9px] font-bold',
                      src.color,
                    )}
                  >
                    {src.icon}
                  </div>
                  <span className="text-[11px] font-medium truncate">{src.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Arrows in ───────────────────────────────────────────────── */}
          <div className="flex flex-col items-center justify-center px-3 gap-1 pt-6">
            <div className="flex flex-col gap-[11px]">
              {sources.map((_, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <div className="h-px w-8 bg-gradient-to-r from-border to-emerald-300/70" />
                  <div className="h-1 w-1 rounded-full bg-emerald-400/80" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Center: Relay Engine ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            <div className="w-full rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-b from-emerald-50/60 to-emerald-50/20 px-4 py-5 text-center shadow-sm relative overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-400/5 pointer-events-none" />

              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-[15px] font-bold tracking-tight text-foreground">relay</span>
              </div>

              <p className="text-[10px] font-semibold text-emerald-700/80 uppercase tracking-wider mb-3">
                AI-Powered Transition Engine
              </p>

              <div className="flex flex-col gap-1.5 text-left">
                {[
                  { icon: Database, label: 'Reads account context' },
                  { icon: Activity, label: 'Scores transition risk' },
                  { icon: FileText, label: 'Generates briefs + emails' },
                  { icon: Users, label: 'Assigns new reps' },
                  { icon: ArrowRight, label: 'Pushes status back' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <item.icon className="h-2.5 w-2.5 text-emerald-600/70 shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* No-rip-and-replace pill */}
              <div className="mt-3 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 inline-flex items-center gap-1.5">
                <Check className="h-2.5 w-2.5 text-emerald-600" />
                <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide">
                  No rip and replace
                </span>
              </div>
            </div>
          </div>

          {/* ── Arrows out ──────────────────────────────────────────────── */}
          <div className="flex flex-col items-center justify-center px-3 gap-1 pt-6">
            <div className="flex flex-col gap-[11px]">
              {outputs.map((_, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                  <div className="h-px w-8 bg-gradient-to-r from-primary/40 to-border" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Outputs ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-0 w-[190px] shrink-0">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 pl-0.5">
              Outputs
            </p>
            <div className="flex flex-col gap-1.5">
              {outputs.map((out) => (
                <div
                  key={out.name}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-1.5 shadow-sm"
                >
                  <out.icon className={cn('h-3.5 w-3.5 shrink-0', out.color)} />
                  <span className="text-[11px] font-medium truncate">{out.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="mt-5 text-center text-[11px] text-muted-foreground/60 border-t border-border/50 pt-4">
          Relay sits on top of your existing stack — it never replaces Salesforce, Gainsight, or Zendesk.
          It reads context from each tool and writes transition status back.
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Data Flow Stats ──────────────────────────────────────────────────────────

function DataFlowStats() {
  const metrics = [
    {
      icon: Database,
      value: '12,400',
      label: 'data points synced today',
      sub: 'across 5 connected platforms',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: RefreshCw,
      value: '4 min',
      label: 'since last full sync',
      sub: 'all platforms healthy',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      value: '99.7%',
      label: 'uptime this month',
      sub: 'Feb 2026 · 21m downtime',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      icon: Clock,
      value: '1.2s',
      label: 'avg sync latency',
      sub: 'p95: 2.8s',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3 pt-5 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Data Flow</CardTitle>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Syncing live
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background p-4"
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', m.bg)}>
                <m.icon className={cn('h-4 w-4', m.color)} />
              </div>
              <div>
                <p className={cn('text-xl font-bold tabular-nums tracking-tight', m.color)}>{m.value}</p>
                <p className="text-[11px] text-foreground/80 font-medium leading-snug mt-0.5">{m.label}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform health strip */}
        <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2.5">
            Platform Health
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Salesforce', ok: true },
              { name: 'Gainsight', ok: true },
              { name: 'Slack', ok: true },
              { name: 'Gmail', ok: true },
              { name: 'Google Cal', ok: true },
              { name: 'Zendesk', ok: true },
              { name: 'Calendly', ok: true },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', p.ok ? 'bg-emerald-400' : 'bg-red-400')} />
                <span className="text-[10px] font-medium text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integration Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Relay connects to your existing stack — no rip and replace
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span className="text-[11px] font-medium text-emerald-700">
              {connectedCount} of {totalCount} connected
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted transition-colors press-scale">
            <RefreshCw className="h-3 w-3" />
            Sync all
          </button>
        </div>
      </div>

      {/* ── Architecture Diagram ──────────────────────────────────────────── */}
      <ArchitectureDiagram />

      {/* ── Integration Groups ────────────────────────────────────────────── */}
      <div className="space-y-8">
        {integrationGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            {/* Group header */}
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </h2>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[10px] text-muted-foreground/40">
                {group.items.filter((i) => i.connected).length}/{group.items.length} connected
              </span>
            </div>

            {/* Cards grid */}
            <div
              className={cn(
                'grid gap-3',
                group.items.length === 1 ? 'grid-cols-1 max-w-sm' :
                group.items.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              )}
            >
              {group.items.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Flow Stats ───────────────────────────────────────────────── */}
      <DataFlowStats />

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <Card className="card-hover border-dashed bg-muted/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
              <Link2 className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[13px] font-semibold">Need a custom integration?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Relay supports custom webhooks and REST APIs. Talk to your account team.
              </p>
            </div>
          </div>
          <button className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-[12px] font-medium hover:bg-primary/90 transition-colors press-scale">
            Contact Sales
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </CardContent>
      </Card>

    </div>
  )
}

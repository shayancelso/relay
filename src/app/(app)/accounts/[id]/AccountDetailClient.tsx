'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Building2,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  Heart,
  User,
  Users,
  Globe,
  ArrowRight,
  ChevronRight,
  Zap,
  Edit2,
  Star,
  BarChart2,
  MessageSquare,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getHealthBg,
  getHealthColor,
  getSegmentColor,
  getStatusColor,
  formatSegment,
  formatStatus,
  getInitials,
  cn,
} from '@/lib/utils'
import type { Account, AccountContact, Transition, TransitionActivity, User as UserType } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransitionWithOwners extends Omit<Transition, 'from_owner' | 'to_owner'> {
  from_owner: UserType | null
  to_owner: UserType | null
}

interface ActivityWithUser extends Omit<TransitionActivity, 'created_by_user'> {
  created_by_user: UserType | null
}

interface Props {
  account: Account
  owner: UserType | null
  contacts: AccountContact[]
  transitions: TransitionWithOwners[]
  activities: ActivityWithUser[]
}

// ---------------------------------------------------------------------------
// Health history — deterministic mock data seeded from account health_score
// ---------------------------------------------------------------------------

function generateHealthHistory(baseScore: number) {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
  // Produce a plausible 6-month arc ending near current health
  const seeds = [0.6, 0.75, 0.45, 0.8, 0.35, 0.9]
  return months.map((month, i) => {
    const noise = Math.round((seeds[i] - 0.5) * 18)
    const score = Math.min(98, Math.max(30, baseScore + noise + (i === 5 ? 0 : Math.round((i - 2.5) * -2))))
    return { month, score }
  })
}

// ---------------------------------------------------------------------------
// Health ring SVG
// ---------------------------------------------------------------------------

function HealthRing({ score }: { score: number }) {
  const radius = 28
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const progress = circumference - (score / 100) * circumference

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className="absolute text-[13px] font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'contacts' | 'transitions' | 'activity'

// ---------------------------------------------------------------------------
// Role badge helper
// ---------------------------------------------------------------------------

function roleBadgeClass(role: string) {
  switch (role) {
    case 'champion': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'decision_maker': return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'exec_sponsor': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'end_user': return 'bg-sky-50 text-sky-700 border-sky-200'
    default: return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ---------------------------------------------------------------------------
// Activity icon helper
// ---------------------------------------------------------------------------

function ActivityIcon({ type }: { type: string }) {
  const base = 'h-4 w-4'
  switch (type) {
    case 'status_change': return <RefreshCw className={cn(base, 'text-sky-500')} />
    case 'brief_generated': return <FileText className={cn(base, 'text-violet-500')} />
    case 'email_sent': return <Mail className={cn(base, 'text-amber-500')} />
    case 'meeting_booked': return <Calendar className={cn(base, 'text-emerald-500')} />
    case 'note_added': return <MessageSquare className={cn(base, 'text-stone-500')} />
    default: return <CheckCircle2 className={cn(base, 'text-stone-400')} />
  }
}

// ---------------------------------------------------------------------------
// Custom Recharts tooltip
// ---------------------------------------------------------------------------

function HealthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card shadow-md px-3 py-2">
      <p className="text-[11px] text-muted-foreground tracking-wider uppercase mb-0.5">{label}</p>
      <p className="text-sm font-bold tabular-nums">{payload[0].value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export default function AccountDetailClient({ account, owner, contacts, transitions, activities }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const healthHistory = generateHealthHistory(account.health_score)

  // Mock insight values seeded from account id string length for variety
  const seed = account.id.length + account.arr % 100
  const nps = 58 + (seed % 30)
  const csat = (3.8 + ((seed % 13) / 10)).toFixed(1)
  const openTickets = (seed % 5) + 1
  const productUsage = seed % 3 === 0 ? 'High' : seed % 3 === 1 ? 'Medium' : 'Growing'
  const lastQbrDate = 'Jan 15, 2026'

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts', count: contacts.length },
    { id: 'transitions', label: 'Transitions', count: transitions.length },
    { id: 'activity', label: 'Activity', count: activities.length },
  ]

  return (
    <div className="space-y-0 fade-in-up">
      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tracking-wider uppercase mb-4">
        <Link href="/accounts" className="hover:text-foreground transition-colors link-hover">
          Accounts
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50" />
        <span className="text-foreground font-medium">{account.name}</span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald text-white text-sm font-bold shadow-sm">
              {getInitials(account.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn('text-[11px] font-medium tracking-wide px-2 py-0', getSegmentColor(account.segment))}
                >
                  {formatSegment(account.segment)}
                </Badge>
                {account.sub_segment && (
                  <Badge variant="outline" className="capitalize text-[11px] px-2 py-0 text-muted-foreground">
                    {account.sub_segment.replace(/_/g, ' ')}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn('text-[11px] font-semibold tabular-nums px-2 py-0', getHealthBg(account.health_score))}
                >
                  <Heart className="h-2.5 w-2.5 mr-1" />
                  {account.health_score}
                </Badge>
                {account.industry && (
                  <span className="text-[12px] text-muted-foreground">{account.industry}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 text-[12px] press-scale">
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" className="gap-1.5 text-[12px] press-scale gradient-emerald text-white border-0 hover:opacity-90">
            <Zap className="h-3.5 w-3.5" />
            Start Transition
          </Button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-6">
        {/* ARR */}
        <Card className="card-hover">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">ARR</span>
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight">{formatCurrency(account.arr)}</p>
          </CardContent>
        </Card>

        {/* Health */}
        <Card className="card-hover">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Health</span>
            </div>
            <div className="flex items-center gap-2">
              <HealthRing score={account.health_score} />
              <span className={cn('text-[11px] font-medium', getHealthColor(account.health_score))}>
                {account.health_score >= 80 ? 'Strong' : account.health_score >= 60 ? 'Fair' : account.health_score >= 40 ? 'Weak' : 'At Risk'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Employees */}
        <Card className="card-hover">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Employees</span>
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight">{account.employee_count.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* Renewal */}
        <Card className="card-hover">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Renewal</span>
            </div>
            <p className="text-[15px] font-semibold tabular-nums">
              {account.renewal_date ? formatDate(account.renewal_date) : (
                <span className="text-muted-foreground font-normal">Not set</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card className="card-hover">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Owner</span>
            </div>
            {owner ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {getInitials(owner.full_name)}
                </div>
                <p className="text-[13px] font-semibold truncate">{owner.full_name}</p>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">Unassigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────── */}
      <div className="border-b mb-6">
        <nav className="flex gap-0" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 press-scale',
                'border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={cn(
                  'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums leading-none',
                  activeTab === tab.id
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Overview tab ────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 fade-in-up">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="divide-y divide-border">
                  {[
                    { label: 'Industry', value: account.industry, icon: <BarChart2 className="h-3 w-3" /> },
                    { label: 'Geography', value: account.geography, icon: <MapPin className="h-3 w-3" /> },
                    { label: 'Country', value: account.country, icon: <Globe className="h-3 w-3" /> },
                    { label: 'Segment', value: formatSegment(account.segment), icon: <Star className="h-3 w-3" /> },
                    {
                      label: 'Sub-segment',
                      value: account.sub_segment ? account.sub_segment.replace(/_/g, ' ') : null,
                      icon: <Star className="h-3 w-3" />,
                    },
                    { label: 'CRM Source', value: account.crm_source, icon: <RefreshCw className="h-3 w-3" /> },
                    { label: 'External ID', value: account.external_id, icon: <FileText className="h-3 w-3" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 row-hover px-1 -mx-1 rounded">
                      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                        <span className="text-muted-foreground/60">{icon}</span>
                        {label}
                      </dt>
                      <dd className="text-[13px] font-medium capitalize">
                        {value ?? <span className="text-muted-foreground/50 font-normal">—</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="divide-y divide-border">
                  {[
                    {
                      label: 'NPS Score',
                      value: (
                        <span className={cn('font-bold tabular-nums', nps >= 70 ? 'text-emerald-600' : nps >= 50 ? 'text-amber-600' : 'text-red-600')}>
                          {nps}
                        </span>
                      ),
                    },
                    {
                      label: 'CSAT',
                      value: <span className="font-bold tabular-nums">{csat}<span className="text-muted-foreground font-normal">/5</span></span>,
                    },
                    {
                      label: 'Last QBR',
                      value: <span className="font-medium">{lastQbrDate}</span>,
                    },
                    {
                      label: 'Open Tickets',
                      value: (
                        <span className={cn('font-bold tabular-nums flex items-center gap-1', openTickets > 3 ? 'text-red-600' : 'text-foreground')}>
                          {openTickets > 3 && <AlertCircle className="h-3 w-3" />}
                          {openTickets}
                        </span>
                      ),
                    },
                    {
                      label: 'Product Usage',
                      value: (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-medium px-2 py-0',
                            productUsage === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            productUsage === 'Growing' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                            'bg-amber-50 text-amber-700 border-amber-200',
                          )}
                        >
                          {productUsage}
                        </Badge>
                      ),
                    },
                    {
                      label: 'Transitions',
                      value: <span className="font-bold tabular-nums">{transitions.length}</span>,
                    },
                    {
                      label: 'Contacts',
                      value: <span className="font-bold tabular-nums">{contacts.length}</span>,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 row-hover px-1 -mx-1 rounded">
                      <dt className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{label}</dt>
                      <dd className="text-[13px]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Health Timeline Chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  Relationship Health — Last 6 Months
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-[11px] font-semibold tabular-nums', getHealthBg(account.health_score))}
                >
                  Current: {account.health_score}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={healthHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<HealthTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#healthGradient)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Contacts tab ────────────────────────────────────────────── */}
      {activeTab === 'contacts' && (
        <div className="fade-in-up">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">No contacts</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Contacts associated with this account will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map(contact => (
                <Card key={contact.id} className="card-hover group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full gradient-emerald flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[14px] font-semibold truncate">{contact.name}</p>
                          {contact.is_primary && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-foreground text-background leading-tight">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{contact.title ?? '—'}</p>
                      </div>
                    </div>

                    {/* Role badge */}
                    <div className="mb-3">
                      <Badge
                        variant="outline"
                        className={cn('text-[11px] font-medium capitalize px-2 py-0.5', roleBadgeClass(contact.role))}
                      >
                        {formatRole(contact.role)}
                      </Badge>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors group/link"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate link-hover">{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="tabular-nums">{contact.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Send email button — reveals on hover */}
                    {contact.email && (
                      <div className="mt-4 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-[12px] gap-1.5 action-reveal press-scale"
                          asChild
                        >
                          <a href={`mailto:${contact.email}`}>
                            <Mail className="h-3 w-3" />
                            Send Email
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Transitions tab ─────────────────────────────────────────── */}
      {activeTab === 'transitions' && (
        <div className="fade-in-up">
          {transitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RefreshCw className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">No transitions</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Account transitions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {transitions.map((t, idx) => (
                <div key={t.id} className="relative">
                  {/* Timeline line */}
                  {idx < transitions.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border z-0" />
                  )}

                  <Link
                    href={`/transitions/${t.id}`}
                    className="relative flex items-start gap-4 p-4 rounded-xl row-hover group block z-10"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-card z-10',
                      t.status === 'completed' ? 'border-emerald-300 text-emerald-600' :
                      t.status === 'stalled' ? 'border-red-300 text-red-500' :
                      t.status === 'in_progress' ? 'border-sky-300 text-sky-500' :
                      'border-border text-muted-foreground',
                    )}>
                      <RefreshCw className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {/* From → To owners */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-medium">{t.from_owner?.full_name ?? 'Unknown'}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[13px] font-semibold">{t.to_owner?.full_name ?? 'Unknown'}</span>
                          </div>
                          {/* Meta */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground tabular-nums">{formatDate(t.created_at)}</span>
                            <span className="text-muted-foreground/40 text-[11px]">·</span>
                            <span className="text-[11px] text-muted-foreground capitalize">{t.reason.replace(/_/g, ' ')}</span>
                            {t.due_date && (
                              <>
                                <span className="text-muted-foreground/40 text-[11px]">·</span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  Due {formatDate(t.due_date)}
                                </span>
                              </>
                            )}
                          </div>
                          {t.notes && (
                            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1 italic">{t.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] font-medium capitalize whitespace-nowrap', getStatusColor(t.status))}
                          >
                            {formatStatus(t.status)}
                          </Badge>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 action-reveal" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activity tab ─────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="fade-in-up">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">No activity yet</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Activity from related transitions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map((activity, idx) => (
                <div key={activity.id} className="relative">
                  {/* Timeline connector */}
                  {idx < activities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                  )}

                  <div className="relative flex items-start gap-4 p-4 rounded-xl row-hover">
                    {/* Icon dot */}
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 border bg-card z-10">
                      <ActivityIcon type={activity.type} />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-snug">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {activity.created_by_user && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <div className="h-3.5 w-3.5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                                  {getInitials(activity.created_by_user.full_name)}
                                </div>
                                {activity.created_by_user.full_name}
                              </span>
                            )}
                            <span className="text-muted-foreground/40 text-[11px]">·</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {formatRelativeDate(activity.created_at)}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium capitalize whitespace-nowrap shrink-0 text-muted-foreground"
                        >
                          {activity.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

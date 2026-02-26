'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Zap,
  Clock,
  DollarSign,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { cn, formatCurrency, getHealthBg } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MONTHLY_ARR_DATA = [
  { month: 'Mar', successful: 2800000, churned: 620000, inTransition: 950000 },
  { month: 'Apr', successful: 3200000, churned: 540000, inTransition: 1100000 },
  { month: 'May', successful: 3600000, churned: 490000, inTransition: 880000 },
  { month: 'Jun', successful: 4100000, churned: 430000, inTransition: 1040000 },
  { month: 'Jul', successful: 4400000, churned: 380000, inTransition: 960000 },
  { month: 'Aug', successful: 4900000, churned: 310000, inTransition: 1150000 },
  { month: 'Sep', successful: 5200000, churned: 270000, inTransition: 1020000 },
  { month: 'Oct', successful: 5600000, churned: 230000, inTransition: 1280000 },
  { month: 'Nov', successful: 6100000, churned: 190000, inTransition: 1100000 },
  { month: 'Dec', successful: 6800000, churned: 160000, inTransition: 980000 },
  { month: 'Jan', successful: 7300000, churned: 140000, inTransition: 1420000 },
  { month: 'Feb', successful: 7900000, churned: 120000, inTransition: 1240000 },
]

type OutcomeType = 'Retained' | 'Expanded' | 'At Risk' | 'Churned'

interface AccountOutcome {
  id: string
  accountName: string
  arr: number
  healthBefore: number
  healthAfter: number
  daysToComplete: number
  outcome: OutcomeType
  expansionAmount: number | null
  npsChange: number
  segment: string
}

const ACCOUNT_OUTCOMES: AccountOutcome[] = [
  { id: '1', accountName: 'Meridian Capital Group', arr: 2400000, healthBefore: 72, healthAfter: 88, daysToComplete: 9, outcome: 'Expanded', expansionAmount: 180000, npsChange: 14, segment: 'Enterprise' },
  { id: '2', accountName: 'Apex Financial Partners', arr: 1800000, healthBefore: 61, healthAfter: 79, daysToComplete: 12, outcome: 'Retained', expansionAmount: null, npsChange: 8, segment: 'Enterprise' },
  { id: '3', accountName: 'Thornfield Asset Management', arr: 920000, healthBefore: 55, healthAfter: 68, daysToComplete: 18, outcome: 'Retained', expansionAmount: null, npsChange: 5, segment: 'Corporate' },
  { id: '4', accountName: 'Vanguard Equity Solutions', arr: 3100000, healthBefore: 80, healthAfter: 91, daysToComplete: 8, outcome: 'Expanded', expansionAmount: 310000, npsChange: 19, segment: 'Enterprise' },
  { id: '5', accountName: 'Nexus Wealth Advisors', arr: 640000, healthBefore: 44, healthAfter: 38, daysToComplete: 34, outcome: 'At Risk', expansionAmount: null, npsChange: -8, segment: 'Commercial' },
  { id: '6', accountName: 'Brightstone Holdings', arr: 1250000, healthBefore: 68, healthAfter: 82, daysToComplete: 11, outcome: 'Retained', expansionAmount: null, npsChange: 12, segment: 'Corporate' },
  { id: '7', accountName: 'Atlas Pension Fund', arr: 4200000, healthBefore: 78, healthAfter: 85, daysToComplete: 7, outcome: 'Expanded', expansionAmount: 420000, npsChange: 16, segment: 'FINS' },
  { id: '8', accountName: 'Cascade Private Equity', arr: 870000, healthBefore: 35, healthAfter: 22, daysToComplete: 41, outcome: 'Churned', expansionAmount: null, npsChange: -24, segment: 'Commercial' },
  { id: '9', accountName: 'Sterling Trust Services', arr: 1580000, healthBefore: 70, healthAfter: 84, daysToComplete: 13, outcome: 'Retained', expansionAmount: null, npsChange: 7, segment: 'FINS' },
  { id: '10', accountName: 'Harborview Investment Co.', arr: 2900000, healthBefore: 82, healthAfter: 93, daysToComplete: 6, outcome: 'Expanded', expansionAmount: 290000, npsChange: 22, segment: 'Enterprise' },
  { id: '11', accountName: 'Pinnacle Growth Partners', arr: 510000, healthBefore: 58, healthAfter: 62, daysToComplete: 22, outcome: 'Retained', expansionAmount: null, npsChange: 3, segment: 'Commercial' },
  { id: '12', accountName: 'Redwood Family Office', arr: 740000, healthBefore: 48, healthAfter: 35, daysToComplete: 38, outcome: 'At Risk', expansionAmount: null, npsChange: -11, segment: 'Corporate' },
  { id: '13', accountName: 'Ironclad Asset Advisors', arr: 1960000, healthBefore: 74, healthAfter: 88, daysToComplete: 10, outcome: 'Retained', expansionAmount: null, npsChange: 9, segment: 'FINS' },
  { id: '14', accountName: 'Clearwater Capital', arr: 3400000, healthBefore: 85, healthAfter: 94, daysToComplete: 8, outcome: 'Expanded', expansionAmount: 340000, npsChange: 18, segment: 'Enterprise' },
  { id: '15', accountName: 'Montrose Hedge Fund', arr: 680000, healthBefore: 63, healthAfter: 71, daysToComplete: 16, outcome: 'Retained', expansionAmount: null, npsChange: 6, segment: 'FINS' },
]

const AI_INSIGHTS = [
  {
    id: 1,
    text: 'Transitions completed within 14 days have a 94% retention rate vs 71% for those exceeding 30 days.',
    category: 'Timing',
    categoryColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 2,
    text: 'Enterprise segment transitions generate 2.3x more churn risk than Commercial — consider dedicated transition managers for large accounts.',
    category: 'Risk',
    categoryColor: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    id: 3,
    text: 'Accounts with health scores below 60 at transition start have 40% higher churn rate — prioritize pre-transition health improvement.',
    category: 'Risk',
    categoryColor: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    id: 4,
    text: 'Rep Elena Rodriguez has the fastest avg transition time (9 days) with 100% retention — study her playbook and replicate across the team.',
    category: 'Performance',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 5,
    text: 'Transitions that include a warm intro call within 48 hours of handoff close 31% faster with 19% higher NPS scores.',
    category: 'Timing',
    categoryColor: 'bg-sky-50 text-sky-700 border-sky-200',
  },
]

const COMPARISON_METRICS = [
  {
    label: 'Avg Transition Time',
    without: '38 days',
    with: '14 days',
    withoutRaw: 38,
    withRaw: 14,
    max: 38,
    unit: 'days',
    lowerIsBetter: true,
    improvement: '63% faster',
  },
  {
    label: 'Churn Rate During Transition',
    without: '23%',
    with: '4%',
    withoutRaw: 23,
    withRaw: 4,
    max: 23,
    unit: '%',
    lowerIsBetter: true,
    improvement: '83% reduction',
  },
  {
    label: 'Customer Satisfaction Drop',
    without: '-18 NPS',
    with: '-3 NPS',
    withoutRaw: 18,
    withRaw: 3,
    max: 18,
    unit: 'pts',
    lowerIsBetter: true,
    improvement: '83% better',
  },
  {
    label: 'Revenue at Risk',
    without: '$12.4M',
    with: '$2.1M',
    withoutRaw: 12.4,
    withRaw: 2.1,
    max: 12.4,
    unit: 'M',
    lowerIsBetter: true,
    improvement: '83% less exposed',
  },
]

type DateRange = 'This Quarter' | 'Last Quarter' | 'YTD' | 'All Time'
const DATE_RANGES: DateRange[] = ['This Quarter', 'Last Quarter', 'YTD', 'All Time']

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OutcomeBadge({ outcome, expansionAmount }: { outcome: OutcomeType; expansionAmount: number | null }) {
  if (outcome === 'Retained') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Retained
      </span>
    )
  }
  if (outcome === 'Expanded' && expansionAmount) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
        <ArrowUpRight className="h-3 w-3" />
        +{formatCurrency(expansionAmount)}
      </span>
    )
  }
  if (outcome === 'At Risk') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        At Risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
      <XCircle className="h-3 w-3" />
      Churned
    </span>
  )
}

function HealthChange({ before, after }: { before: number; after: number }) {
  const delta = after - before
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium', getHealthBg(before))}>
        {before}
      </span>
      {delta > 0 ? (
        <ArrowUpRight className="h-3 w-3 text-emerald-500 shrink-0" />
      ) : delta < 0 ? (
        <ArrowDownRight className="h-3 w-3 text-red-500 shrink-0" />
      ) : (
        <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
      <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium', getHealthBg(after))}>
        {after}
      </span>
    </div>
  )
}

function NpsChange({ value }: { value: number }) {
  if (value > 0) {
    return <span className="text-[12px] font-semibold tabular-nums text-emerald-600">+{value}</span>
  }
  if (value < 0) {
    return <span className="text-[12px] font-semibold tabular-nums text-red-500">{value}</span>
  }
  return <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">0</span>
}

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md text-[12px]">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RevenuePage() {
  const [activeDateRange, setActiveDateRange] = useState<DateRange>('This Quarter')

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Impact</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track the business outcomes of every transition
          </p>
        </div>

        {/* Date range pills */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setActiveDateRange(range)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150 press-scale',
                activeDateRange === range
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* ARR Protected */}
        <Card className="card-hover relative overflow-hidden border-emerald-100">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent pointer-events-none" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Shield className="h-4.5 w-4.5 text-emerald-600" style={{ height: '18px', width: '18px' }} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <ArrowUpRight className="h-3 w-3" />
                +$3.1M vs last quarter
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              ARR Protected
            </p>
            <p className="text-[32px] font-bold tracking-tight text-foreground tabular-nums leading-none">
              $47.2M
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">
              Revenue successfully transitioned without churn
            </p>
          </CardContent>
        </Card>

        {/* Churn Prevented */}
        <Card className="card-hover relative overflow-hidden border-emerald-100">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-transparent pointer-events-none" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Zap className="h-4.5 w-4.5 text-emerald-600" style={{ height: '18px', width: '18px' }} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                6 accounts saved
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Churn Prevented
            </p>
            <p className="text-[32px] font-bold tracking-tight text-foreground tabular-nums leading-none">
              $2.8M
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">
              ARR that would have churned without proper handoff
            </p>
          </CardContent>
        </Card>

        {/* Avg Transition Time */}
        <Card className="card-hover relative overflow-hidden">
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
                <Clock className="h-4.5 w-4.5 text-sky-600" style={{ height: '18px', width: '18px' }} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200">
                <TrendingDown className="h-3 w-3" />
                63% faster
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Avg Transition Time
            </p>
            <p className="text-[32px] font-bold tracking-tight text-foreground tabular-nums leading-none">
              14.2 <span className="text-[18px] font-semibold text-muted-foreground">days</span>
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">
              vs <span className="font-medium line-through decoration-red-300">38 days</span> industry average
            </p>
          </CardContent>
        </Card>

        {/* Transition ROI */}
        <Card className="card-hover relative overflow-hidden border-amber-100">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <DollarSign className="h-4.5 w-4.5 text-amber-600" style={{ height: '18px', width: '18px' }} />
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                <ArrowUpRight className="h-3 w-3" />
                This quarter
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Transition ROI
            </p>
            <p className="text-[32px] font-bold tracking-tight text-foreground tabular-nums leading-none">
              94<span className="text-[18px] font-semibold text-muted-foreground">x</span>
            </p>
            <p className="text-[12px] text-muted-foreground mt-2">
              $50K investment protecting{' '}
              <span className="font-semibold text-foreground">$4.7M</span> at-risk ARR
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Revenue at Risk — Stacked Area Chart ─────────────────────────── */}
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">ARR Transition Outcomes</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">12-month revenue flow across all transitions</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block opacity-80" />
                Successfully Transitioned
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block opacity-80" />
                In Transition
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-400 inline-block opacity-80" />
                Churned
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={MONTHLY_ARR_DATA}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradSuccessful" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradInTransition" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradChurned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.92 0.01 70)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'oklch(0.55 0.01 50)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 11, fill: 'oklch(0.55 0.01 50)' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="successful"
                name="ARR Successfully Transitioned"
                stackId="1"
                stroke="#34d399"
                strokeWidth={1.5}
                fill="url(#gradSuccessful)"
              />
              <Area
                type="monotone"
                dataKey="inTransition"
                name="ARR Currently In Transition"
                stackId="1"
                stroke="#fbbf24"
                strokeWidth={1.5}
                fill="url(#gradInTransition)"
              />
              <Area
                type="monotone"
                dataKey="churned"
                name="ARR Churned During Transition"
                stackId="1"
                stroke="#f87171"
                strokeWidth={1.5}
                fill="url(#gradChurned)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Two-Column Section ────────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">

        {/* Account Outcomes Table */}
        <Card className="xl:col-span-3 card-hover overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Account Outcomes</CardTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">Last 15 completed transitions</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal">
                {ACCOUNT_OUTCOMES.filter(a => a.outcome === 'Retained' || a.outcome === 'Expanded').length}/{ACCOUNT_OUTCOMES.length} retained
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Account</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ARR</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Health</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Days</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Outcome</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">NPS</th>
                  </tr>
                </thead>
                <tbody>
                  {ACCOUNT_OUTCOMES.map((account, i) => (
                    <tr
                      key={account.id}
                      className={cn(
                        'border-b border-border/50 row-hover transition-colors group cursor-default',
                        i % 2 === 1 && 'bg-muted/20'
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground truncate max-w-[160px]" title={account.accountName}>
                          {account.accountName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{account.segment}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(account.arr)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center">
                          <HealthChange before={account.healthBefore} after={account.healthAfter} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className={cn(
                          'font-medium',
                          account.daysToComplete <= 14 ? 'text-emerald-600' :
                          account.daysToComplete <= 25 ? 'text-amber-600' : 'text-red-500'
                        )}>
                          {account.daysToComplete}d
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <OutcomeBadge outcome={account.outcome} expansionAmount={account.expansionAmount} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <NpsChange value={account.npsChange} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        <Card className="xl:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">AI Insights</CardTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">Patterns detected across transitions</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 border border-violet-100">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {AI_INSIGHTS.map((insight) => (
              <div
                key={insight.id}
                className="group rounded-xl border border-border bg-muted/20 p-3.5 transition-all duration-150 hover:border-violet-100 hover:bg-violet-50/30 cursor-default"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-50 border border-violet-100">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
                        insight.categoryColor
                      )}>
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-[12px] text-foreground leading-relaxed">
                      {insight.text}
                    </p>
                    <button className="mt-2 flex items-center gap-0.5 text-[11px] font-medium text-violet-600 hover:text-violet-700 transition-colors link-hover">
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* ── Cohort Comparison ─────────────────────────────────────────────── */}
      <Card className="card-hover overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Relay vs. Without Relay</CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                The measurable impact of structured transition management
              </p>
            </div>
            <Badge className="bg-emerald-600 text-white border-0 text-[11px]">
              Avg 83% improvement
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 mb-4 items-center">
            <div />
            <div className="w-36 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[12px] font-semibold text-red-700">Without Relay</span>
              </div>
            </div>
            <div className="w-36 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[12px] font-semibold text-emerald-700">With Relay</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {COMPARISON_METRICS.map((metric) => {
              const withoutPct = 100
              const withPct = Math.round((metric.withRaw / metric.withoutRaw) * 100)
              return (
                <div key={metric.label}>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-2">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{metric.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{metric.improvement}</p>
                    </div>
                    <div className="w-36 text-center">
                      <span className="text-[15px] font-bold tabular-nums text-red-600">{metric.without}</span>
                    </div>
                    <div className="w-36 text-center">
                      <span className="text-[15px] font-bold tabular-nums text-emerald-600">{metric.with}</span>
                    </div>
                  </div>

                  {/* Bar comparison */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    <div />
                    <div className="w-36 px-2">
                      <div className="h-2 w-full rounded-full bg-red-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all duration-700"
                          style={{ width: `${withoutPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-36 px-2">
                      <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${withPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom CTA strip */}
          <div className="mt-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-800">
                  $50K annual investment · $4.7M ARR protected
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Every dollar spent on Relay returns $94 in protected revenue
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-emerald-700 transition-colors press-scale">
              Export Report
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}

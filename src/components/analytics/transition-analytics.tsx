'use client'

// TransitionAnalytics — Analytics dashboard with Recharts
// Usage:
//   <TransitionAnalytics />

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, Clock, Users, ShieldCheck } from 'lucide-react'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const completionTimeData = [
  { month: 'Sep', days: 18 },
  { month: 'Oct', days: 22 },
  { month: 'Nov', days: 16 },
  { month: 'Dec', days: 25 },
  { month: 'Jan', days: 14 },
  { month: 'Feb', days: 11 },
]

const completionRateData = [
  { name: 'Jordan Lee', rate: 96, color: '#10b981' },
  { name: 'Alex Kim', rate: 91, color: '#10b981' },
  { name: 'Sam Rivera', rate: 88, color: '#3b82f6' },
  { name: 'Morgan Chen', rate: 83, color: '#3b82f6' },
  { name: 'Taylor Park', rate: 76, color: '#f59e0b' },
  { name: 'Casey Wong', rate: 71, color: '#f59e0b' },
]

const arrAtRiskData = [
  { month: 'Sep', arr: 1200000 },
  { month: 'Oct', arr: 1850000 },
  { month: 'Nov', arr: 980000 },
  { month: 'Dec', arr: 2400000 },
  { month: 'Jan', arr: 1600000 },
  { month: 'Feb', arr: 920000 },
]

const SLA_COMPLIANCE = 87

// ---------------------------------------------------------------------------
// Tooltip styles
// ---------------------------------------------------------------------------

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '11px',
  color: 'hsl(var(--foreground))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

// ---------------------------------------------------------------------------
// SLA Gauge
// ---------------------------------------------------------------------------

function SLAGauge({ value }: { value: number }) {
  const size = 140
  const strokeWidth = 10
  const r = (size - strokeWidth) / 2
  const circumference = Math.PI * r // half circle
  const offset = circumference - (value / 100) * circumference

  const color =
    value >= 90 ? '#10b981' : value >= 75 ? '#3b82f6' : value >= 60 ? '#f59e0b' : '#ef4444'

  const label =
    value >= 90
      ? 'Excellent'
      : value >= 75
      ? 'Good'
      : value >= 60
      ? 'Fair'
      : 'Needs Attention'

  const labelColor =
    value >= 90
      ? 'text-emerald-600'
      : value >= 75
      ? 'text-blue-600'
      : value >= 60
      ? 'text-amber-600'
      : 'text-red-500'

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative" style={{ width: size, height: size / 2 + strokeWidth }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          style={{ overflow: 'visible' }}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', transformOrigin: 'center' }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
          style={{ paddingBottom: '4px' }}
        >
          <span className={cn('text-3xl font-bold tabular-nums', labelColor)}>{value}%</span>
          <span className={cn('text-[11px] font-semibold mt-0.5', labelColor)}>{label}</span>
        </div>
      </div>
      {/* Scale labels */}
      <div className="flex justify-between w-full px-1 mt-2">
        <span className="text-[9px] text-muted-foreground">0%</span>
        <span className="text-[9px] text-muted-foreground">50%</span>
        <span className="text-[9px] text-muted-foreground">100%</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom tooltip for ARR
// ---------------------------------------------------------------------------

function formatArr(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

function ArrTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-[11px]">
        ARR at risk:{' '}
        <span className="font-semibold text-rose-600">{formatArr(payload[0].value)}</span>
      </p>
    </div>
  )
}

function DaysTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-[11px]">
        Avg. days:{' '}
        <span className="font-semibold text-emerald-600">{payload[0].value}d</span>
      </p>
    </div>
  )
}

function RateTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-[11px]">
        Completion rate:{' '}
        <span className="font-semibold text-blue-600">{payload[0].value}%</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary metric card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  trend?: 'up' | 'down'
  trendLabel?: string
}

function MetricCard({ icon, label, value, subtext, trend, trendLabel }: MetricCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-[22px] font-bold tabular-nums text-foreground leading-tight mt-0.5">
              {value}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {trend && trendLabel && (
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    trend === 'up' ? 'text-emerald-600' : 'text-rose-500',
                  )}
                >
                  {trend === 'up' ? '+' : ''}
                  {trendLabel}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">{subtext}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function TransitionAnalytics() {
  return (
    <div className="space-y-5">
      {/* Summary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Clock className="h-4 w-4 text-emerald-600" />}
          label="Avg. Completion"
          value="14d"
          subtext="vs. 22d last month"
          trend="up"
          trendLabel="-37%"
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          label="Completion Rate"
          value="84%"
          subtext="across all reps"
          trend="up"
          trendLabel="+6pp"
        />
        <MetricCard
          icon={<ShieldCheck className="h-4 w-4 text-violet-600" />}
          label="SLA Compliance"
          value="87%"
          subtext="of transitions on-time"
          trend="up"
          trendLabel="+3pp"
        />
        <MetricCard
          icon={<Users className="h-4 w-4 text-amber-600" />}
          label="Active Transitions"
          value="23"
          subtext="across 8 reps"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Avg completion time */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Avg. Completion Time</CardTitle>
                <p className="text-[10px] text-muted-foreground">Days per transition · last 6 months</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={completionTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}d`}
                />
                <Tooltip content={<DaysTooltip />} />
                <Bar dataKey="days" radius={[5, 5, 0, 0]}>
                  {completionTimeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.days <= 14
                          ? '#10b981'
                          : entry.days <= 20
                          ? '#3b82f6'
                          : '#f59e0b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion rate by rep */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Completion Rate by Rep</CardTitle>
                <p className="text-[10px] text-muted-foreground">On-time transition completion · all time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={completionRateData}
                layout="vertical"
                margin={{ top: 4, right: 4, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<RateTooltip />} />
                <Bar dataKey="rate" radius={[0, 5, 5, 0]}>
                  {completionRateData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ARR at risk — spans 2 cols */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
                <TrendingUp className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">ARR at Risk Over Time</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  Revenue in active transitions · last 6 months
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={arrAtRiskData}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatArr}
                />
                <Tooltip content={<ArrTooltip />} />
                <Area
                  type="monotone"
                  dataKey="arr"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#arrGradient)"
                  dot={{ fill: '#f43f5e', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA compliance gauge */}
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">SLA Compliance</CardTitle>
                <p className="text-[10px] text-muted-foreground">Transitions completed on-time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SLAGauge value={SLA_COMPLIANCE} />

            {/* Legend */}
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              {[
                { label: 'On-time', value: `${SLA_COMPLIANCE}%`, color: 'bg-blue-500' },
                { label: 'Delayed', value: `${100 - SLA_COMPLIANCE}%`, color: 'bg-amber-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', item.color)} />
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

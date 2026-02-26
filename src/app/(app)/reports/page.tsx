'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeftRight,
  Users,
  AlertTriangle,
  DollarSign,
  Mail,
  FileText,
  Download,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  PauseCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  BarChart3,
  Loader2,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import {
  demoTransitions,
  demoAccounts,
  demoTeamMembers,
  demoActivities,
} from '@/lib/demo-data'
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusColor,
  getPriorityColor,
  getSegmentColor,
  formatSegment,
  getHealthBg,
  cn,
} from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportType = 'transition_summary' | 'team_performance' | 'at_risk' | 'arr_impact' | 'email_effectiveness' | 'audit_trail'
type DateRange = '7d' | '30d' | '90d' | 'all'

interface ReportTemplate {
  id: ReportType
  title: string
  description: string
  icon: React.ElementType
  color: string
  iconBg: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENT_COLORS: Record<string, string> = {
  commercial: '#38bdf8',
  corporate: '#a78bfa',
  enterprise: '#fbbf24',
  fins: '#34d399',
  international: '#fb7185',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  pending_approval: '#eab308',
  approved: '#3b82f6',
  intro_sent: '#6366f1',
  meeting_booked: '#a855f7',
  in_progress: '#06b6d4',
  completed: '#22c55e',
  stalled: '#ef4444',
  cancelled: '#6b7280',
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'transition_summary',
    title: 'Transition Summary',
    description: 'Overview of all transitions by status, segment, and priority',
    icon: ArrowLeftRight,
    color: 'text-sky-600',
    iconBg: 'bg-sky-50',
  },
  {
    id: 'team_performance',
    title: 'Team Performance',
    description: 'Rep completion rates, avg time, and capacity utilization',
    icon: Users,
    color: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    id: 'at_risk',
    title: 'At-Risk Accounts',
    description: 'Accounts with low health scores in active transitions',
    icon: AlertTriangle,
    color: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'arr_impact',
    title: 'ARR Impact',
    description: 'Revenue at risk and successfully transitioned ARR',
    icon: DollarSign,
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    id: 'email_effectiveness',
    title: 'Email Effectiveness',
    description: 'Intro email open rates, reply rates, and time to first meeting',
    icon: Mail,
    color: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  {
    id: 'audit_trail',
    title: 'Audit Trail',
    description: 'Complete activity log export for compliance',
    icon: FileText,
    color: 'text-stone-600',
    iconBg: 'bg-stone-50',
  },
]

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  all: 'All Time',
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

const enrichedTransitions = demoTransitions.map(t => ({
  ...t,
  account: demoAccounts.find(a => a.id === t.account_id),
  from_owner: demoTeamMembers.find(u => u.id === t.from_owner_id),
  to_owner: demoTeamMembers.find(u => u.id === t.to_owner_id),
}))

function getStatusBarData() {
  const statuses = ['draft', 'pending_approval', 'approved', 'intro_sent', 'meeting_booked', 'in_progress', 'completed', 'stalled']
  return statuses.map(s => ({
    label: formatStatus(s).replace(' ', '\n'),
    shortLabel: s === 'pending_approval' ? 'Pending' : s === 'meeting_booked' ? 'Meeting' : s === 'in_progress' ? 'Active' : formatStatus(s),
    count: demoTransitions.filter(t => t.status === s).length,
    fill: STATUS_COLORS[s] ?? '#9ca3af',
  }))
}

function getSegmentPieData() {
  return ['commercial', 'corporate', 'enterprise', 'fins', 'international'].map(seg => ({
    name: formatSegment(seg),
    value: demoAccounts.filter(a => a.segment === seg).length,
    arr: demoAccounts.filter(a => a.segment === seg).reduce((s, a) => s + a.arr, 0),
    fill: SEGMENT_COLORS[seg],
  }))
}

function getTeamPerformanceData() {
  return demoTeamMembers
    .filter(m => m.role === 'rep' || m.role === 'manager')
    .map(m => {
      const toTransitions = enrichedTransitions.filter(t => t.to_owner_id === m.id)
      const completed = toTransitions.filter(t => t.status === 'completed').length
      const total = toTransitions.length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      const avgDays = 18 + Math.floor(m.id.charCodeAt(m.id.length - 1) * 1.3) % 20
      return { name: m.full_name, completed, total, rate, avgDays, capacity: m.capacity }
    })
}

function getAtRiskData() {
  return enrichedTransitions
    .filter(t => !['completed', 'cancelled'].includes(t.status) && t.account && (t.account.health_score ?? 100) < 70)
    .sort((a, b) => (a.account?.health_score ?? 100) - (b.account?.health_score ?? 100))
    .slice(0, 10)
}

function getArrImpactData() {
  return enrichedTransitions.slice(0, 10).map(t => ({
    ...t,
    arr: t.account?.arr ?? 0,
    health: t.account?.health_score ?? 0,
  }))
}

// Seeded mock email stats per transition
function getEmailRows() {
  return enrichedTransitions.slice(0, 10).map((t, i) => ({
    ...t,
    sent: new Date('2026-01-' + String(i + 1).padStart(2, '0')).toISOString(),
    openRate: 45 + (i * 7) % 45,
    replyRate: 15 + (i * 11) % 35,
    daysToMeeting: 3 + (i * 3) % 14,
    status: ['opened', 'replied', 'bounced', 'pending'][i % 4],
  }))
}

function getAuditRows() {
  const users: Record<string, string> = Object.fromEntries(demoTeamMembers.map(u => [u.id, u.full_name]))
  return demoActivities.slice(0, 10).map(a => ({
    ...a,
    actor: (a.created_by ? users[a.created_by] : undefined) ?? 'System',
    transition: enrichedTransitions.find(t => t.id === a.transition_id),
  }))
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  danger?: boolean
  warning?: boolean
}

function StatCard({ label, value, sub, icon: Icon, trend, trendValue, danger, warning }: StatCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className={cn(
            'text-2xl font-bold tracking-tight tabular-nums',
            danger && 'text-red-600',
            warning && 'text-amber-600',
          )}>
            {value}
          </span>
          {trend && trendValue && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-semibold mb-1 rounded-full px-1.5 py-0.5',
              trend === 'up' && !danger ? 'text-emerald-600 bg-emerald-50' : '',
              trend === 'down' && !danger ? 'text-red-600 bg-red-50' : '',
              danger && 'text-emerald-600 bg-emerald-50',
              warning && 'text-amber-600 bg-amber-50',
            )}>
              {trend === 'up' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {trendValue}
            </span>
          )}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function GeneratingBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 2000
    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min((elapsed / duration) * 100, 99)
      setProgress(p)
      if (p < 99) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Generating report...
      </div>
      <div className="w-64 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart tooltip style
// ---------------------------------------------------------------------------

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid oklch(0.92 0.01 70)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  fontSize: '12px',
}

// ---------------------------------------------------------------------------
// Report Views
// ---------------------------------------------------------------------------

function TransitionSummaryReport({ range }: { range: DateRange }) {
  const statusData = getStatusBarData()
  const segmentData = getSegmentPieData()

  const totalActive = demoTransitions.filter(t => !['completed', 'cancelled'].includes(t.status)).length
  const totalCompleted = demoTransitions.filter(t => t.status === 'completed').length
  const stalled = demoTransitions.filter(t => t.status === 'stalled').length
  const criticalCount = demoTransitions.filter(t => t.priority === 'critical').length

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Transitions" value={demoTransitions.length} icon={ArrowLeftRight} trend="up" trendValue="+8%" sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="Active" value={totalActive} icon={Clock} trend="up" trendValue="+3" />
        <StatCard label="Completed" value={totalCompleted} icon={CheckCircle2} trend="up" trendValue="+5" />
        <StatCard label="Stalled" value={stalled} icon={AlertTriangle} danger trend="down" trendValue="-1" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} barSize={22} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {statusData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">By Segment</CardTitle>
              <Badge variant="outline" className="text-[10px]">{demoAccounts.length} accounts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {segmentData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => v != null ? [`${v} accounts`] : ['—']} contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={7}
                  formatter={(v) => <span style={{ fontSize: '10px', color: 'oklch(0.55 0.01 50)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Transition Details</CardTitle>
            <Badge variant="outline" className="text-[10px]">{enrichedTransitions.length} rows</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[11px]">Account</TableHead>
                <TableHead className="text-[11px]">Segment</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Priority</TableHead>
                <TableHead className="text-[11px]">From</TableHead>
                <TableHead className="text-[11px]">To</TableHead>
                <TableHead className="text-[11px] text-right pr-4">ARR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="striped-rows">
              {enrichedTransitions.slice(0, 9).map(t => (
                <TableRow key={t.id} className="row-hover">
                  <TableCell className="pl-4">
                    <span className="text-[12px] font-medium">{t.account?.name ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', getSegmentColor(t.account?.segment ?? ''))}>
                      {formatSegment(t.account?.segment ?? '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', getStatusColor(t.status))}>
                      {formatStatus(t.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', getPriorityColor(t.priority))}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{t.from_owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{t.to_owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] font-medium tabular-nums text-right pr-4">
                    {formatCurrency(t.account?.arr ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamPerformanceReport({ range }: { range: DateRange }) {
  const data = getTeamPerformanceData()
  const barData = data.map(d => ({ name: d.name.split(' ')[0], rate: d.rate, avgDays: d.avgDays }))

  const avgRate = Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)
  const avgDays = Math.round(data.reduce((s, d) => s + d.avgDays, 0) / data.length)
  const topRep = data.sort((a, b) => b.rate - a.rate)[0]
  const totalCompleted = data.reduce((s, d) => s + d.completed, 0)

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Avg Completion Rate" value={`${avgRate}%`} icon={CheckCircle2} trend="up" trendValue="+4%" sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="Avg Days to Complete" value={avgDays} icon={Clock} sub="days per transition" />
        <StatCard label="Top Performer" value={topRep?.name.split(' ')[0] ?? '—'} icon={TrendingUp} sub={`${topRep?.rate ?? 0}% rate`} />
        <StatCard label="Total Completed" value={totalCompleted} icon={ArrowLeftRight} trend="up" trendValue="+5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Completion Rate by Rep</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(v: number | undefined) => v != null ? [`${v}%`, 'Completion Rate'] : ['—']} contentStyle={tooltipStyle} />
                <Bar dataKey="rate" radius={[5, 5, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={['#34d399', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185'][i % 5]} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Avg Days to Complete by Rep</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number | undefined) => v != null ? [`${v} days`, 'Avg Duration'] : ['—']} contentStyle={tooltipStyle} />
                <Bar dataKey="avgDays" radius={[5, 5, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Rep Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[11px]">Rep</TableHead>
                <TableHead className="text-[11px]">Role</TableHead>
                <TableHead className="text-[11px] text-right">Assigned</TableHead>
                <TableHead className="text-[11px] text-right">Completed</TableHead>
                <TableHead className="text-[11px] text-right">Completion Rate</TableHead>
                <TableHead className="text-[11px] text-right">Avg Days</TableHead>
                <TableHead className="text-[11px] text-right pr-4">Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="striped-rows">
              {getTeamPerformanceData().map(rep => (
                <TableRow key={rep.name} className="row-hover">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                        {rep.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[12px] font-medium">{rep.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {demoTeamMembers.find(m => m.full_name === rep.name)?.role ?? 'rep'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] tabular-nums text-right">{rep.total}</TableCell>
                  <TableCell className="text-[12px] tabular-nums text-right text-emerald-600 font-medium">{rep.completed}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rep.rate}%` }} />
                      </div>
                      <span className="text-[12px] tabular-nums w-8 text-right">{rep.rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] tabular-nums text-right">{rep.avgDays}d</TableCell>
                  <TableCell className="text-[12px] tabular-nums text-right pr-4">{rep.capacity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AtRiskReport({ range }: { range: DateRange }) {
  const atRisk = getAtRiskData()
  const critical = atRisk.filter(t => t.priority === 'critical').length
  const high = atRisk.filter(t => t.priority === 'high').length
  const lowHealth = atRisk.filter(t => (t.account?.health_score ?? 100) < 50).length
  const totalAtRiskArr = atRisk.reduce((s, t) => s + (t.account?.arr ?? 0), 0)

  const healthData = [
    { range: '< 40', count: atRisk.filter(t => (t.account?.health_score ?? 100) < 40).length, fill: '#ef4444' },
    { range: '40–59', count: atRisk.filter(t => { const h = t.account?.health_score ?? 100; return h >= 40 && h < 60 }).length, fill: '#f97316' },
    { range: '60–69', count: atRisk.filter(t => { const h = t.account?.health_score ?? 100; return h >= 60 && h < 70 }).length, fill: '#eab308' },
  ]

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="At-Risk Accounts" value={atRisk.length} icon={AlertTriangle} warning sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="Critical Priority" value={critical} icon={AlertTriangle} danger />
        <StatCard label="Health Score < 50" value={lowHealth} icon={TrendingDown} danger />
        <StatCard label="ARR at Risk" value={formatCurrency(totalAtRiskArr)} icon={DollarSign} warning />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Health Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={healthData} barSize={40} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {healthData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">At-Risk Account Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 text-[11px]">Account</TableHead>
                  <TableHead className="text-[11px]">Health</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px]">Priority</TableHead>
                  <TableHead className="text-[11px] text-right pr-4">ARR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="striped-rows">
                {atRisk.slice(0, 8).map(t => (
                  <TableRow key={t.id} className="row-hover">
                    <TableCell className="pl-4 text-[12px] font-medium">{t.account?.name ?? '—'}</TableCell>
                    <TableCell>
                      <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', getHealthBg(t.account?.health_score ?? 0))}>
                        {t.account?.health_score ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', getStatusColor(t.status))}>
                        {formatStatus(t.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', getPriorityColor(t.priority))}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] tabular-nums text-right pr-4 font-medium">
                      {formatCurrency(t.account?.arr ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ArrImpactReport({ range }: { range: DateRange }) {
  const rows = getArrImpactData()
  const completedArr = enrichedTransitions.filter(t => t.status === 'completed').reduce((s, t) => s + (t.account?.arr ?? 0), 0)
  const activeArr = enrichedTransitions.filter(t => !['completed', 'cancelled'].includes(t.status)).reduce((s, t) => s + (t.account?.arr ?? 0), 0)
  const stalledArr = enrichedTransitions.filter(t => t.status === 'stalled').reduce((s, t) => s + (t.account?.arr ?? 0), 0)

  const segmentArrData = ['commercial', 'corporate', 'enterprise', 'fins', 'international'].map(seg => ({
    name: formatSegment(seg),
    arr: demoAccounts.filter(a => a.segment === seg && enrichedTransitions.some(t => t.account_id === a.id)).reduce((s, a) => s + a.arr, 0),
    fill: SEGMENT_COLORS[seg],
  }))

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="ARR Transitioned" value={formatCurrency(completedArr)} icon={CheckCircle2} trend="up" trendValue="+12%" sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="ARR In Transition" value={formatCurrency(activeArr)} icon={Clock} />
        <StatCard label="ARR Stalled" value={formatCurrency(stalledArr)} icon={AlertTriangle} danger />
        <StatCard label="Total ARR Portfolio" value={formatCurrency(demoAccounts.reduce((s, a) => s + a.arr, 0))} icon={DollarSign} />
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">ARR by Segment in Transition</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={segmentArrData} barSize={40} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number | undefined) => v != null ? [formatCurrency(v), 'ARR'] : ['—']} contentStyle={tooltipStyle} />
              <Bar dataKey="arr" radius={[5, 5, 0, 0]}>
                {segmentArrData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">ARR Impact by Transition</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[11px]">Account</TableHead>
                <TableHead className="text-[11px]">Segment</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Health</TableHead>
                <TableHead className="text-[11px]">From</TableHead>
                <TableHead className="text-[11px]">To</TableHead>
                <TableHead className="text-[11px] text-right pr-4">ARR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="striped-rows">
              {rows.map(t => (
                <TableRow key={t.id} className="row-hover">
                  <TableCell className="pl-4 text-[12px] font-medium">{t.account?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', getSegmentColor(t.account?.segment ?? ''))}>
                      {formatSegment(t.account?.segment ?? '')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', getStatusColor(t.status))}>
                      {formatStatus(t.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded', getHealthBg(t.health))}>
                      {t.health}
                    </span>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{t.from_owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{t.to_owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] font-semibold tabular-nums text-right pr-4">
                    {formatCurrency(t.arr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function EmailEffectivenessReport({ range }: { range: DateRange }) {
  const rows = getEmailRows()
  const avgOpen = Math.round(rows.reduce((s, r) => s + r.openRate, 0) / rows.length)
  const avgReply = Math.round(rows.reduce((s, r) => s + r.replyRate, 0) / rows.length)
  const avgDays = Math.round(rows.reduce((s, r) => s + r.daysToMeeting, 0) / rows.length)
  const booked = rows.filter(r => r.status === 'replied' || r.status === 'opened').length

  const funnelData = [
    { name: 'Sent', value: rows.length, fill: '#6366f1' },
    { name: 'Opened', value: Math.round(rows.length * avgOpen / 100), fill: '#38bdf8' },
    { name: 'Replied', value: Math.round(rows.length * avgReply / 100), fill: '#34d399' },
    { name: 'Meeting', value: booked, fill: '#a78bfa' },
  ]

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Avg Open Rate" value={`${avgOpen}%`} icon={Mail} trend="up" trendValue="+3%" sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="Avg Reply Rate" value={`${avgReply}%`} icon={Mail} trend="up" trendValue="+1%" />
        <StatCard label="Avg Days to Meeting" value={avgDays} icon={Calendar} sub="days" />
        <StatCard label="Meetings Booked" value={booked} icon={CheckCircle2} trend="up" trendValue="+2" />
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Email Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} barSize={48} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {funnelData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Intro Email Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[11px]">Account</TableHead>
                <TableHead className="text-[11px]">From Rep</TableHead>
                <TableHead className="text-[11px]">Sent</TableHead>
                <TableHead className="text-[11px] text-right">Open Rate</TableHead>
                <TableHead className="text-[11px] text-right">Reply Rate</TableHead>
                <TableHead className="text-[11px] text-right">Days to Meeting</TableHead>
                <TableHead className="text-[11px] text-right pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="striped-rows">
              {rows.map(r => (
                <TableRow key={r.id} className="row-hover">
                  <TableCell className="pl-4 text-[12px] font-medium">{r.account?.name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{r.from_owner?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{formatDate(r.sent)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${r.openRate}%` }} />
                      </div>
                      <span className="text-[12px] tabular-nums">{r.openRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.replyRate}%` }} />
                      </div>
                      <span className="text-[12px] tabular-nums">{r.replyRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] tabular-nums text-right">{r.daysToMeeting}d</TableCell>
                  <TableCell className="text-right pr-4">
                    <Badge variant="outline" className={cn('text-[10px]',
                      r.status === 'replied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'opened' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      r.status === 'bounced' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-stone-100 text-stone-500 border-stone-200'
                    )}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AuditTrailReport({ range }: { range: DateRange }) {
  const rows = getAuditRows()
  const typeCount: Record<string, number> = {}
  rows.forEach(r => { typeCount[r.type] = (typeCount[r.type] ?? 0) + 1 })

  const typeData = Object.entries(typeCount).map(([type, count], i) => ({
    name: formatStatus(type),
    count,
    fill: ['#6366f1', '#34d399', '#fbbf24', '#38bdf8', '#fb7185'][i % 5],
  }))

  const actorCount: Record<string, number> = {}
  rows.forEach(r => { actorCount[r.actor] = (actorCount[r.actor] ?? 0) + 1 })
  const uniqueActors = Object.keys(actorCount).length

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={demoActivities.length} icon={FileText} sub={DATE_RANGE_LABELS[range]} />
        <StatCard label="Unique Actors" value={uniqueActors} icon={Users} />
        <StatCard label="Status Changes" value={typeCount['status_change'] ?? 0} icon={ArrowLeftRight} />
        <StatCard label="Emails Sent" value={typeCount['email_sent'] ?? 0} icon={Mail} />
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Activity by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} barSize={36} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {typeData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
            <Badge variant="outline" className="text-[10px]">{demoActivities.length} total events</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 text-[11px]">Timestamp</TableHead>
                <TableHead className="text-[11px]">Actor</TableHead>
                <TableHead className="text-[11px]">Type</TableHead>
                <TableHead className="text-[11px]">Account</TableHead>
                <TableHead className="text-[11px] pr-4">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="striped-rows">
              {rows.map(r => (
                <TableRow key={r.id} className="row-hover">
                  <TableCell className="pl-4 text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </TableCell>
                  <TableCell className="text-[12px] font-medium">{r.actor}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] bg-stone-50 text-stone-600">
                      {formatStatus(r.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {r.transition?.account?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground pr-4 max-w-xs truncate">
                    {r.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report renderer
// ---------------------------------------------------------------------------

function ReportContent({ type, range }: { type: ReportType; range: DateRange }) {
  switch (type) {
    case 'transition_summary': return <TransitionSummaryReport range={range} />
    case 'team_performance': return <TeamPerformanceReport range={range} />
    case 'at_risk': return <AtRiskReport range={range} />
    case 'arr_impact': return <ArrImpactReport range={range} />
    case 'email_effectiveness': return <EmailEffectivenessReport range={range} />
    case 'audit_trail': return <AuditTrailReport range={range} />
  }
}

// ---------------------------------------------------------------------------
// Scheduled reports section
// ---------------------------------------------------------------------------

const SCHEDULED_REPORTS = [
  {
    id: 's1',
    name: 'Weekly Transition Summary',
    frequency: 'Every Monday 9 AM',
    recipients: ['Sarah Chen', 'Marcus Johnson'],
    type: 'transition_summary' as ReportType,
    nextRun: 'Mar 3, 2026',
    active: true,
  },
  {
    id: 's2',
    name: 'Monthly ARR Impact',
    frequency: '1st of month',
    recipients: ['All Managers'],
    type: 'arr_impact' as ReportType,
    nextRun: 'Mar 1, 2026',
    active: true,
  },
  {
    id: 's3',
    name: 'Daily At-Risk Alert',
    frequency: 'Daily 8 AM',
    recipients: ['Team'],
    type: 'at_risk' as ReportType,
    nextRun: 'Feb 27, 2026',
    active: false,
  },
]

function ScheduledReportsSection() {
  const [paused, setPaused] = useState<Set<string>>(new Set(['s3']))

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Scheduled Reports</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated delivery to your team</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5">
            <Plus className="h-3 w-3" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {SCHEDULED_REPORTS.map(sr => {
          const template = REPORT_TEMPLATES.find(t => t.id === sr.type)!
          const Icon = template.icon
          const isPaused = paused.has(sr.id)
          return (
            <div
              key={sr.id}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-3.5 group transition-all duration-150',
                isPaused ? 'opacity-60 bg-muted/30' : 'bg-card hover:shadow-sm',
              )}
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', template.iconBg)}>
                <Icon className={cn('h-4 w-4', template.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium">{sr.name}</span>
                  {isPaused && (
                    <Badge variant="outline" className="text-[9px] bg-stone-50 text-stone-500 border-stone-200">Paused</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {sr.frequency}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {sr.recipients.join(', ')}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Next: {sr.nextRun}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 action-reveal opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title={isPaused ? 'Resume' : 'Pause'}
                  onClick={() => setPaused(prev => {
                    const next = new Set(prev)
                    next.has(sr.id) ? next.delete(sr.id) : next.add(sr.id)
                    return next
                  })}
                >
                  <PauseCircle className={cn('h-3 w-3', isPaused ? 'text-emerald-600' : 'text-amber-600')} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [generating, setGenerating] = useState(false)
  const [ready, setReady] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  const handleGenerate = useCallback((id: ReportType) => {
    setActiveReport(id)
    setReady(false)
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setReady(true)
    }, 2000)
  }, [])

  const activeTemplate = REPORT_TEMPLATES.find(t => t.id === activeReport)

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and export transition reports</p>
        </div>
        <Button className="h-9 gap-2 shrink-0" size="sm">
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* ── Report Templates ── */}
      <div>
        <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Report Templates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TEMPLATES.map(template => {
            const Icon = template.icon
            const isActive = activeReport === template.id
            return (
              <Card
                key={template.id}
                className={cn(
                  'card-hover cursor-default transition-all duration-200',
                  isActive && ready && 'ring-2 ring-primary/20 shadow-md',
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', template.iconBg)}>
                      <Icon className={cn('h-4.5 w-4.5', template.color)} style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="text-[13px] font-semibold">{template.title}</h3>
                        {isActive && ready && (
                          <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 border" variant="outline">
                            Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{template.description}</p>
                      <Button
                        size="sm"
                        variant={isActive && ready ? 'outline' : 'default'}
                        className="h-7 text-[11px] gap-1.5 press-scale"
                        onClick={() => handleGenerate(template.id)}
                        disabled={generating && activeReport === template.id}
                      >
                        {generating && activeReport === template.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : isActive && ready ? (
                          <>
                            <BarChart3 className="h-3 w-3" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3 w-3" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ── Generated Report Preview ── */}
      {activeReport && (
        <div className="space-y-4 fade-in-up">
          {/* Report header bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {activeTemplate && (
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', activeTemplate.iconBg)}>
                  <activeTemplate.icon className={cn('h-4 w-4', activeTemplate.color)} />
                </div>
              )}
              <div>
                <h2 className="text-[15px] font-semibold">{activeTemplate?.title}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {ready ? `Generated ${formatDate('2026-02-26')}` : 'Generating...'}
                </p>
              </div>
            </div>

            {/* Date range pills */}
            {ready && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-full p-0.5">
                {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(dr => (
                  <button
                    key={dr}
                    onClick={() => setDateRange(dr)}
                    className={cn(
                      'text-[11px] font-medium px-3 py-1 rounded-full transition-all duration-150',
                      dateRange === dr
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {DATE_RANGE_LABELS[dr]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar / report content */}
          <Card>
            <CardContent className="p-4">
              {generating && <GeneratingBar />}
              {ready && <ReportContent type={activeReport} range={dateRange} />}
            </CardContent>
          </Card>

          {/* Export actions */}
          {ready && (
            <div className="flex items-center gap-2 flex-wrap fade-in-up">
              <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5 press-scale">
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5 press-scale">
                <FileText className="h-3.5 w-3.5" />
                Download PDF
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-[12px] gap-1.5 press-scale">
                <CalendarClock className="h-3.5 w-3.5" />
                Schedule Report
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Scheduled Reports ── */}
      <ScheduledReportsSection />
    </div>
  )
}

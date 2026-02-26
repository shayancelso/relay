'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeftRight, Mail, Calendar, AlertTriangle, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Users, Building2,
} from 'lucide-react'
import { formatCurrency, formatRelativeDate, formatStatus, getStatusColor, getPriorityColor, getSegmentColor, formatSegment, getHealthColor, cn } from '@/lib/utils'
import {
  getDemoMetrics, getDemoPipeline, getDemoWorkload, getDemoRecentActivities,
  demoTransitions, demoAccounts, demoTeamMembers,
} from '@/lib/demo-data'
import { NumberTicker } from '@/components/ui/number-ticker'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

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

export function RevOpsDashboard() {
  const metrics = getDemoMetrics()
  const pipeline = getDemoPipeline()
  const workload = getDemoWorkload()
  const activities = getDemoRecentActivities()

  // Segment ARR breakdown
  const segmentData = ['commercial', 'corporate', 'enterprise', 'fins', 'international'].map(seg => {
    const segAccounts = demoAccounts.filter(a => a.segment === seg)
    return {
      name: formatSegment(seg),
      value: segAccounts.reduce((sum, a) => sum + a.arr, 0),
      count: segAccounts.length,
      fill: SEGMENT_COLORS[seg],
    }
  })

  const shortStatusLabel: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending',
    approved: 'Approved',
    intro_sent: 'Intro Sent',
    meeting_booked: 'Meeting',
    in_progress: 'Active',
    completed: 'Done',
    stalled: 'Stalled',
    cancelled: 'Cancelled',
  }

  const pipelineData = pipeline.map(p => ({
    ...p,
    label: shortStatusLabel[p.status] || formatStatus(p.status),
    fill: STATUS_COLORS[p.status] || '#6b7280',
  }))

  const atRisk = demoTransitions
    .filter(t => !['completed', 'cancelled'].includes(t.status))
    .sort((a, b) => {
      const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (prioOrder[a.priority] || 3) - (prioOrder[b.priority] || 3)
    })
    .slice(0, 8)
    .map(t => ({
      ...t,
      account: demoAccounts.find(a => a.id === t.account_id),
      from_owner: demoTeamMembers.find(u => u.id === t.from_owner_id),
      to_owner: demoTeamMembers.find(u => u.id === t.to_owner_id),
    }))

  const metricCards = [
    { label: 'Active Transitions', value: metrics.active_transitions, icon: ArrowLeftRight, change: '+3', up: true },
    { label: 'Intros Sent', value: metrics.intros_sent_this_week, icon: Mail, change: '+5', up: true, sub: 'this week' },
    { label: 'Meetings Booked', value: metrics.meetings_booked, icon: Calendar, change: '+2', up: true },
    { label: 'Stalled', value: metrics.stalled_count, icon: AlertTriangle, change: '-1', up: false, danger: true },
    { label: 'At Risk', value: metrics.at_risk_count, icon: TrendingUp, change: '+2', up: true, warning: true },
    { label: 'ARR in Transition', value: null, displayValue: formatCurrency(metrics.total_arr_in_transition), icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time view across all segments and teams</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((card) => (
          <Card key={card.label} className="card-hover overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50">
                  <card.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className={cn(
                  'text-2xl font-bold tracking-tight tabular-nums',
                  card.danger && 'text-red-600',
                  card.warning && 'text-amber-600',
                )}>
                  {card.displayValue || <NumberTicker value={card.value!} />}
                </span>
                {card.change && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[10px] font-semibold mb-1 rounded-full px-1.5 py-0.5',
                    card.up && !card.danger && !card.warning ? 'text-emerald-600 bg-emerald-50' : '',
                    card.danger ? 'text-emerald-600 bg-emerald-50' : '',
                    card.warning ? 'text-amber-600 bg-amber-50' : '',
                  )}>
                    {card.up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {card.change}
                  </span>
                )}
              </div>
              {card.sub && <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Transition Pipeline</CardTitle>
              <Badge variant="outline" className="text-[10px] font-normal">All Segments</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData} barSize={24} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">ARR by Segment</CardTitle>
              <Badge variant="outline" className="text-[10px] font-normal">{formatCurrency(demoAccounts.reduce((s, a) => s + a.arr, 0))}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => value != null ? formatCurrency(value) : '—'}
                  contentStyle={{
                    borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '11px', color: 'oklch(0.55 0.01 50)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: At-Risk + Workload + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* At-Risk Transitions */}
        <Card className="lg:col-span-1 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">At-Risk Transitions</CardTitle>
              <Link href="/transitions" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {atRisk.slice(0, 6).map(t => (
              <Link key={t.id} href={`/transitions/${t.id}`} className="flex items-center gap-3 rounded-lg p-2.5 row-hover group">
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0', getStatusColor(t.status))}>
                  {t.account?.health_score || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate group-hover:text-foreground">{t.account?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.from_owner?.full_name} → {t.to_owner?.full_name}</p>
                </div>
                <Badge variant="outline" className={cn('text-[9px] shrink-0', getPriorityColor(t.priority))}>{t.priority}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Rep Capacity */}
        <Card className="lg:col-span-1 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Team Capacity</CardTitle>
              <Link href="/team" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Manage →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.filter(w => w.capacity > 0).map(w => {
              const util = Math.round((w.account_count / w.capacity) * 100)
              return (
                <div key={w.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                        {w.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[12px] font-medium">{w.full_name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{w.account_count}/{w.capacity}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        util > 90 ? 'bg-red-500' : util > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-1 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1.5 flex flex-col items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <div className="w-px flex-1 bg-border/60 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-[12px] leading-relaxed">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {a.created_by_name} · {formatRelativeDate(a.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import { demoAccounts, demoTransitions, demoTeamMembers } from '@/lib/demo-data'
import { formatCurrency, formatSegment, cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, BarChart3,
  Target, Zap, Users, Building2,
} from 'lucide-react'
import { TransitionAnalytics } from '@/components/analytics/transition-analytics'

// ─── Derived Data ───────────────────────────────────────────────────────────

// Transition velocity over 12 months
const monthlyData = [
  { month: 'Mar', created: 5, completed: 3, avgDays: 9.2 },
  { month: 'Apr', created: 8, completed: 5, avgDays: 8.8 },
  { month: 'May', created: 12, completed: 7, avgDays: 8.1 },
  { month: 'Jun', created: 6, completed: 9, avgDays: 7.5 },
  { month: 'Jul', created: 10, completed: 8, avgDays: 7.2 },
  { month: 'Aug', created: 15, completed: 11, avgDays: 6.8 },
  { month: 'Sep', created: 9, completed: 12, avgDays: 6.5 },
  { month: 'Oct', created: 13, completed: 10, avgDays: 6.2 },
  { month: 'Nov', created: 7, completed: 8, avgDays: 5.9 },
  { month: 'Dec', created: 18, completed: 14, avgDays: 5.7 },
  { month: 'Jan', created: 11, completed: 13, avgDays: 5.4 },
  { month: 'Feb', created: 14, completed: 11, avgDays: 5.1 },
]

// Bottleneck analysis - avg days in each stage
const bottleneckData = [
  { stage: 'Draft', days: 0.5, fill: '#9ca3af' },
  { stage: 'Pending Approval', days: 1.8, fill: '#eab308' },
  { stage: 'Approved', days: 0.3, fill: '#3b82f6' },
  { stage: 'Intro Sent', days: 2.4, fill: '#6366f1' },
  { stage: 'Meeting Booked', days: 1.2, fill: '#a855f7' },
  { stage: 'In Progress', days: 3.1, fill: '#06b6d4' },
]

// Segment performance
const segmentPerf = ['commercial', 'corporate', 'enterprise', 'fins', 'international'].map(seg => {
  const accounts = demoAccounts.filter(a => a.segment === seg)
  const transitions = demoTransitions.filter(t => {
    const acct = demoAccounts.find(a => a.id === t.account_id)
    return acct?.segment === seg
  })
  const completed = transitions.filter(t => t.status === 'completed')
  return {
    segment: formatSegment(seg),
    accounts: accounts.length,
    totalArr: accounts.reduce((s, a) => s + a.arr, 0),
    avgHealth: accounts.length > 0 ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / accounts.length) : 0,
    transitions: transitions.length,
    completionRate: transitions.length > 0 ? Math.round((completed.length / transitions.length) * 100) : 0,
  }
})

// Rep leaderboard
const repPerf = demoTeamMembers.filter(m => m.role === 'rep').map(rep => {
  const accounts = demoAccounts.filter(a => a.current_owner_id === rep.id)
  const transitions = demoTransitions.filter(t => t.to_owner_id === rep.id)
  const completed = transitions.filter(t => t.status === 'completed')
  return {
    name: rep.full_name,
    accounts: accounts.length,
    arr: accounts.reduce((s, a) => s + a.arr, 0),
    completed: completed.length,
    active: transitions.filter(t => !['completed', 'cancelled'].includes(t.status)).length,
    avgHealth: accounts.length > 0 ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / accounts.length) : 0,
    completionRate: transitions.length > 0 ? Math.round((completed.length / transitions.length) * 100) : 0,
  }
}).sort((a, b) => b.completionRate - a.completionRate)

// Retention data (mock)
const retentionData = [
  { month: 'Sep', withRelay: 96, without: 82 },
  { month: 'Oct', withRelay: 97, without: 79 },
  { month: 'Nov', withRelay: 95, without: 81 },
  { month: 'Dec', withRelay: 98, without: 77 },
  { month: 'Jan', withRelay: 97, without: 80 },
  { month: 'Feb', withRelay: 96, without: 78 },
]

const SEGMENT_COLORS: Record<string, string> = {
  Commercial: '#38bdf8',
  Corporate: '#a78bfa',
  Enterprise: '#fbbf24',
  FINS: '#34d399',
  International: '#fb7185',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const totalCompleted = demoTransitions.filter(t => t.status === 'completed').length
  const totalActive = demoTransitions.filter(t => !['completed', 'cancelled'].includes(t.status)).length
  const avgCompletionDays = 5.1
  const completionRate = 78
  const arrProtected = demoTransitions
    .filter(t => t.status === 'completed')
    .reduce((s, t) => {
      const acct = demoAccounts.find(a => a.id === t.account_id)
      return s + (acct?.arr || 0)
    }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Transition performance metrics and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Avg. Completion Time', value: `${avgCompletionDays}d`, change: '-38%', up: false, good: true, icon: Clock, sub: 'Down from 8.2d in Q3' },
          { label: 'Completion Rate', value: `${completionRate}%`, change: '+12%', up: true, good: true, icon: CheckCircle2, sub: `${totalCompleted} of ${totalCompleted + totalActive} transitions` },
          { label: 'ARR Protected', value: formatCurrency(arrProtected), change: '+$1.2M', up: true, good: true, icon: Target, sub: 'Post-transition retention' },
          { label: 'Active Transitions', value: String(totalActive), change: '+3', up: true, good: false, icon: Zap, sub: 'Across all segments' },
        ].map(card => (
          <Card key={card.label} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{card.value}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn(
                      'flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5',
                      card.good ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                    )}>
                      {card.good ? <ArrowUpRight className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                      {card.change}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{card.sub}</span>
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
                  <card.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="velocity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
        </TabsList>

        {/* Velocity Tab */}
        <TabsContent value="velocity">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Transition Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="createdG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="completedG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#createdG)" strokeWidth={2} name="Created" />
                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#completedG)" strokeWidth={2} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Avg. Completion Time (days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[4, 10]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="avgDays" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} name="Avg Days" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Time Spent per Stage</CardTitle>
                  <Badge variant="outline" className="text-[10px]">Avg. days</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bottleneckData} layout="vertical" barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="d" />
                    <YAxis dataKey="stage" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} formatter={(v) => `${v} days`} />
                    <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                      {bottleneckData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Bottleneck Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { stage: 'In Progress', days: 3.1, insight: 'Longest stage — reps often delay marking complete after customer confirmation. Consider auto-advancing after meeting.', severity: 'high' },
                  { stage: 'Intro Sent', days: 2.4, insight: 'Customers take 2+ days to respond to intro emails. Follow-up automation at 48h would reduce this.', severity: 'medium' },
                  { stage: 'Pending Approval', days: 1.8, insight: 'Manager approval bottleneck. 60% of delays are from 2 managers. Consider auto-approve for low-ARR transitions.', severity: 'medium' },
                ].map(item => (
                  <div key={item.stage} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold">{item.stage}</span>
                      <Badge variant="outline" className={cn('text-[9px]', item.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                        {item.days}d avg
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{item.insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Segment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {['Segment', 'Accounts', 'Total ARR', 'Avg Health', 'Transitions', 'Completion Rate'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segmentPerf.map(row => (
                      <tr key={row.segment} className="border-b last:border-0 row-hover">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[row.segment] || '#6b7280' }} />
                            <span className="text-[12px] font-medium">{row.segment}</span>
                          </div>
                        </td>
                        <td className="p-3 text-[12px] tabular-nums">{row.accounts.toLocaleString()}</td>
                        <td className="p-3 text-[12px] font-medium tabular-nums">{formatCurrency(row.totalArr)}</td>
                        <td className="p-3">
                          <span className={cn('text-[12px] font-bold tabular-nums', row.avgHealth >= 70 ? 'text-emerald-600' : row.avgHealth >= 50 ? 'text-amber-600' : 'text-red-600')}>{row.avgHealth}</span>
                        </td>
                        <td className="p-3 text-[12px] tabular-nums">{row.transitions}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.completionRate}%` }} />
                            </div>
                            <span className="text-[11px] tabular-nums text-muted-foreground">{row.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Post-Transition Customer Retention</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">+18% improvement</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={retentionData}>
                  <defs>
                    <linearGradient id="withRelayG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="withoutG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[70, 100]} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="withRelay" stroke="#22c55e" fill="url(#withRelayG)" strokeWidth={2.5} name="With Relay" />
                  <Area type="monotone" dataKey="without" stroke="#ef4444" fill="url(#withoutG)" strokeWidth={2} strokeDasharray="5 5" name="Without Relay" />
                  <Legend verticalAlign="bottom" iconType="line" formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Rep Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {['Rank', 'Rep', 'Accounts', 'ARR Managed', 'Completed', 'Active', 'Avg Health', 'Rate'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repPerf.map((rep, i) => (
                      <tr key={rep.name} className="border-b last:border-0 row-hover">
                        <td className="p-3">
                          <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                            i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-stone-100 text-stone-600' : 'bg-orange-50 text-orange-600'
                          )}>{i + 1}</span>
                        </td>
                        <td className="p-3 text-[12px] font-medium">{rep.name}</td>
                        <td className="p-3 text-[12px] tabular-nums">{rep.accounts}</td>
                        <td className="p-3 text-[12px] font-medium tabular-nums">{formatCurrency(rep.arr)}</td>
                        <td className="p-3 text-[12px] tabular-nums text-emerald-600 font-semibold">{rep.completed}</td>
                        <td className="p-3 text-[12px] tabular-nums text-blue-600">{rep.active}</td>
                        <td className="p-3">
                          <span className={cn('text-[12px] font-bold tabular-nums', rep.avgHealth >= 70 ? 'text-emerald-600' : 'text-amber-600')}>{rep.avgHealth}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rep.completionRate}%` }} />
                            </div>
                            <span className="text-[11px] tabular-nums font-medium">{rep.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transitions">
          <TransitionAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}

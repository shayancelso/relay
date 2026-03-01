'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { demoAccounts, demoTransitions, demoTeamMembers } from '@/lib/demo-data'
import { formatCurrency, formatSegment, cn } from '@/lib/utils'
import {
  TrendingUp, Clock, CheckCircle2, ArrowUpRight,
  Target, Zap, Users,
} from 'lucide-react'

const chartLoading = <div className="h-[380px] rounded-xl bg-muted/30 animate-pulse" />

const VelocityCharts = dynamic(
  () => import('@/components/analytics/analytics-charts').then(m => ({ default: m.VelocityCharts })),
  { ssr: false, loading: () => chartLoading }
)
const BottleneckCharts = dynamic(
  () => import('@/components/analytics/analytics-charts').then(m => ({ default: m.BottleneckCharts })),
  { ssr: false, loading: () => chartLoading }
)
const RetentionChart = dynamic(
  () => import('@/components/analytics/analytics-charts').then(m => ({ default: m.RetentionChart })),
  { ssr: false, loading: () => chartLoading }
)
const TransitionAnalytics = dynamic(
  () => import('@/components/analytics/transition-analytics').then(m => ({ default: m.TransitionAnalytics })),
  { ssr: false, loading: () => chartLoading }
)

// ─── Derived Data ───────────────────────────────────────────────────────────

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
          <VelocityCharts />
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks">
          <BottleneckCharts />
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
          <RetentionChart />
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

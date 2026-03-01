'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle2, Users, Target,
  ArrowUpRight,
} from 'lucide-react'
import { formatCurrency, formatStatus, getStatusColor, getPriorityColor, getInitials, cn, formatSegment, getSegmentColor } from '@/lib/utils'
import {
  getDemoMetrics, getDemoWorkload,
  demoTransitions, demoAccounts, demoTeamMembers
} from '@/lib/demo-data'
import { NumberTicker } from '@/components/ui/number-ticker'
import Link from 'next/link'

const LeadershipCharts = dynamic(
  () => import('./leadership-charts').then(m => ({ default: m.LeadershipCharts })),
  { ssr: false, loading: () => <div className="lg:col-span-3 h-[320px] rounded-xl bg-muted/30 animate-pulse" /> }
)

export function LeadershipDashboard() {
  const metrics = getDemoMetrics()
  const workload = getDemoWorkload()

  // Team performance summary
  const teamPerf = demoTeamMembers.filter(m => m.role === 'rep').map(rep => {
    const repAccounts = demoAccounts.filter(a => a.current_owner_id === rep.id)
    const repTransitions = demoTransitions.filter(t => t.to_owner_id === rep.id)
    const completed = repTransitions.filter(t => t.status === 'completed').length
    const active = repTransitions.filter(t => !['completed', 'cancelled'].includes(t.status)).length
    const totalArr = repAccounts.reduce((s, a) => s + a.arr, 0)
    const avgHealth = repAccounts.length > 0 ? Math.round(repAccounts.reduce((s, a) => s + a.health_score, 0) / repAccounts.length) : 0
    return { ...rep, accountCount: repAccounts.length, completed, active, totalArr, avgHealth }
  })

  // At-risk accounts: low health + in transition
  const atRiskAccounts = demoAccounts
    .filter(a => a.health_score < 60)
    .sort((a, b) => b.arr - a.arr)
    .slice(0, 8)
    .map(a => ({
      ...a,
      owner: demoTeamMembers.find(m => m.id === a.current_owner_id),
      inTransition: demoTransitions.some(t => t.account_id === a.id && !['completed', 'cancelled'].includes(t.status)),
    }))


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Team Overview</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Pipeline health and team performance metrics</p>
        </div>
        <Link href="/transitions/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Target className="h-4 w-4" />
          New Transition
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" data-tour="metrics">
        {[
          { label: 'Completion Rate', value: '78%', sub: 'Last 30 days', icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Avg. Time to Complete', value: '6.2d', sub: 'Down from 8.1d', icon: Clock, color: 'text-blue-600' },
          { label: 'Team Utilization', value: '73%', sub: 'Across 4 reps', icon: Users, color: 'text-violet-600' },
          { label: 'At-Risk ARR', value: formatCurrency(metrics.total_arr_in_transition), sub: `${metrics.at_risk_count} accounts`, icon: AlertTriangle, color: 'text-amber-600' },
        ].map(card => (
          <Card key={card.label} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className={cn('mt-2 text-2xl font-bold tracking-tight tabular-nums', card.color)}>{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
                  <card.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Team Performance */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Pipeline Velocity — lazy loaded */}
        <LeadershipCharts />

        {/* Team Performance Table */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Rep Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamPerf.map(rep => (
              <div key={rep.id} className="flex items-center gap-3 rounded-lg p-2.5 row-hover">
                <Avatar className="h-9 w-9 border border-border/40">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/8 text-primary">{getInitials(rep.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium">{rep.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">{rep.accountCount} accounts · {formatCurrency(rep.totalArr)} ARR</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-semibold tabular-nums text-emerald-600">{rep.completed}</span>
                    <span className="text-[10px] text-muted-foreground">done</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-semibold tabular-nums text-blue-600">{rep.active}</span>
                    <span className="text-[10px] text-muted-foreground">active</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Accounts */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">At-Risk Accounts</CardTitle>
            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">{atRiskAccounts.length} accounts below 60 health</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">Account</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">Segment</th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">ARR</th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">Health</th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">Owner</th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {atRiskAccounts.map(a => (
                  <tr key={a.id} className="border-b last:border-0 row-hover">
                    <td className="p-3">
                      <Link href={`/accounts/${a.id}`} className="text-[12px] font-medium hover:text-primary transition-colors">{a.name}</Link>
                    </td>
                    <td className="p-3"><Badge variant="outline" className={cn('text-[9px]', getSegmentColor(a.segment))}>{formatSegment(a.segment)}</Badge></td>
                    <td className="p-3 text-right text-[12px] font-medium tabular-nums">{formatCurrency(a.arr)}</td>
                    <td className="p-3 text-center">
                      <span className={cn('inline-flex items-center justify-center h-6 w-8 rounded text-[11px] font-bold', a.health_score < 40 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                        {a.health_score}
                      </span>
                    </td>
                    <td className="p-3 text-[12px] text-muted-foreground">{a.owner?.full_name || '—'}</td>
                    <td className="p-3 text-center">
                      {a.inTransition ? (
                        <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">In Transition</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">Stable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

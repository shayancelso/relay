'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, FileText, Mail, Calendar, CheckCircle2, Clock, Building2, AlertTriangle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeDate, formatStatus, getStatusColor, getPriorityColor, getSegmentColor, formatSegment, getHealthBg, cn } from '@/lib/utils'
import {
  demoTransitions, demoAccounts, demoTeamMembers, demoBriefs, demoEmails,
} from '@/lib/demo-data'
import Link from 'next/link'

export function RepDashboard() {
  // Elena Rodriguez's data (user-3)
  const myId = 'user-3'
  const me = demoTeamMembers.find(m => m.id === myId)!
  const myAccounts = demoAccounts.filter(a => a.current_owner_id === myId)
  const myTransitions = demoTransitions
    .filter(t => t.to_owner_id === myId || t.from_owner_id === myId)
    .map(t => ({
      ...t,
      account: demoAccounts.find(a => a.id === t.account_id),
      from_owner: demoTeamMembers.find(u => u.id === t.from_owner_id),
      to_owner: demoTeamMembers.find(u => u.id === t.to_owner_id),
    }))

  const activeTransitions = myTransitions.filter(t => !['completed', 'cancelled'].includes(t.status))
  const totalArr = myAccounts.reduce((s, a) => s + a.arr, 0)
  const avgHealth = myAccounts.length > 0 ? Math.round(myAccounts.reduce((s, a) => s + a.health_score, 0) / myAccounts.length) : 0
  const lowHealthAccounts = myAccounts.filter(a => a.health_score < 60).sort((a, b) => a.health_score - b.health_score)

  // Action items (simulated)
  const actionItems = [
    { id: 1, type: 'brief', label: 'Review handoff brief for Lightspeed Commerce', priority: 'high', dueIn: 'Today' },
    { id: 2, type: 'email', label: 'Send intro email to Coveo Solutions', priority: 'medium', dueIn: 'Tomorrow' },
    { id: 3, type: 'meeting', label: 'Schedule handoff call with David Kim', priority: 'high', dueIn: 'Today' },
    { id: 4, type: 'review', label: 'Complete transition for Shopify Plus', priority: 'low', dueIn: 'This week' },
    { id: 5, type: 'brief', label: 'Generate brief for Wealthsimple Trade', priority: 'medium', dueIn: '2 days' },
  ]

  const actionIcons: Record<string, typeof FileText> = {
    brief: FileText,
    email: Mail,
    meeting: Calendar,
    review: CheckCircle2,
  }

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/[0.03] to-transparent border border-border/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good morning,</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{me.full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">You have <span className="font-semibold text-foreground">{activeTransitions.length} active transitions</span> and <span className="font-semibold text-amber-600">{actionItems.filter(a => a.dueIn === 'Today').length} items due today</span></p>
          </div>
          <div className="flex gap-3">
            <div className="text-center rounded-xl border bg-card p-3 min-w-[80px]">
              <p className="text-xl font-bold tabular-nums">{myAccounts.length}</p>
              <p className="text-[10px] text-muted-foreground">Accounts</p>
            </div>
            <div className="text-center rounded-xl border bg-card p-3 min-w-[80px]">
              <p className="text-xl font-bold tabular-nums">{formatCurrency(totalArr)}</p>
              <p className="text-[10px] text-muted-foreground">Total ARR</p>
            </div>
            <div className="text-center rounded-xl border bg-card p-3 min-w-[80px]">
              <p className={cn('text-xl font-bold tabular-nums', avgHealth >= 70 ? 'text-emerald-600' : 'text-amber-600')}>{avgHealth}</p>
              <p className="text-[10px] text-muted-foreground">Avg Health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items + Active Transitions */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Action Items */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Action Items</CardTitle>
              <Badge variant="outline" className="text-[10px]">{actionItems.length} pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {actionItems.map(item => {
              const Icon = actionIcons[item.type] || CheckCircle2
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg p-2.5 row-hover group cursor-pointer">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 shrink-0 group-hover:bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium leading-snug">{item.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-[9px]', getPriorityColor(item.priority))}>{item.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {item.dueIn}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* My Transitions */}
        <Card className="lg:col-span-3 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">My Transitions</CardTitle>
              <Link href="/transitions" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {activeTransitions.slice(0, 6).map(t => (
              <Link key={t.id} href={`/transitions/${t.id}`} className="flex items-center gap-3 rounded-lg p-3 row-hover group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium truncate">{t.account?.name}</p>
                    <Badge variant="outline" className={cn('text-[9px] shrink-0', getSegmentColor(t.account?.segment || ''))}>{formatSegment(t.account?.segment || '')}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t.from_owner?.full_name} → {t.to_owner?.full_name} · {t.account?.arr ? formatCurrency(t.account.arr) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn('text-[9px]', getStatusColor(t.status))}>{formatStatus(t.status)}</Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Accounts */}
      {lowHealthAccounts.length > 0 && (
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Accounts Needing Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {lowHealthAccounts.slice(0, 6).map(a => (
                <Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center gap-3 rounded-lg border p-3 row-hover group">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold shrink-0', getHealthBg(a.health_score))}>
                    {a.health_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate group-hover:text-foreground">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(a.arr)} · {formatSegment(a.segment)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

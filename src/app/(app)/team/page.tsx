'use client'

import { demoTeamMembers, demoAccounts, demoTransitions } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRole } from '@/lib/role-context'
import { formatCurrency, getInitials, cn } from '@/lib/utils'

export default function TeamPage() {
  const { role } = useRole()

  const teamData = demoTeamMembers.map(member => {
    const accounts = demoAccounts.filter(a => a.current_owner_id === member.id)
    const activeTransitions = demoTransitions.filter(t =>
      (t.to_owner_id === member.id || t.from_owner_id === member.id) &&
      !['completed', 'cancelled'].includes(t.status)
    )
    const completedTransitions = demoTransitions.filter(t =>
      t.to_owner_id === member.id && t.status === 'completed'
    )
    const totalArr = accounts.reduce((s, a) => s + a.arr, 0)
    const avgHealth = accounts.length > 0
      ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / accounts.length)
      : 0
    const utilization = member.capacity > 0 ? Math.round((accounts.length / member.capacity) * 100) : 0

    return {
      ...member,
      accountCount: accounts.length,
      activeTransitions: activeTransitions.length,
      completedTransitions: completedTransitions.length,
      totalArr,
      avgHealth,
      utilization,
    }
  })

  const activeReps = demoTeamMembers.filter(m => m.role === 'rep').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {role === 'am_leadership' ? 'Team Performance' : 'Team'}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {demoTeamMembers.length} members
          <span className="mx-1.5 text-border">·</span>
          {activeReps} active reps
        </p>
      </div>

      {/* Team Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamData.map(member => (
          <Card key={member.id} className="overflow-hidden border-border/60 transition-shadow hover:shadow-sm">
            <CardContent className="p-0">
              {/* Capacity bar */}
              <div className="h-[2px] w-full bg-muted">
                <div
                  className={cn(
                    'h-full transition-all duration-700',
                    member.utilization > 90 ? 'bg-red-500' :
                    member.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(member.utilization, 100)}%` }}
                />
              </div>

              <div className="p-5">
                {/* Member header */}
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                    <AvatarFallback className="text-[11px] font-semibold bg-muted text-muted-foreground">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold tracking-tight text-foreground truncate">
                      {member.full_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium px-1.5 py-0 capitalize text-muted-foreground border-border/60"
                      >
                        {member.role}
                      </Badge>
                      {member.specialties.slice(0, 2).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-0 rounded-lg border border-border/50 overflow-hidden">
                  <div className="px-3 py-2.5 text-center bg-muted/20">
                    <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                      {member.accountCount}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Accounts
                    </p>
                  </div>
                  <div className="px-3 py-2.5 text-center bg-muted/20 border-x border-border/50">
                    <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                      {formatCurrency(member.totalArr)}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      ARR
                    </p>
                  </div>
                  <div className="px-3 py-2.5 text-center bg-muted/20">
                    <p className={cn(
                      'text-[16px] font-semibold tabular-nums tracking-tight',
                      member.avgHealth >= 70 ? 'text-emerald-600' :
                      member.avgHealth >= 50 ? 'text-amber-600' : 'text-red-500'
                    )}>
                      {member.avgHealth}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Health
                    </p>
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className={cn(
                      'font-semibold tabular-nums',
                      member.utilization > 90 ? 'text-red-600' :
                      member.utilization > 70 ? 'text-amber-600' : 'text-emerald-600'
                    )}>
                      {member.utilization}%
                    </span>
                    <span className="text-muted-foreground">capacity</span>
                    {member.capacity > 0 && (
                      <span className="text-muted-foreground/50 ml-0.5">
                        ({member.accountCount}/{member.capacity})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    {member.activeTransitions > 0 && (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-blue-600 tabular-nums">
                          {member.activeTransitions}
                        </span>
                        {' '}active
                      </span>
                    )}
                    {member.completedTransitions > 0 && (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-emerald-600 tabular-nums">
                          {member.completedTransitions}
                        </span>
                        {' '}done
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

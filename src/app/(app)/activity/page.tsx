'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ArrowLeftRight,
  FileText,
  Mail,
  Calendar,
  StickyNote,
  Search,
  Activity,
  Users,
  Building2,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import {
  demoActivities,
  demoTransitions,
  demoAccounts,
  demoTeamMembers,
} from '@/lib/demo-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityType = 'status_change' | 'brief_generated' | 'email_sent' | 'meeting_booked' | 'note_added'
type DateRange = 'today' | 'week' | 'month' | 'all'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<ActivityType, {
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  badgeCls: string
}> = {
  status_change: {
    label: 'Status Change',
    icon: ArrowLeftRight,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  brief_generated: {
    label: 'Brief Generated',
    icon: FileText,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    badgeCls: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  email_sent: {
    label: 'Email Sent',
    icon: Mail,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  meeting_booked: {
    label: 'Meeting Booked',
    icon: Calendar,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  note_added: {
    label: 'Note Added',
    icon: StickyNote,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

// Enrich activities with joined data
const enrichedActivities = demoActivities.map((a) => {
  const transition = demoTransitions.find((t) => t.id === a.transition_id)
  const account = transition ? demoAccounts.find((acc) => acc.id === transition.account_id) : null
  const user = demoTeamMembers.find((u) => u.id === a.created_by)
  return { ...a, transition, account, user }
})

// Date grouping
function getDateGroup(dateStr: string): string {
  const now = new Date('2026-02-26') // demo "today"
  const d = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  return 'Earlier'
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier']

function isInRange(dateStr: string, range: DateRange): boolean {
  const now = new Date('2026-02-26')
  const d = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (range === 'today') return diffDays === 0
  if (range === 'week') return diffDays < 7
  if (range === 'month') return diffDays < 30
  return true
}

// ---------------------------------------------------------------------------
// Mini bar chart component for sidebar
// ---------------------------------------------------------------------------

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [search, setSearch] = useState('')

  // Filtered list
  const filtered = useMemo(() => {
    return enrichedActivities.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (!isInRange(a.created_at, dateRange)) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const accountName = a.account?.name?.toLowerCase() ?? ''
        const desc = a.description.toLowerCase()
        if (!accountName.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [typeFilter, dateRange, search])

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {}
    filtered.forEach((a) => {
      const group = getDateGroup(a.created_at)
      if (!map[group]) map[group] = []
      map[group].push(a)
    })
    return map
  }, [filtered])

  const orderedGroups = DATE_GROUP_ORDER.filter((g) => grouped[g]?.length)

  // --- Stats ---
  const totalCount = enrichedActivities.length

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    enrichedActivities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return counts
  }, [])

  const maxTypeCount = Math.max(...Object.values(typeCounts))

  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    enrichedActivities.forEach((a) => {
      const name = a.user?.full_name ?? 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    return counts
  }, [])

  const mostActiveUser = Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0]

  const accountCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    enrichedActivities.forEach((a) => {
      const name = a.account?.name ?? 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    return counts
  }, [])

  const mostActiveAccount = Object.entries(accountCounts).sort((a, b) => b[1] - a[1])[0]

  const typeFilterOptions: Array<{ value: ActivityType | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'status_change', label: 'Status Change' },
    { value: 'brief_generated', label: 'Brief Generated' },
    { value: 'email_sent', label: 'Email Sent' },
    { value: 'meeting_booked', label: 'Meeting Booked' },
    { value: 'note_added', label: 'Note Added' },
  ]

  const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ]

  const TYPE_BAR_COLORS: Record<string, string> = {
    status_change: 'bg-violet-400',
    brief_generated: 'bg-sky-400',
    email_sent: 'bg-emerald-400',
    meeting_booked: 'bg-amber-400',
    note_added: 'bg-rose-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Organization-wide audit trail</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            {typeFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border transition-all duration-150 press-scale',
                  typeFilter === opt.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {opt.value !== 'all' && (() => {
                  const cfg = TYPE_CONFIG[opt.value as ActivityType]
                  const Icon = cfg.icon
                  return <Icon className="h-3 w-3" />
                })()}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Date range + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
                    dateRange === opt.value
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-[12px] w-56"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main layout: feed + sidebar */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Activity feed */}
        <div className="lg:col-span-3 space-y-6">
          {orderedGroups.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activities match your filters</p>
              </CardContent>
            </Card>
          )}

          {orderedGroups.map((group) => (
            <div key={group}>
              {/* Date group label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {grouped[group].length} {grouped[group].length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Activity rows */}
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {grouped[group].map((activity, idx) => {
                    const cfg = TYPE_CONFIG[activity.type as ActivityType]
                    const Icon = cfg.icon

                    return (
                      <div
                        key={activity.id}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 row-hover group cursor-default',
                          idx % 2 === 1 && 'bg-muted/20'
                        )}
                      >
                        {/* Type icon */}
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                          cfg.iconBg
                        )}>
                          <Icon className={cn('h-3.5 w-3.5', cfg.iconColor)} />
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground leading-snug">
                            {activity.description}
                          </p>
                          {activity.user && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              by {activity.user.full_name}
                            </p>
                          )}
                        </div>

                        {/* Account badge */}
                        {activity.account && (
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0 max-w-[160px] truncate font-normal"
                          >
                            <Building2 className="h-2.5 w-2.5 mr-1 shrink-0" />
                            <span className="truncate">{activity.account.name}</span>
                          </Badge>
                        )}

                        {/* Type badge */}
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] shrink-0 hidden sm:inline-flex', cfg.badgeCls)}
                        >
                          {cfg.label}
                        </Badge>

                        {/* Time */}
                        <div className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground tabular-nums w-20 justify-end">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(activity.created_at)}
                        </div>

                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Sticky sidebar stats */}
        <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          {/* Total count */}
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Activities</span>
                <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
              <p className="text-3xl font-bold tracking-tight tabular-nums">{totalCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {filtered.length !== totalCount && (
                  <span className="text-emerald-600 font-medium">{filtered.length} shown</span>
                )}
                {filtered.length === totalCount && 'All time'}
              </p>
            </CardContent>
          </Card>

          {/* Breakdown by type */}
          <Card className="card-hover">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[12px] font-semibold">By Type</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              {(Object.keys(TYPE_CONFIG) as ActivityType[]).map((type) => {
                const cfg = TYPE_CONFIG[type]
                const Icon = cfg.icon
                const count = typeCounts[type] || 0
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3 w-3', cfg.iconColor)} />
                        <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums">{count}</span>
                    </div>
                    <MiniBar
                      value={count}
                      max={maxTypeCount}
                      color={TYPE_BAR_COLORS[type]}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Most active team member */}
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Most Active Rep
                </span>
              </div>
              {mostActiveUser && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {mostActiveUser[0].split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold leading-tight">{mostActiveUser[0]}</p>
                    <p className="text-[10px] text-muted-foreground">{mostActiveUser[1]} activities</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most active account */}
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Most Active Account
                </span>
              </div>
              {mostActiveAccount && (
                <div>
                  <p className="text-[12px] font-semibold leading-tight truncate">{mostActiveAccount[0]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{mostActiveAccount[1]} activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

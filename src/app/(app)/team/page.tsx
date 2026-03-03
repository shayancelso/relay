'use client'

import { useState, useMemo } from 'react'
import { demoTeamMembers, demoAccounts, demoTransitions } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRole } from '@/lib/role-context'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Users,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Scale,
  CheckCircle2,
  Flame,
  UserX,
} from 'lucide-react'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

// ---------------------------------------------------------------------------
// Ramp + equity constants
// ---------------------------------------------------------------------------

// Current demo date — aligns with project date
const TODAY = new Date('2026-03-02')
const RAMP_MONTHS = 12
const RAMP_RECENTLY_COMPLETE_MONTHS = 3 // window after ramp ends to show "Just Ramped"
const ARR_EQUITY_TOLERANCE   = 0.20  // ±20% of team mean
const ACCOUNT_EQUITY_TOLERANCE = 0.15 // ±15% of team mean

type SortKey = 'arr' | 'accounts' | 'health' | 'utilization' | 'ramp' | 'name'
type SortDir = 'asc' | 'desc'
type RoleFilter = 'all' | 'rep' | 'manager' | 'admin'

function getRampInfo(createdAt: string, capacity: number, role: string) {
  const defaultOut = { isOnRamp: false, isRecentlyRamped: false, rampProgress: 100, monthsIn: 0 }
  // Only reps with active capacity have a ramp period
  if (role !== 'rep' || capacity === 0) return defaultOut

  const msElapsed = TODAY.getTime() - new Date(createdAt).getTime()
  const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 30.44)
  const progress = Math.min((monthsElapsed / RAMP_MONTHS) * 100, 100)
  const isOnRamp = monthsElapsed < RAMP_MONTHS
  const isRecentlyRamped =
    !isOnRamp && monthsElapsed < RAMP_MONTHS + RAMP_RECENTLY_COMPLETE_MONTHS

  return {
    isOnRamp,
    isRecentlyRamped,
    rampProgress: Math.round(progress),
    monthsIn: Math.max(1, Math.floor(monthsElapsed)), // show at least "Month 1"
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const { role } = useRole()
  const { isTrialMode, enterDemoMode } = useTrialMode()

  const [sortKey,          setSortKey]          = useState<SortKey>('arr')
  const [sortDir,          setSortDir]          = useState<SortDir>('desc')
  const [filterRole,       setFilterRole]       = useState<RoleFilter>('all')
  const [showOnRampOnly,   setShowOnRampOnly]   = useState(false)
  const [showFlaggedOnly,  setShowFlaggedOnly]  = useState(false)

  // ── Compute enriched per-member data ──────────────────────────────────────
  const teamData = useMemo(() => {
    return demoTeamMembers.map(member => {
      const accounts = demoAccounts.filter(a => a.current_owner_id === member.id)
      const activeTransitions = demoTransitions.filter(t =>
        (t.to_owner_id === member.id || t.from_owner_id === member.id) &&
        !['completed', 'cancelled'].includes(t.status)
      )
      const completedTransitions = demoTransitions.filter(t =>
        t.to_owner_id === member.id && t.status === 'completed'
      )
      const totalArr  = accounts.reduce((s, a) => s + a.arr, 0)
      const avgHealth = accounts.length > 0
        ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / accounts.length)
        : 0
      const utilization = member.capacity > 0
        ? Math.round((accounts.length / member.capacity) * 100)
        : 0
      const isDeparted = member.role === 'rep' && member.capacity === 0
      const ramp = getRampInfo(member.created_at, member.capacity, member.role)

      return {
        ...member,
        accountCount: accounts.length,
        activeTransitions: activeTransitions.length,
        completedTransitions: completedTransitions.length,
        totalArr,
        avgHealth,
        utilization,
        isDeparted,
        ...ramp,
        // equity fields filled in below after mean is computed
        arrDeviation:     0,
        accountDeviation: 0,
        isArrFlagged:     false,
        isAccountsFlagged:false,
        hasEquityFlag:    false,
      }
    })
  }, [])

  // ── Equity baseline (active reps only) ────────────────────────────────────
  const { enrichedData, meanArr, meanAccounts, onRampCount, flaggedCount } = useMemo(() => {
    const activeReps = teamData.filter(m => m.role === 'rep' && m.capacity > 0 && m.accountCount > 0)
    const mArr      = activeReps.length > 0 ? activeReps.reduce((s, m) => s + m.totalArr, 0)     / activeReps.length : 0
    const mAccounts = activeReps.length > 0 ? activeReps.reduce((s, m) => s + m.accountCount, 0) / activeReps.length : 0

    const enriched = teamData.map(m => {
      if (m.role !== 'rep' || m.capacity === 0) return m
      const arrDev     = mArr      > 0 ? (m.totalArr     - mArr)      / mArr      : 0
      const accountDev = mAccounts > 0 ? (m.accountCount - mAccounts) / mAccounts : 0
      const isArrFlagged     = Math.abs(arrDev)     > ARR_EQUITY_TOLERANCE
      const isAccountsFlagged = Math.abs(accountDev) > ACCOUNT_EQUITY_TOLERANCE
      return {
        ...m,
        arrDeviation:      Math.round(arrDev     * 100),
        accountDeviation:  Math.round(accountDev * 100),
        isArrFlagged,
        isAccountsFlagged,
        hasEquityFlag: isArrFlagged || isAccountsFlagged,
      }
    })

    return {
      enrichedData: enriched,
      meanArr:      Math.round(mArr),
      meanAccounts: Math.round(mAccounts),
      onRampCount:  enriched.filter(m => m.isOnRamp).length,
      flaggedCount: enriched.filter(m => m.hasEquityFlag).length,
    }
  }, [teamData])

  // ── Sort + filter ──────────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    return enrichedData
      .filter(m => {
        if (filterRole !== 'all' && m.role !== filterRole) return false
        if (showOnRampOnly  && !m.isOnRamp)      return false
        if (showFlaggedOnly && !m.hasEquityFlag)  return false
        return true
      })
      .sort((a, b) => {
        if (sortKey === 'name') {
          return sortDir === 'asc'
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name)
        }
        const vals: Record<SortKey, [number, number]> = {
          arr:         [a.totalArr,     b.totalArr],
          accounts:    [a.accountCount, b.accountCount],
          health:      [a.avgHealth,    b.avgHealth],
          utilization: [a.utilization,  b.utilization],
          ramp:        [a.rampProgress, b.rampProgress],
          name:        [0, 0],
        }
        const [av, bv] = vals[sortKey]
        return sortDir === 'asc' ? av - bv : bv - av
      })
  }, [enrichedData, sortKey, sortDir, filterRole, showOnRampOnly, showFlaggedOnly])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const activeRepsTotal = demoTeamMembers.filter(m => m.role === 'rep').length

  if (isTrialMode) {
    return (
      <TrialPageEmpty
        icon={Users}
        title="Your Team"
        description="Invite team members to collaborate on account transitions."
        ctaLabel="Manage team"
        ctaHref="/settings"
        onExploreDemo={enterDemoMode}
      />
    )
  }

  const SortChevron = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === 'desc'
        ? <ChevronDown className="w-3 h-3 ml-0.5" />
        : <ChevronUp   className="w-3 h-3 ml-0.5" />
    ) : null

  const SORT_OPTS: { key: SortKey; label: string }[] = [
    { key: 'arr',         label: 'ARR' },
    { key: 'accounts',    label: 'Accounts' },
    { key: 'health',      label: 'Health' },
    { key: 'utilization', label: 'Utilization' },
    { key: 'ramp',        label: 'Ramp' },
    { key: 'name',        label: 'Name' },
  ]

  const ROLE_OPTS: { key: RoleFilter; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'rep',     label: 'Reps' },
    { key: 'manager', label: 'Managers' },
    { key: 'admin',   label: 'Admins' },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              {role === 'am_leadership' ? 'Team Performance' : 'Team'}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {demoTeamMembers.length} members
              <span className="mx-1.5 text-border">·</span>
              {activeRepsTotal} active reps
              {onRampCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-amber-600 font-medium">{onRampCount} ramping</span>
                </>
              )}
              {flaggedCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-amber-600 font-medium">{flaggedCount} equity {flaggedCount === 1 ? 'flag' : 'flags'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Team overview bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-5 px-4 py-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="w-3 h-3 shrink-0" />
            <span>Rep mean ARR:</span>
            <span className="font-semibold text-foreground">{formatCurrency(meanArr)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3 h-3 shrink-0" />
            <span>Mean accounts:</span>
            <span className="font-semibold text-foreground">{meanAccounts}</span>
          </div>
          {onRampCount > 0 && (
            <div className="flex items-center gap-1 text-amber-700">
              <Flame className="w-3 h-3" />
              <span className="font-medium">{onRampCount} on {RAMP_MONTHS}-month ramp</span>
            </div>
          )}
          {flaggedCount > 0 ? (
            <div className="flex items-center gap-1 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">{flaggedCount} outside equity tolerance</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium">All books balanced</span>
            </div>
          )}
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Sort */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {SORT_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  'flex items-center px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  sortKey === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
                <SortChevron k={key} />
              </button>
            ))}
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {ROLE_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterRole(key)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  filterRole === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status toggles */}
          <button
            onClick={() => setShowOnRampOnly(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              showOnRampOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Flame className="w-3 h-3" />
            On Ramp
          </button>

          <button
            onClick={() => setShowFlaggedOnly(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              showFlaggedOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            Equity Flags
          </button>

          {/* Result count */}
          {displayData.length !== enrichedData.length && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {displayData.length} of {enrichedData.length} shown
            </span>
          )}
        </div>

        {/* ── Team Cards ──────────────────────────────────────────────────── */}
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">No team members match these filters</p>
            <button
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => {
                setFilterRole('all')
                setShowOnRampOnly(false)
                setShowFlaggedOnly(false)
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayData.map(member => (
              <Card
                key={member.id}
                className={cn(
                  'overflow-hidden border-border/60 transition-shadow hover:shadow-sm',
                  member.isDeparted && 'opacity-50 grayscale-[40%]'
                )}
              >
                <CardContent className="p-0">
                  {/* Top bar — ramp progress (amber) or capacity utilization */}
                  <div className="h-[2px] w-full bg-muted">
                    {member.isOnRamp ? (
                      <div
                        className="h-full bg-amber-400 transition-all duration-700"
                        style={{ width: `${member.rampProgress}%` }}
                      />
                    ) : (
                      <div
                        className={cn(
                          'h-full transition-all duration-700',
                          member.utilization > 90 ? 'bg-red-500' :
                          member.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(member.utilization, 100)}%` }}
                      />
                    )}
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
                          {member.isDeparted && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-stone-100 text-stone-500 border-stone-200">
                              <UserX className="w-2.5 h-2.5 mr-0.5" />
                              Departed
                            </Badge>
                          )}
                          {member.isOnRamp && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                              <Flame className="w-2.5 h-2.5 mr-0.5" />
                              Ramping
                            </Badge>
                          )}
                          {member.isRecentlyRamped && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                              Just Ramped
                            </Badge>
                          )}
                          {member.hasEquityFlag && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              Flagged
                            </Badge>
                          )}
                          {member.specialties.slice(0, 2).map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ramp progress bar */}
                    {member.isOnRamp && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-700"
                            style={{ width: `${member.rampProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-amber-700 shrink-0 tabular-nums">
                          Month {member.monthsIn} of {RAMP_MONTHS}
                        </span>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="mt-4 grid grid-cols-3 gap-0 rounded-lg border border-border/50 overflow-hidden">

                      {/* Accounts */}
                      <div className="px-3 py-2.5 text-center bg-muted/20 relative">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                            {member.accountCount}
                          </p>
                          {member.isAccountsFlagged && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3 h-3 text-amber-500 cursor-default shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {member.accountDeviation > 0 ? '+' : ''}{member.accountDeviation}% vs team mean ({meanAccounts} accounts)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          Accounts
                        </p>
                      </div>

                      {/* ARR */}
                      <div className="px-3 py-2.5 text-center bg-muted/20 border-x border-border/50">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                            {formatCurrency(member.totalArr)}
                          </p>
                          {member.isArrFlagged && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3 h-3 text-amber-500 cursor-default shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {member.arrDeviation > 0 ? '+' : ''}{member.arrDeviation}% vs team mean ({formatCurrency(meanArr)})
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          ARR
                        </p>
                      </div>

                      {/* Health */}
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
                        {member.capacity > 0 ? (
                          <>
                            <span className={cn(
                              'font-semibold tabular-nums',
                              member.utilization > 90 ? 'text-red-600' :
                              member.utilization > 70 ? 'text-amber-600' : 'text-emerald-600'
                            )}>
                              {member.utilization}%
                            </span>
                            <span className="text-muted-foreground">capacity</span>
                            <span className="text-muted-foreground/50 ml-0.5">
                              ({member.accountCount}/{member.capacity})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60 text-[10px]">No capacity set</span>
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
        )}
      </div>
    </TooltipProvider>
  )
}

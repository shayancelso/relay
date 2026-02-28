'use client'

import { useState, useMemo } from 'react'
import { demoTransitions, demoAccounts, demoTeamMembers } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useRole } from '@/lib/role-context'
import { formatCurrency, formatStatus, getStatusColor, getPriorityColor, formatSegment, getSegmentColor, cn } from '@/lib/utils'
import { Search, Plus, ArrowRight, Target, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContextPanel } from '@/components/transitions/context-panel'
import { EmptyState } from '@/components/ui/skeletons'
import { DemoBanner } from '@/components/tour/demo-banner'

const STATUSES = ['all', 'draft', 'pending_approval', 'approved', 'intro_sent', 'meeting_booked', 'in_progress', 'completed', 'stalled'] as const

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'completed' ? 'bg-emerald-500' :
    status === 'stalled' ? 'bg-red-500' :
    status === 'in_progress' ? 'bg-blue-500' :
    status === 'meeting_booked' ? 'bg-violet-500' :
    status === 'intro_sent' ? 'bg-indigo-400' :
    status === 'approved' ? 'bg-sky-400' :
    status === 'pending_approval' ? 'bg-amber-400' :
    'bg-muted-foreground/30'

  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {(status === 'in_progress' || status === 'pending_approval') && (
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-50', color)} />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', color)} />
    </span>
  )
}

export default function TransitionsPage() {
  const { role } = useRole()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)

  const baseTransitions = role === 'rep'
    ? demoTransitions.filter(t => t.to_owner_id === 'user-3' || t.from_owner_id === 'user-3')
    : demoTransitions

  const enriched = useMemo(() => {
    return baseTransitions.map(t => ({
      ...t,
      account: demoAccounts.find(a => a.id === t.account_id),
      from_owner: demoTeamMembers.find(m => m.id === t.from_owner_id),
      to_owner: demoTeamMembers.find(m => m.id === t.to_owner_id),
    }))
  }, [baseTransitions])

  const filtered = useMemo(() => {
    let result = enriched
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.account?.name.toLowerCase().includes(q) ||
        t.from_owner?.full_name.toLowerCase().includes(q) ||
        t.to_owner?.full_name.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter)
    }
    return result
  }, [enriched, search, statusFilter])

  const statusCounts = STATUSES.filter(s => s !== 'all').reduce((acc, s) => {
    acc[s] = baseTransitions.filter(t => t.status === s).length
    return acc
  }, {} as Record<string, number>)

  const activeCount = baseTransitions.filter(t => !['completed', 'cancelled'].includes(t.status)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {role === 'rep' ? 'My Transitions' : 'Transitions'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {baseTransitions.length} total
            <span className="mx-1.5 text-border">·</span>
            <span className="text-foreground font-medium">{activeCount}</span> active
          </p>
        </div>
        {role !== 'rep' && (
          <Link
            href="/transitions/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            New Transition
          </Link>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
            statusFilter === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
          )}
        >
          All
          <span className={cn('ml-1.5', statusFilter === 'all' ? 'opacity-70' : 'opacity-50')}>
            {baseTransitions.length}
          </span>
        </button>
        {STATUSES.filter(s => s !== 'all' && statusCounts[s] > 0).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
              statusFilter === s
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
            )}
          >
            {formatStatus(s)}
            <span className={cn('ml-1.5', statusFilter === s ? 'opacity-70' : 'opacity-50')}>
              {statusCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search transitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-[12px] bg-card border-border/60 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>
        {filtered.length !== baseTransitions.length && (
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Transition List */}
      {filtered.length > 0 ? (
        <Card className="overflow-hidden border-border/60">
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTransition(t.id)}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30 cursor-pointer"
                >
                  {/* Status dot */}
                  <StatusDot status={t.status} />

                  {/* Account info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground truncate group-hover:text-foreground/80 transition-colors">
                        {t.account?.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-medium px-1.5 py-0 shrink-0', getSegmentColor(t.account?.segment || ''))}
                      >
                        {formatSegment(t.account?.segment || '')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>{t.from_owner?.full_name || 'Unassigned'}</span>
                      <ArrowRight className="h-3 w-3 opacity-30 shrink-0" />
                      <span>{t.to_owner?.full_name || 'Unassigned'}</span>
                    </p>
                  </div>

                  {/* ARR */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[13px] font-medium tabular-nums text-foreground">
                      {t.account?.arr ? formatCurrency(t.account.arr) : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">ARR</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-medium px-1.5 py-0 capitalize', getPriorityColor(t.priority))}
                    >
                      {t.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-medium px-1.5 py-0', getStatusColor(t.status))}
                    >
                      {formatStatus(t.status)}
                    </Badge>
                  </div>

                  <Link
                    href={`/transitions/${t.id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/20 hover:bg-muted hover:text-muted-foreground transition-colors shrink-0"
                    title="Open full page"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/60">
          <CardContent className="p-0">
            {(search || statusFilter !== 'all') ? (
              <EmptyState
                icon={Target}
                title="No transitions found"
                description="Try adjusting your search or filters to find what you're looking for."
                action="Clear filters"
                onAction={() => { setSearch(''); setStatusFilter('all') }}
              />
            ) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="No transitions yet"
                description="Get started by creating your first account transition."
                action={role !== 'rep' ? 'New Transition' : undefined}
                onAction={role !== 'rep' ? () => router.push('/transitions/new') : undefined}
              />
            )}
          </CardContent>
        </Card>
      )}

      <ContextPanel
        transition={selectedTransition ? demoTransitions.find(t => t.id === selectedTransition) || null : null}
        onClose={() => setSelectedTransition(null)}
      />

      <DemoBanner />
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { demoAccounts, demoTeamMembers } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useRole } from '@/lib/role-context'
import { formatCurrency, getSegmentColor, formatSegment, getHealthBg, cn } from '@/lib/utils'
import { Search, Upload, X, Download, UserCog, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const SEGMENTS = ['all', 'commercial', 'corporate', 'enterprise', 'fins', 'international'] as const

export default function AccountsPage() {
  const { role } = useRole()
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'arr' | 'health'>('arr')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const baseAccounts = role === 'rep'
    ? demoAccounts.filter(a => a.current_owner_id === 'user-3')
    : demoAccounts

  const filtered = useMemo(() => {
    let result = baseAccounts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.industry?.toLowerCase().includes(q))
    }
    if (segment !== 'all') {
      result = result.filter(a => a.segment === segment)
    }
    result = [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
      if (sortBy === 'arr') return (a.arr - b.arr) * dir
      return (a.health_score - b.health_score) * dir
    })
    return result
  }, [baseAccounts, search, segment, sortBy, sortDir])

  const displayedAccounts = filtered.slice(0, 50)

  const selectedArr = useMemo(
    () => demoAccounts.filter(a => selectedIds.has(a.id)).reduce((s, a) => s + a.arr, 0),
    [selectedIds],
  )

  const allDisplayedSelected =
    displayedAccounts.length > 0 &&
    displayedAccounts.every(a => selectedIds.has(a.id))

  const someDisplayedSelected = displayedAccounts.some(a => selectedIds.has(a.id))

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) displayedAccounts.forEach(a => next.add(a.id))
      else displayedAccounts.forEach(a => next.delete(a.id))
      return next
    })
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const segmentSummary = SEGMENTS.filter(s => s !== 'all').map(s => ({
    segment: s,
    count: baseAccounts.filter(a => a.segment === s).length,
    arr: baseAccounts.filter(a => a.segment === s).reduce((sum, a) => sum + a.arr, 0),
  }))

  const totalArr = baseAccounts.reduce((s, a) => s + a.arr, 0)

  const selectedCount = selectedIds.size
  const createTransitionsHref = `/transitions/new?accounts=${Array.from(selectedIds).join(',')}`

  return (
    <div className={cn('space-y-6', selectedCount > 0 ? 'pb-24' : '')}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {role === 'rep' ? 'My Accounts' : 'Accounts'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {baseAccounts.length.toLocaleString()} accounts
            <span className="mx-1.5 text-border">·</span>
            {formatCurrency(totalArr)} total ARR
          </p>
        </div>
        {role === 'revops_admin' && (
          <Link
            href="/accounts/upload"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Link>
        )}
      </div>

      {/* Segment Filter Chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSegment('all')}
          className={cn(
            'rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all',
            segment === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
          )}
        >
          All
          <span className={cn('ml-1.5', segment === 'all' ? 'opacity-70' : 'opacity-50')}>
            {baseAccounts.length.toLocaleString()}
          </span>
        </button>
        {segmentSummary.map(s => (
          <button
            key={s.segment}
            onClick={() => setSegment(s.segment === segment ? 'all' : s.segment)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all',
              segment === s.segment
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
            )}
          >
            {formatSegment(s.segment)}
            <span className={cn('ml-1.5', segment === s.segment ? 'opacity-70' : 'opacity-50')}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-[12px] bg-card border-border/60 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
          />
        </div>

        <div className="flex items-center gap-0.5 ml-auto">
          <span className="text-[11px] text-muted-foreground mr-2">Sort by</span>
          {(['name', 'arr', 'health'] as const).map(field => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                sortBy === field
                  ? 'bg-foreground/8 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {field === 'arr' ? 'ARR' : field === 'health' ? 'Health' : 'Name'}
              {sortBy === field && (
                <span className="ml-1 opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-muted-foreground/60 tabular-nums">
          {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Selected count banner */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2">
          <span className="text-[12px] font-medium text-emerald-800">
            {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <span className="text-emerald-600/50">·</span>
          <span className="text-[12px] font-medium tabular-nums text-emerald-700">
            {formatCurrency(selectedArr)} ARR
          </span>
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-[11px] text-emerald-700/70 transition-colors hover:text-emerald-900"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  {/* Checkbox header */}
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={
                        allDisplayedSelected
                          ? true
                          : someDisplayedSelected
                          ? 'indeterminate'
                          : false
                      }
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                      aria-label="Select all accounts"
                    />
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-4 py-3">
                    Account
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    Segment
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    Industry
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    ARR
                  </th>
                  <th className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    Health
                  </th>
                  <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    Employees
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                    Owner
                  </th>
                  <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3 pr-4">
                    Country
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayedAccounts.map((account) => {
                  const owner = demoTeamMembers.find(m => m.id === account.current_owner_id)
                  const isSelected = selectedIds.has(account.id)
                  return (
                    <tr
                      key={account.id}
                      className={cn(
                        'group transition-colors hover:bg-muted/30',
                        isSelected && 'bg-emerald-50/60 hover:bg-emerald-50',
                      )}
                    >
                      <td className="w-10 px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleRow(account.id, !!checked)}
                          aria-label={`Select ${account.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="text-[13px] font-medium text-foreground hover:text-foreground/70 transition-colors"
                        >
                          {account.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-medium px-1.5 py-0', getSegmentColor(account.segment))}
                        >
                          {formatSegment(account.segment)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">
                        {account.industry || '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-[13px] font-medium tabular-nums text-foreground">
                        {formatCurrency(account.arr)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center justify-center h-6 w-8 rounded text-[11px] font-semibold tabular-nums',
                          getHealthBg(account.health_score)
                        )}>
                          {account.health_score}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] text-muted-foreground tabular-nums">
                        {account.employee_count.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-[12px] text-muted-foreground">
                        {owner?.full_name || '—'}
                      </td>
                      <td className="px-3 py-3 pr-4 text-[12px] text-muted-foreground">
                        {account.country || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 50 && (
            <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Showing 50 of {filtered.length.toLocaleString()} accounts
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                Refine your search to see more
              </span>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-[13px] text-muted-foreground">No accounts match your filters</p>
              <button
                onClick={() => { setSearch(''); setSegment('all') }}
                className="mt-2 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sticky Bulk Action Bar ──────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-white/10 bg-gray-900 px-6 py-4 shadow-2xl"
          style={{ animation: 'relay-slide-up 200ms cubic-bezier(0.16,1,0.3,1)' }}
        >
          <style>{`
            @keyframes relay-slide-up {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>

          {/* Left: selection summary */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <span className="text-white/30">·</span>
            <span className="text-sm font-medium tabular-nums text-emerald-400">
              {formatCurrency(selectedArr)} ARR
            </span>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={createTransitionsHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Create Transitions
            </Link>

            <button
              onClick={() =>
                toast.success(`Exporting ${selectedCount} accounts`, {
                  description: 'CSV download will begin shortly.',
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={() =>
                toast.success('Assign owner', {
                  description: `Owner assignment dialog would open for ${selectedCount} account${selectedCount !== 1 ? 's' : ''}.`,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign Owner
            </button>

            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

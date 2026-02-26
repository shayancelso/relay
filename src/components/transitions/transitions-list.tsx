'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, formatStatus, getStatusColor, getPriorityColor } from '@/lib/utils'
import { Search, ArrowRight } from 'lucide-react'

interface TransitionItem {
  id: string
  status: string
  reason: string
  priority: string
  due_date: string | null
  created_at: string
  account?: { id: string; name: string; arr: number; health_score: number; segment: string } | null
  from_owner?: { id: string; full_name: string } | null
  to_owner?: { id: string; full_name: string } | null
}

export function TransitionsList({ transitions }: { transitions: TransitionItem[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let result = transitions

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        t =>
          t.account?.name.toLowerCase().includes(q) ||
          t.from_owner?.full_name.toLowerCase().includes(q) ||
          t.to_owner?.full_name.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter)
    }

    return result
  }, [transitions, search, statusFilter, priorityFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transitions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="intro_sent">Intro Sent</SelectItem>
            <SelectItem value="meeting_booked">Meeting Booked</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="stalled">Stalled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No transitions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <Link key={t.id} href={`/transitions/${t.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{t.account?.name || 'Unknown Account'}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {t.from_owner?.full_name || '?'}{' '}
                        <ArrowRight className="h-3 w-3" />{' '}
                        {t.to_owner?.full_name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.account?.arr != null && (
                      <span className="text-sm font-medium">{formatCurrency(t.account.arr)}</span>
                    )}
                    <Badge variant="outline" className={getPriorityColor(t.priority)}>
                      {t.priority}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(t.status)}>
                      {formatStatus(t.status)}
                    </Badge>
                    {t.due_date && (
                      <span className="text-xs text-muted-foreground">{formatDate(t.due_date)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{filtered.length} transitions</p>
    </div>
  )
}

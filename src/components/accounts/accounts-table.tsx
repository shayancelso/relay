'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, getHealthBg, getSegmentColor, formatSegment } from '@/lib/utils'
import { Search, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  industry: string | null
  arr: number
  health_score: number
  segment: string
  sub_segment?: string | null
  employee_count?: number
  country?: string | null
  geography: string | null
  renewal_date: string | null
  current_owner?: { id: string; full_name: string; email?: string } | null
}

export function AccountsTable({
  accounts,
  teamMembers,
}: {
  accounts: Account[]
  teamMembers: { id: string; full_name: string }[]
}) {
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'arr' | 'health_score' | 'name'>('arr')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let result = accounts

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.industry?.toLowerCase().includes(q) ||
          a.geography?.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q)
      )
    }

    if (segmentFilter !== 'all') {
      result = result.filter(a => a.segment === segmentFilter)
    }

    if (ownerFilter !== 'all') {
      result = result.filter(a => a.current_owner?.id === ownerFilter)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'arr') cmp = a.arr - b.arr
      else if (sortField === 'health_score') cmp = a.health_score - b.health_score
      else cmp = a.name.localeCompare(b.name)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [accounts, search, segmentFilter, ownerFilter, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
            <SelectItem value="fins">FINS</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {teamMembers.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                <span className="flex items-center gap-1">
                  Account <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('arr')}>
                <span className="flex items-center gap-1">
                  ARR <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('health_score')}>
                <span className="flex items-center gap-1">
                  Health <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Renewal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No accounts found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(account => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Link href={`/accounts/${account.id}`} className="font-medium hover:underline">
                      {account.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSegmentColor(account.segment)}>
                      {formatSegment(account.segment)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.industry || '—'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(account.arr)}</TableCell>
                  <TableCell>
                    <Badge className={getHealthBg(account.health_score)}>
                      {account.health_score}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.employee_count != null
                      ? account.employee_count.toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.country || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.current_owner?.full_name || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.renewal_date ? formatDate(account.renewal_date) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {accounts.length} accounts
      </p>
    </div>
  )
}

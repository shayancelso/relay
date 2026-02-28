'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Building2,
  ArrowLeftRight,
  Users,
  LayoutDashboard,
  Settings,
  Workflow,
  BarChart3,
  FileText,
  Clock,
  Plus,
  Upload,
  UserPlus,
} from 'lucide-react'
import { demoAccounts, demoTransitions, demoTeamMembers } from '@/lib/demo-data'
import { formatCurrency, formatSegment, formatStatus, getHealthBg, cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Recent item type stored in localStorage
// ---------------------------------------------------------------------------
interface RecentItem {
  type: 'account' | 'transition' | 'page'
  id: string
  label: string
  href: string
}

const RECENT_KEY = 'relay-cmd-recent'
const RECENT_MAX = 5

function loadRecent(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as RecentItem[]) : []
  } catch {
    return []
  }
}

function saveRecent(item: RecentItem) {
  const prev = loadRecent().filter((r) => r.href !== item.href)
  const next = [item, ...prev].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // silently fail
  }
}

// ---------------------------------------------------------------------------
// Category prefix detection
// ---------------------------------------------------------------------------
type Category = 'all' | 'account' | 'transition' | 'team'

function detectCategory(query: string): { prefix: Category; rest: string } {
  if (query.startsWith('account:')) return { prefix: 'account', rest: query.slice(8) }
  if (query.startsWith('transition:')) return { prefix: 'transition', rest: query.slice(11) }
  if (query.startsWith('team:')) return { prefix: 'team', rest: query.slice(5) }
  return { prefix: 'all', rest: query }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const router = useRouter()

  // Load recent on open
  useEffect(() => {
    if (open) {
      setRecentItems(loadRecent())
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback(
    (command: () => void, recentItem?: RecentItem) => {
      if (recentItem) saveRecent(recentItem)
      setOpen(false)
      command()
    },
    [],
  )

  // ---------------------------------------------------------------------------
  // Category filtering from search prefix
  // ---------------------------------------------------------------------------
  const { prefix: activeCategory, rest: filteredSearch } = detectCategory(search)

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const topAccounts = [...demoAccounts]
    .sort((a, b) => b.arr - a.arr)
    .slice(0, 8)

  const activeTransitions = demoTransitions
    .filter((t) => !['completed', 'cancelled'].includes(t.status))
    .slice(0, 6)
    .map((t) => ({
      ...t,
      account: demoAccounts.find((a) => a.id === t.account_id),
    }))

  const showRecent = recentItems.length > 0 && !search
  const showAccounts = activeCategory === 'all' || activeCategory === 'account'
  const showTransitions = activeCategory === 'all' || activeCategory === 'transition'
  const showTeam = activeCategory === 'all' || activeCategory === 'team'
  const showPages = activeCategory === 'all'
  const showActions = activeCategory === 'all'

  // Override CommandInput value with filteredSearch for matching purposes
  // We pass search to CommandInput and handle prefix stripping in display logic
  const displaySearch = filteredSearch.trim()
    ? filteredSearch
    : activeCategory !== 'all'
    ? ' ' // keep group visible
    : search

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSearch('')
      }}
    >
      <CommandInput
        placeholder={
          activeCategory !== 'all'
            ? `Search ${activeCategory}s...`
            : 'Search accounts, transitions, people, or type a command...'
        }
        value={search}
        onValueChange={setSearch}
      />

      {/* Category hint bar */}
      {activeCategory !== 'all' && (
        <div className="flex items-center gap-1.5 border-b px-3 py-1.5 text-[10px] text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium">
            {activeCategory}:
          </span>
          <span>filtering by {activeCategory}s — remove prefix to search all</span>
        </div>
      )}

      {!activeCategory && !search && (
        <div className="flex items-center gap-1 border-b px-3 py-1.5">
          {(['account', 'transition', 'team'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSearch(`${cat}:`)}
              className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {cat}:
            </button>
          ))}
          <span className="ml-1 text-[10px] text-muted-foreground/50">type a prefix to filter</span>
        </div>
      )}

      <CommandList className="max-h-[480px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* ── Recent ──────────────────────────────────────────────── */}
        {showRecent && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => {
                const Icon =
                  item.type === 'account'
                    ? Building2
                    : item.type === 'transition'
                    ? ArrowLeftRight
                    : LayoutDashboard
                return (
                  <CommandItem
                    key={`recent-${item.href}`}
                    onSelect={() =>
                      runCommand(() => router.push(item.href), item)
                    }
                  >
                    <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Pages ───────────────────────────────────────────────── */}
        {showPages && (
          <>
            <CommandGroup heading="Pages">
              {[
                { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
                { label: 'Accounts', icon: Building2, href: '/accounts' },
                { label: 'Transitions', icon: ArrowLeftRight, href: '/transitions' },
                { label: 'Team', icon: Users, href: '/team' },
                { label: 'Analytics', icon: BarChart3, href: '/analytics' },
                { label: 'Playbooks', icon: FileText, href: '/playbooks' },
                { label: 'Assignment Rules', icon: Workflow, href: '/rules' },
                { label: 'Settings', icon: Settings, href: '/settings' },
              ].map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() =>
                    runCommand(() => router.push(page.href), {
                      type: 'page',
                      id: page.href,
                      label: page.label,
                      href: page.href,
                    })
                  }
                >
                  <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Top Accounts ─────────────────────────────────────────── */}
        {showAccounts && (
          <>
            <CommandGroup heading="Top Accounts">
              {topAccounts.map((account) => (
                <CommandItem
                  key={account.id}
                  onSelect={() =>
                    runCommand(() => router.push(`/accounts/${account.id}`), {
                      type: 'account',
                      id: account.id,
                      label: account.name,
                      href: `/accounts/${account.id}`,
                    })
                  }
                >
                  <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{account.name}</span>
                  {/* Inline preview: ARR + health badge + segment */}
                  <span className="ml-2 flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatCurrency(account.arr)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0 text-[10px] font-semibold tabular-nums',
                        getHealthBg(account.health_score),
                      )}
                    >
                      {account.health_score}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatSegment(account.segment)}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Active Transitions ───────────────────────────────────── */}
        {showTransitions && (
          <>
            <CommandGroup heading="Active Transitions">
              {activeTransitions.map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() =>
                    runCommand(() => router.push(`/transitions/${t.id}`), {
                      type: 'transition',
                      id: t.id,
                      label: t.account?.name ?? 'Transition',
                      href: `/transitions/${t.id}`,
                    })
                  }
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{t.account?.name || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatStatus(t.status)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Team ────────────────────────────────────────────────── */}
        {showTeam && (
          <>
            <CommandGroup heading="Team">
              {demoTeamMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  onSelect={() =>
                    runCommand(() => router.push('/team'), {
                      type: 'page',
                      id: `team-${member.id}`,
                      label: member.full_name,
                      href: '/team',
                    })
                  }
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{member.full_name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {member.role}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        {showActions && (
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push('/transitions/new'), {
                  type: 'page',
                  id: 'action-new-transition',
                  label: 'Create New Transition',
                  href: '/transitions/new',
                })
              }
            >
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              Create New Transition
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push('/accounts/upload'), {
                  type: 'page',
                  id: 'action-import',
                  label: 'Import Accounts (CSV)',
                  href: '/accounts/upload',
                })
              }
            >
              <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
              Import Accounts (CSV)
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(
                  () => {
                    router.push('/team')
                    toast.success('Invite sent', {
                      description: 'Team invite email has been sent.',
                    })
                  },
                  {
                    type: 'page',
                    id: 'action-invite',
                    label: 'Invite Team Member',
                    href: '/team',
                  },
                )
              }
            >
              <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
              Invite Team Member
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push('/analytics'), {
                  type: 'page',
                  id: 'action-analytics',
                  label: 'View Analytics',
                  href: '/analytics',
                })
              }
            >
              <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
              View Analytics
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

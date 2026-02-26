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
} from 'lucide-react'
import { demoAccounts, demoTransitions, demoTeamMembers } from '@/lib/demo-data'
import { formatCurrency, formatSegment, formatStatus } from '@/lib/utils'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

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

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  // Top accounts by ARR for quick access
  const topAccounts = [...demoAccounts]
    .sort((a, b) => b.arr - a.arr)
    .slice(0, 8)

  // Active transitions
  const activeTransitions = demoTransitions
    .filter((t) => !['completed', 'cancelled'].includes(t.status))
    .slice(0, 6)
    .map((t) => ({
      ...t,
      account: demoAccounts.find((a) => a.id === t.account_id),
    }))

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search accounts, transitions, people, or type a command..." />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>No results found.</CommandEmpty>

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
              onSelect={() => runCommand(() => router.push(page.href))}
            >
              <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Top Accounts">
          {topAccounts.map((account) => (
            <CommandItem
              key={account.id}
              onSelect={() =>
                runCommand(() => router.push(`/accounts/${account.id}`))
              }
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{account.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCurrency(account.arr)}
              </span>
              <span className="ml-2 text-[10px] text-muted-foreground">
                {formatSegment(account.segment)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Active Transitions">
          {activeTransitions.map((t) => (
            <CommandItem
              key={t.id}
              onSelect={() =>
                runCommand(() => router.push(`/transitions/${t.id}`))
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

        <CommandGroup heading="Team">
          {demoTeamMembers.map((member) => (
            <CommandItem
              key={member.id}
              onSelect={() => runCommand(() => router.push('/team'))}
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

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/transitions/new'))
            }
          >
            <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
            New Transition
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push('/accounts/upload'))
            }
          >
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            Import Accounts (CSV)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

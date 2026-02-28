'use client'

import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Command, Search, Menu } from 'lucide-react'
import { useRole, getRoleLabel } from '@/lib/role-context'
import { cn } from '@/lib/utils'
import { NotificationPanel } from './notifications'
import { CommandPalette } from './command-palette'

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/accounts') return 'Accounts'
  if (pathname.startsWith('/accounts/')) return 'Account Detail'
  if (pathname === '/transitions') return 'Transitions'
  if (pathname === '/transitions/new') return 'New Transition'
  if (pathname.startsWith('/transitions/')) return 'Transition Detail'
  if (pathname === '/team') return 'Team'
  if (pathname === '/rules') return 'Assignment Rules'
  if (pathname === '/settings') return 'Settings'
  if (pathname === '/analytics') return 'Analytics'
  if (pathname === '/playbooks') return 'Playbooks'
  if (pathname === '/onboarding') return 'Getting Started'
  if (pathname === '/activity') return 'Activity Log'
  if (pathname === '/calendar') return 'Calendar'
  if (pathname === '/reports') return 'Reports'
  return 'Relay'
}

const roleBadgeColors: Record<string, string> = {
  revops_admin: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  am_leadership: 'bg-blue-50 text-blue-700 border-blue-200/60',
  rep: 'bg-amber-50 text-amber-700 border-amber-200/60',
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname()
  const { role, user } = useRole()
  const pageTitle = getPageTitle(pathname)

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 md:px-6">
        {/* Left: Hamburger + Role badge + Page title */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div
            className={cn(
              'hidden sm:block rounded-md border px-2 py-0.5 text-[10px] font-medium',
              roleBadgeColors[role]
            )}
          >
            {getRoleLabel(role)}
          </div>
          <div className="hidden sm:block h-4 w-px bg-border/60" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {pageTitle}
          </h2>
        </div>

        {/* Center: Command palette trigger */}
        <button
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            )
          }}
          aria-label="Open command palette"
          aria-keyshortcuts="Meta+k"
          data-tour="search"
          className="hidden md:flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
        >
          <Search className="h-3 w-3" />
          <span>Search...</span>
          <kbd className="ml-4 flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        {/* Right: Notifications + user */}
        <div className="flex items-center gap-3">
          <NotificationPanel />
          <div className="h-5 w-px bg-border/40" />
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-medium leading-tight text-foreground">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground/60">{user.title}</p>
            </div>
            <Avatar className="h-8 w-8 border border-border/40">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-[10px] font-semibold text-primary">
                {user.avatar_initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Command palette rendered outside header so the dialog portal works correctly */}
      <CommandPalette />
    </>
  )
}

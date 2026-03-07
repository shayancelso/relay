'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  ArrowLeftRight,
  Users,
  Workflow,
  Settings,
  BarChart3,
  AlertTriangle,
  FileText,
  CheckSquare,
  TrendingUp,
  Target,
  ChevronDown,
  Info,
  Check,
  X,
  BookOpen,
  Activity,
  CalendarDays,
  ClipboardList,
  Link2,
  Shield,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole, DEMO_USERS, getRoleLabel, getRoleDescription, type DemoRole } from '@/lib/role-context'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string | number
}

const navByRole: Record<DemoRole, { main: NavItem[]; insights?: NavItem[]; configure?: NavItem[]; system?: NavItem[] }> = {
  revops_admin: {
    main: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'Accounts', icon: Building2, badge: '2,000' },
      { href: '/transitions', label: 'Transitions', icon: ArrowLeftRight, badge: '24' },
      { href: '/revenue', label: 'Revenue Impact', icon: Shield },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/rules', label: 'Rules', icon: Workflow },
    ],
    insights: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
      { href: '/activity', label: 'Activity Log', icon: Activity },
    ],
    configure: [
      { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
      { href: '/workflows', label: 'Workflows', icon: GitBranch },
      { href: '/integrations', label: 'Integrations', icon: Link2 },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  am_leadership: {
    main: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/transitions', label: 'Pipeline', icon: Target },
      { href: '/team', label: 'Team Performance', icon: TrendingUp },
      { href: '/revenue', label: 'Revenue Impact', icon: Shield },
      { href: '/accounts', label: 'At-Risk Accounts', icon: AlertTriangle },
    ],
    insights: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
      { href: '/activity', label: 'Activity Log', icon: Activity },
    ],
    configure: [
      { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
      { href: '/workflows', label: 'Workflows', icon: GitBranch },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  rep: {
    main: [
      { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'My Accounts', icon: Building2 },
      { href: '/transitions', label: 'My Transitions', icon: ArrowLeftRight },
      { href: '/transitions/new', label: 'New Transition', icon: CheckSquare },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/activity', label: 'Activity', icon: Activity },
      { href: '/workflows', label: 'Workflows', icon: GitBranch },
    ],
  },
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { role, user, setRole } = useRole()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showRoleInfo, setShowRoleInfo] = useState(false)
  const [orgName, setOrgName] = useState('Wealthsimple')
  const nav = navByRole[role]

  useEffect(() => {
    try {
      const raw = localStorage.getItem('relay-trial-data')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.companyName) setOrgName(parsed.companyName)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleNavClick = () => {
    // Close sidebar on mobile after nav click
    onClose?.()
  }

  return (
    <>
    <aside className={cn(
      'flex h-screen w-[260px] flex-col border-r border-white/[0.06] bg-sidebar text-sidebar-foreground shrink-0',
      'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    )}>
      {/* Brand */}
      <Link href="/" className="flex h-[60px] items-center gap-3 px-5 hover:opacity-80 transition-opacity">
        <Image src="/relay-icon.png" alt="Relay" width={28} height={28} className="shrink-0" />
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">Relay</span>
          <span className="text-[10px] text-sidebar-foreground/30 tracking-wide">{orgName}</span>
        </div>
      </Link>

      {/* Separator */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4" data-tour="sidebar">
        {/* Helper: renders a labelled group of nav items */}
        {(
          [
            { key: 'main', label: 'Navigation', items: nav.main },
            { key: 'insights', label: 'Insights', items: nav.insights },
            { key: 'configure', label: 'Configure', items: nav.configure },
          ] as { key: string; label: string; items?: NavItem[] }[]
        )
          .filter((section) => section.items && section.items.length > 0)
          .map((section, sectionIndex) => (
            <div key={section.key}>
              {sectionIndex > 0 && (
                <div className="mx-3 my-4 h-px bg-white/[0.04]" />
              )}
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/25">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items!.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={handleNavClick}
                      {...(item.href === '/transitions' ? { 'data-tour': 'nav-transitions' } : {})}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        isActive
                          ? 'bg-white/[0.08] text-sidebar-foreground'
                          : 'text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-emerald-400" />
                      )}
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive
                            ? 'text-emerald-400'
                            : 'text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50'
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'ml-auto text-[10px] font-medium tabular-nums rounded-full px-1.5 py-0.5',
                            isActive
                              ? 'bg-white/10 text-sidebar-foreground/70'
                              : 'bg-white/[0.04] text-sidebar-foreground/30'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] p-3">
        {/* User card + inline persona switcher */}
        <div>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-white/[0.1] shrink-0">
              <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-medium text-sidebar-foreground/80 truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground/30 truncate">{user.title}</p>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-sidebar-foreground/30 transition-transform', showSwitcher && 'rotate-180')} />
          </button>

          {/* Inline persona list */}
          {showSwitcher && (
            <div className="mt-1 space-y-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1.5">
              <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20">
                  Switch Persona
                </p>
                <button
                  onClick={() => setShowRoleInfo(true)}
                  className="rounded p-0.5 text-white/20 hover:text-white/60 transition-colors"
                  title="What can each persona see?"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              {(Object.keys(DEMO_USERS) as DemoRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setShowSwitcher(false) }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                    r === role
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  )}
                >
                  <div className={cn(
                    'relative h-7 w-7 overflow-hidden rounded-lg border shrink-0',
                    r === role ? 'border-emerald-500/40' : 'border-white/10'
                  )}>
                    <Image src={DEMO_USERS[r].avatar_url} alt={DEMO_USERS[r].name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{DEMO_USERS[r].name}</p>
                    <p className="text-[10px] text-white/30 truncate">{getRoleLabel(r)}</p>
                  </div>
                  {r === role && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>

    {/* Role Guide Sheet */}
    <Sheet open={showRoleInfo} onOpenChange={setShowRoleInfo}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">Demo Personas</SheetTitle>
          <SheetDescription>
            Explore Relay from three different team perspectives. Each persona sees a tailored view based on their role.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Role cards */}
          <div className="space-y-3">
            {(Object.keys(DEMO_USERS) as DemoRole[]).map((r) => {
              const colors: Record<DemoRole, { bg: string; badge: string; dot: string }> = {
                revops_admin:  { bg: 'bg-emerald-50 border-emerald-100',  badge: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
                am_leadership: { bg: 'bg-blue-50 border-blue-100',        badge: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500' },
                rep:           { bg: 'bg-amber-50 border-amber-100',      badge: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-500' },
              }
              const c = colors[r]
              return (
                <div key={r} className={cn('flex gap-3 rounded-xl border p-3.5', c.bg)}>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm">
                    <Image src={DEMO_USERS[r].avatar_url} alt={DEMO_USERS[r].name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-foreground">{DEMO_USERS[r].name}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', c.badge)}>
                        {getRoleLabel(r)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{getRoleDescription(r)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison table */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              What each persona can access
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-4 bg-muted/40 border-b border-border">
                <div className="px-3 py-2.5 text-[11px] font-medium text-muted-foreground">Feature</div>
                {(Object.keys(DEMO_USERS) as DemoRole[]).map((r) => {
                  const dotColor: Record<DemoRole, string> = {
                    revops_admin: 'bg-emerald-500',
                    am_leadership: 'bg-blue-500',
                    rep: 'bg-amber-500',
                  }
                  return (
                    <div key={r} className="px-2 py-2.5 flex flex-col items-center gap-1">
                      <div className={cn('h-1.5 w-1.5 rounded-full', dotColor[r])} />
                      <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                        {getRoleLabel(r)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Rows */}
              {[
                { label: 'Org-wide dashboard',        revops: true,  leadership: true,  rep: false },
                { label: 'All accounts',              revops: true,  leadership: true,  rep: false },
                { label: 'My accounts & transitions', revops: true,  leadership: true,  rep: true  },
                { label: 'Team performance',          revops: true,  leadership: true,  rep: false },
                { label: 'Revenue impact',            revops: true,  leadership: true,  rep: false },
                { label: 'Analytics & reports',       revops: true,  leadership: true,  rep: false },
                { label: 'AI handoff briefs',         revops: true,  leadership: true,  rep: true  },
                { label: 'Assignment rules',          revops: true,  leadership: false, rep: false },
                { label: 'Integrations',              revops: true,  leadership: false, rep: false },
                { label: 'Playbooks',                 revops: true,  leadership: true,  rep: false },
                { label: 'Workflows',                 revops: true,  leadership: true,  rep: true  },
                { label: 'Settings & config',         revops: true,  leadership: false, rep: false },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    'grid grid-cols-4 border-b border-border last:border-0',
                    i % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                  )}
                >
                  <div className="px-3 py-2.5 text-[12px] text-foreground/80 font-medium">{row.label}</div>
                  {[row.revops, row.leadership, row.rep].map((has, j) => (
                    <div key={j} className="flex items-center justify-center py-2.5">
                      {has
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                        : <X className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={2.5} />
                      }
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}

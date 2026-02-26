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
  Sparkles,
  LogOut,
  BookOpen,
  Activity,
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole, DEMO_USERS, getRoleLabel, type DemoRole } from '@/lib/role-context'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string | number
}

const navByRole: Record<DemoRole, { main: NavItem[]; system?: NavItem[] }> = {
  revops_admin: {
    main: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'Accounts', icon: Building2, badge: '2,000' },
      { href: '/transitions', label: 'Transitions', icon: ArrowLeftRight, badge: '24' },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/rules', label: 'Assignment Rules', icon: Workflow },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
      { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
      { href: '/activity', label: 'Activity Log', icon: Activity },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
    system: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  am_leadership: {
    main: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/transitions', label: 'Pipeline', icon: Target },
      { href: '/team', label: 'Team Performance', icon: TrendingUp },
      { href: '/accounts', label: 'At-Risk Accounts', icon: AlertTriangle },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
      { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
      { href: '/activity', label: 'Activity Log', icon: Activity },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
    system: [
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
    ],
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const { role, user, setRole } = useRole()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const nav = navByRole[role]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-white/[0.06] bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-[60px] items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 font-bold text-sm text-white shadow-lg shadow-emerald-500/20">
          R
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">Relay</span>
          <span className="text-[10px] text-sidebar-foreground/30 tracking-wide">Wealthsimple</span>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/25">
          Navigation
        </p>
        <div className="space-y-0.5">
          {nav.main.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/[0.08] text-sidebar-foreground'
                    : 'text-sidebar-foreground/50 hover:bg-white/[0.04] hover:text-sidebar-foreground/80'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-emerald-400" />
                )}
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-400' : 'text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50')} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'ml-auto text-[10px] font-medium tabular-nums rounded-full px-1.5 py-0.5',
                    isActive ? 'bg-white/10 text-sidebar-foreground/70' : 'bg-white/[0.04] text-sidebar-foreground/30'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* System section */}
        {nav.system && nav.system.length > 0 && (
          <>
            <div className="mx-3 my-4 h-px bg-white/[0.04]" />
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/25">
              System
            </p>
            <div className="space-y-0.5">
              {nav.system.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
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
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-emerald-400' : 'text-sidebar-foreground/30')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] p-3">
        {/* Role Switcher */}
        <div className="relative mb-2" ref={switcherRef}>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-sidebar-foreground/30 transition-colors hover:bg-white/[0.04] hover:text-sidebar-foreground/50"
          >
            <Sparkles className="h-3 w-3" />
            <span className="flex-1 text-left">Demo: {getRoleLabel(role)}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', showSwitcher && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {showSwitcher && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-white/10 bg-[#2a2827] p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl">
              <p className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/20">
                Switch Persona
              </p>
              {(Object.keys(DEMO_USERS) as DemoRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setShowSwitcher(false) }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                    r === role ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                  )}
                >
                  <div className={cn(
                    'relative h-7 w-7 overflow-hidden rounded-lg border',
                    r === role ? 'border-emerald-500/40' : 'border-white/10'
                  )}>
                    <Image src={DEMO_USERS[r].avatar_url} alt={DEMO_USERS[r].name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium">{DEMO_USERS[r].name}</p>
                    <p className="text-[10px] text-white/30">{getRoleLabel(r)}</p>
                  </div>
                  {r === role && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User card */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-white/[0.1]">
            <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-sidebar-foreground/80 truncate">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/30 truncate">{user.title}</p>
          </div>
        </div>

        {/* Sign out */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-sidebar-foreground/25 transition-colors hover:bg-white/[0.04] hover:text-sidebar-foreground/50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Switch Persona
        </Link>
      </div>
    </aside>
  )
}

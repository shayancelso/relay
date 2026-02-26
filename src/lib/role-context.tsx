'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type DemoRole = 'revops_admin' | 'am_leadership' | 'rep'

interface DemoUser {
  id: string
  name: string
  email: string
  role: DemoRole
  avatar_initials: string
  avatar_url: string
  title: string
}

export const DEMO_USERS: Record<DemoRole, DemoUser> = {
  revops_admin: {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@wealthsimple.com',
    role: 'revops_admin',
    avatar_initials: 'SC',
    avatar_url: '/avatars/sarah.jpg',
    title: 'VP Revenue Operations',
  },
  am_leadership: {
    id: 'user-2',
    name: 'Marcus Johnson',
    email: 'marcus.j@wealthsimple.com',
    role: 'am_leadership',
    avatar_initials: 'MJ',
    avatar_url: '/avatars/marcus.jpg',
    title: 'Director, Account Management',
  },
  rep: {
    id: 'user-3',
    name: 'Elena Rodriguez',
    email: 'elena.r@wealthsimple.com',
    role: 'rep',
    avatar_initials: 'ER',
    avatar_url: '/avatars/elena.jpg',
    title: 'Senior Account Manager',
  },
}

interface RoleContextValue {
  role: DemoRole
  user: DemoUser
  setRole: (role: DemoRole) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DemoRole>('revops_admin')

  useEffect(() => {
    const saved = localStorage.getItem('relay-demo-role') as DemoRole | null
    if (saved && DEMO_USERS[saved]) {
      setRoleState(saved)
    }
  }, [])

  const setRole = (newRole: DemoRole) => {
    setRoleState(newRole)
    localStorage.setItem('relay-demo-role', newRole)
  }

  return (
    <RoleContext.Provider value={{ role, user: DEMO_USERS[role], setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}

export function getRoleLabel(role: DemoRole): string {
  switch (role) {
    case 'revops_admin': return 'RevOps Admin'
    case 'am_leadership': return 'AM Leadership'
    case 'rep': return 'Account Manager'
  }
}

export function getRoleDescription(role: DemoRole): string {
  switch (role) {
    case 'revops_admin': return 'Full system access. Assignment rules, analytics, team capacity planning, and organization-wide transition oversight.'
    case 'am_leadership': return 'Pipeline oversight, team performance metrics, at-risk account monitoring, and transition health across your team.'
    case 'rep': return 'Your accounts, your transitions, action items, and personalized dashboard for day-to-day account management.'
  }
}

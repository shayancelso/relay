'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
  full_name: string
  org_id: string | null
  org_name: string | null
  role: string
  avatar_initials: string
}

interface AuthContextValue {
  authUser: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  authUser: null,
  isAuthenticated: false,
  isLoading: true,
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setAuthUser(null)
          setIsLoading(false)
          return
        }

        // Try to load profile from users table
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, org_id, role')
          .eq('id', user.id)
          .single()

        let orgName: string | null = null
        if (profile?.org_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.org_id)
            .single()
          orgName = org?.name ?? null
        }

        const fullName = profile?.full_name || user.user_metadata?.full_name || user.email || 'User'

        setAuthUser({
          id: user.id,
          email: profile?.email || user.email || '',
          full_name: fullName,
          org_id: profile?.org_id ?? null,
          org_name: orgName,
          role: profile?.role || 'admin',
          avatar_initials: getInitials(fullName),
        })
      } catch {
        setAuthUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ authUser, isAuthenticated: !!authUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

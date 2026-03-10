'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface TrialModeContextValue {
  isTrialMode: boolean
  isDemoMode: boolean
  hasTrial: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
}

const TrialModeContext = createContext<TrialModeContextValue>({
  isTrialMode: false,
  isDemoMode: false,
  hasTrial: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
})

export function TrialModeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [isTrialMode, setIsTrialMode] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [hasTrial, setHasTrial] = useState(false)

  useEffect(() => {
    if (isLoading) return

    try {
      if (isAuthenticated) {
        // Authenticated users: clean slate by default
        // Only show demo if they explicitly clicked "Explore demo" THIS session
        const explicitDemo = localStorage.getItem('relay-demo-mode') === 'true'

        // Clear stale demo role from previous browsing
        localStorage.removeItem('relay-demo-role')

        setHasTrial(false)
        setIsDemoMode(explicitDemo)
        setIsTrialMode(!explicitDemo)
      } else {
        // Unauthenticated: original demo/trial logic
        const hasTrialData = !!localStorage.getItem('relay-trial-data')
        const demoModeFlag = localStorage.getItem('relay-demo-mode') === 'true'
        const hasDemoRole = !!localStorage.getItem('relay-demo-role')
        const isDemoActive = demoModeFlag || hasDemoRole

        setHasTrial(hasTrialData)
        setIsDemoMode(isDemoActive)
        setIsTrialMode(hasTrialData && !isDemoActive)
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated, isLoading])

  const enterDemoMode = () => {
    try { localStorage.setItem('relay-demo-mode', 'true') } catch { /* ignore */ }
    setIsDemoMode(true)
    setIsTrialMode(false)
  }

  const exitDemoMode = () => {
    try { localStorage.removeItem('relay-demo-mode') } catch { /* ignore */ }
    setIsDemoMode(false)
    setIsTrialMode(true)
  }

  return (
    <TrialModeContext.Provider value={{ isTrialMode, isDemoMode, hasTrial, enterDemoMode, exitDemoMode }}>
      {children}
    </TrialModeContext.Provider>
  )
}

export const useTrialMode = () => useContext(TrialModeContext)

'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface TrialModeContextValue {
  isTrialMode: boolean
  isDemoMode: boolean     // relay-demo-mode === 'true' (reactive, not just on mount)
  hasTrial: boolean       // relay-trial-data exists
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
  const [isTrialMode, setIsTrialMode] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [hasTrial, setHasTrial] = useState(false)

  useEffect(() => {
    try {
      const hasTrialData = !!localStorage.getItem('relay-trial-data')
      const demoMode = localStorage.getItem('relay-demo-mode') === 'true'
      setHasTrial(hasTrialData)
      setIsDemoMode(demoMode)
      setIsTrialMode(hasTrialData && !demoMode)
    } catch {
      // ignore
    }
  }, [])

  const enterDemoMode = () => {
    try { localStorage.setItem('relay-demo-mode', 'true') } catch { /* ignore */ }
    setIsDemoMode(true)
    setIsTrialMode(false)
  }

  const exitDemoMode = () => {
    try { localStorage.removeItem('relay-demo-mode') } catch { /* ignore */ }
    setIsDemoMode(false)
    if (hasTrial) setIsTrialMode(true)
  }

  return (
    <TrialModeContext.Provider value={{ isTrialMode, isDemoMode, hasTrial, enterDemoMode, exitDemoMode }}>
      {children}
    </TrialModeContext.Provider>
  )
}

export const useTrialMode = () => useContext(TrialModeContext)

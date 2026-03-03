'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { DEMO_EQUITY_RULES, type EquityRule } from '@/lib/equity-types'

// ---------------------------------------------------------------------------
// Types returned by getMetricTarget
// ---------------------------------------------------------------------------

export interface MetricTarget {
  targetType: 'mean_relative' | 'absolute'
  /** For mean_relative: fractional tolerance (0.20 = ±20%). For absolute: raw units (5 pts, 10%). */
  tolerance: number
  defaultTarget?: number
  segmentTargets?: Record<string, { target: number }>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface EquityContextValue {
  equityRules: EquityRule[]
  setEquityRules: (rules: EquityRule[] | ((prev: EquityRule[]) => EquityRule[])) => void
  /** Map a chart metric key to its active equity target config, or null if no active rule. */
  getMetricTarget: (chartMetric: string) => MetricTarget | null
}

const EquityContext = createContext<EquityContextValue | null>(null)

const STORAGE_KEY = 'relay-equity-rules'

export function EquityProvider({ children }: { children: ReactNode }) {
  const [rules, setRulesState] = useState<EquityRule[]>(DEMO_EQUITY_RULES)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as EquityRule[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRulesState(parsed)
        }
      }
    } catch {
      // ignore bad data
    }
  }, [])

  // Persist-on-update wrapper
  const setEquityRules = useCallback(
    (updater: EquityRule[] | ((prev: EquityRule[]) => EquityRule[])) => {
      setRulesState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // quota exceeded — ignore
        }
        return next
      })
    },
    [],
  )

  // Map chart metric keys → active equity rule
  const getMetricTarget = useCallback(
    (chartMetric: string): MetricTarget | null => {
      let rule: EquityRule | undefined

      switch (chartMetric) {
        case 'arr':
          rule = rules.find(r => r.active && r.metric === 'arr')
          break
        case 'accounts':
          rule = rules.find(r => r.active && r.metric === 'account_count')
          break
        case 'health':
          rule = rules.find(r => r.active && r.metric === 'custom' && r.customFieldName === 'health_score')
          break
        case 'utilization':
          rule = rules.find(r => r.active && r.metric === 'custom' && r.customFieldName === 'utilization')
          break
        default:
          return null
      }

      if (!rule) return null

      const targetType = rule.targetType ?? 'mean_relative'

      // Convert tolerance: mean_relative rules store 20 (= 20%), chart needs 0.20
      const tolerance = targetType === 'mean_relative'
        ? rule.tolerance / 100
        : rule.tolerance

      // Convert segmentTargets array → Record for easy lookup
      let segmentTargets: Record<string, { target: number }> | undefined
      if (rule.segmentTargets && rule.segmentTargets.length > 0) {
        segmentTargets = {}
        for (const st of rule.segmentTargets) {
          segmentTargets[st.segment] = { target: st.target }
        }
      }

      return {
        targetType,
        tolerance,
        defaultTarget: rule.defaultTarget,
        segmentTargets,
      }
    },
    [rules],
  )

  return (
    <EquityContext.Provider value={{ equityRules: rules, setEquityRules, getMetricTarget }}>
      {children}
    </EquityContext.Provider>
  )
}

export function useEquityRules() {
  const ctx = useContext(EquityContext)
  if (!ctx) throw new Error('useEquityRules must be used within EquityProvider')
  return ctx
}

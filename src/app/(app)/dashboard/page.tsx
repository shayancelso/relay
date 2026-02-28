'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRole } from '@/lib/role-context'
import { RevOpsDashboard } from '@/components/dashboard/revops-dashboard'
import { LeadershipDashboard } from '@/components/dashboard/leadership-dashboard'
import { RepDashboard } from '@/components/dashboard/rep-dashboard'
import { ProductTour } from '@/components/tour/product-tour'
import { Zap, X, ArrowRight } from 'lucide-react'

type DashboardMode = 'real-setup' | 'demo' | 'none'

function DashboardBanner() {
  const [mode, setMode] = useState<DashboardMode>('none')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const trialData = localStorage.getItem('relay-trial-data')
      const demoMode = localStorage.getItem('relay-demo-mode')
      const setupDone = localStorage.getItem('relay-setup-complete')
      if (trialData && !demoMode && !setupDone) {
        setMode('real-setup')
      } else if (demoMode === 'true') {
        setMode('demo')
      }
    } catch {
      // ignore
    }
  }, [])

  const dismiss = () => {
    if (mode === 'real-setup') localStorage.setItem('relay-setup-complete', 'true')
    setDismissed(true)
  }

  if (dismissed || mode === 'none') return null

  // Real setup path: green banner
  if (mode === 'real-setup') {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 mt-0.5">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Your workspace is syncing</p>
          <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
            You&apos;re viewing <span className="font-semibold">sample data</span> while your real accounts sync.
            This is exactly what your dashboard will look like once connected.
          </p>
        </div>
        <Link
          href="/setup"
          className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mt-0.5"
        >
          View checklist
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Demo escape hatch: subtle badge
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-semibold text-[11px] mr-2">
            Demo mode
          </span>
          You&apos;re exploring with sample data.{' '}
          <Link href="/onboarding" className="text-emerald-600 hover:underline font-medium">
            Start your real setup →
          </Link>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const { role } = useRole()

  const dashboard = (() => {
    switch (role) {
      case 'revops_admin': return <RevOpsDashboard />
      case 'am_leadership': return <LeadershipDashboard />
      case 'rep': return <RepDashboard />
    }
  })()

  return (
    <div>
      <DashboardBanner />
      {dashboard}
      <ProductTour />
    </div>
  )
}

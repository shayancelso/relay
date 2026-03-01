'use client'

import { useRole } from '@/lib/role-context'
import { useTrialMode } from '@/lib/trial-context'
import { RevOpsDashboard } from '@/components/dashboard/revops-dashboard'
import { LeadershipDashboard } from '@/components/dashboard/leadership-dashboard'
import { RepDashboard } from '@/components/dashboard/rep-dashboard'
import { TrialDashboard } from '@/components/dashboard/trial-dashboard'
import { ProductTour } from '@/components/tour/product-tour'

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { role } = useRole()
  const { isTrialMode, enterDemoMode } = useTrialMode()

  if (isTrialMode) {
    return (
      <div>
        <TrialDashboard onExploreDemo={enterDemoMode} />
        <ProductTour />
      </div>
    )
  }

  const dashboard = (() => {
    switch (role) {
      case 'revops_admin': return <RevOpsDashboard />
      case 'am_leadership': return <LeadershipDashboard />
      case 'rep': return <RepDashboard />
    }
  })()

  return (
    <div>
      {dashboard}
      <ProductTour />
    </div>
  )
}

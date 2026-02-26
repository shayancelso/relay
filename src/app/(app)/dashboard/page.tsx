'use client'

import { useRole } from '@/lib/role-context'
import { RevOpsDashboard } from '@/components/dashboard/revops-dashboard'
import { LeadershipDashboard } from '@/components/dashboard/leadership-dashboard'
import { RepDashboard } from '@/components/dashboard/rep-dashboard'

export default function DashboardPage() {
  const { role } = useRole()

  switch (role) {
    case 'revops_admin':
      return <RevOpsDashboard />
    case 'am_leadership':
      return <LeadershipDashboard />
    case 'rep':
      return <RepDashboard />
  }
}

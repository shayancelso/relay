import { demoRules, demoTeamMembers } from '@/lib/demo-data'
import { RulesManager } from '@/components/assignment/rules-manager'

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignment Rules</h1>
        <p className="text-sm text-muted-foreground">Configure how accounts are automatically assigned to reps</p>
      </div>
      <RulesManager rules={demoRules as any} teamMembers={demoTeamMembers} />
    </div>
  )
}

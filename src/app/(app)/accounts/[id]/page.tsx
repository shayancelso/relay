import { demoAccounts, demoTeamMembers, demoContacts, demoTransitions, demoActivities } from '@/lib/demo-data'
import { notFound } from 'next/navigation'
import AccountDetailClient from './AccountDetailClient'

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const account = demoAccounts.find(a => a.id === id)
  if (!account) notFound()

  const owner = demoTeamMembers.find(m => m.id === account.current_owner_id) ?? null
  const contacts = demoContacts.filter(c => c.account_id === id)
  const transitions = demoTransitions
    .filter(t => t.account_id === id)
    .map(t => ({
      ...t,
      from_owner: demoTeamMembers.find(m => m.id === t.from_owner_id) ?? null,
      to_owner: demoTeamMembers.find(m => m.id === t.to_owner_id) ?? null,
    }))

  // Gather transition IDs for this account, then find related activities
  const transitionIds = new Set(transitions.map(t => t.id))
  const activities = demoActivities
    .filter(a => transitionIds.has(a.transition_id))
    .map(a => ({
      ...a,
      created_by_user: demoTeamMembers.find(m => m.id === a.created_by) ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <AccountDetailClient
      account={account}
      owner={owner}
      contacts={contacts}
      transitions={transitions}
      activities={activities}
    />
  )
}

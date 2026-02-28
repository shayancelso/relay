import {
  demoTransitions,
  demoAccounts,
  demoTeamMembers,
  demoContacts,
  demoActivities,
  demoBriefs,
  demoEmails,
} from '@/lib/demo-data'
import { notFound } from 'next/navigation'
import { TransitionDetailClient } from './TransitionDetailClient'

export default async function TransitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const transition = demoTransitions.find(t => t.id === id)
  if (!transition) notFound()

  const account = demoAccounts.find(a => a.id === transition.account_id) || null
  const fromOwner = demoTeamMembers.find(m => m.id === transition.from_owner_id) || null
  const toOwner = demoTeamMembers.find(m => m.id === transition.to_owner_id) || null

  const contacts = demoContacts.filter(c => c.account_id === transition.account_id)

  const brief = demoBriefs.find(b => b.transition_id === id) || null

  // Resolve created_by_user join expected by TransitionTimeline
  const activities = demoActivities
    .filter(a => a.transition_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(a => ({
      ...a,
      created_by_user: demoTeamMembers.find(m => m.id === a.created_by)
        ? { full_name: demoTeamMembers.find(m => m.id === a.created_by)!.full_name }
        : null,
    }))

  // Resolve contact join expected by EmailSection
  const emails = demoEmails
    .filter(e => e.transition_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(e => {
      const contact = demoContacts.find(c => c.id === e.contact_id)
      return {
        ...e,
        contact: contact ? { name: contact.name, email: contact.email ?? '' } : null,
      }
    })

  return (
    <TransitionDetailClient
      transition={transition}
      account={account}
      fromOwner={fromOwner}
      toOwner={toOwner}
      contacts={contacts}
      brief={brief}
      activities={activities}
      emails={emails}
    />
  )
}

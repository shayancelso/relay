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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusColor,
  getPriorityColor,
  getHealthBg,
} from '@/lib/utils'
import { ArrowRight, Building2, Calendar, DollarSign } from 'lucide-react'
import { TransitionActions } from '@/components/transitions/transition-actions'
import { TransitionTimeline } from '@/components/transitions/transition-timeline'
import { ApprovalHistory } from '@/components/transitions/approval-history'
import { BriefSection } from '@/components/briefs/brief-section'
import { EmailSection } from '@/components/emails/email-section'

const STATUS_STEPS = [
  'draft',
  'pending_approval',
  'approved',
  'intro_sent',
  'meeting_booked',
  'in_progress',
  'completed',
]

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

  const currentStepIdx = STATUS_STEPS.indexOf(transition.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {account?.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <span>{fromOwner?.full_name}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{toOwner?.full_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(transition.priority)}>
            {transition.priority}
          </Badge>
          <Badge className={getStatusColor(transition.status)}>
            {formatStatus(transition.status)}
          </Badge>
        </div>
      </div>

      {/* Status stepper */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start justify-between overflow-x-auto gap-0">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-start flex-1">
                {i > 0 && (
                  <div
                    className={`h-px flex-1 mt-4 ${
                      i <= currentStepIdx ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      i < currentStepIdx
                        ? 'bg-primary text-primary-foreground'
                        : i === currentStepIdx
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < currentStepIdx ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap text-center px-1 ${
                      i <= currentStepIdx ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {formatStatus(s)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> ARR
            </div>
            <p className="text-xl font-bold">
              {formatCurrency(account?.arr || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              Health
            </div>
            <Badge className={getHealthBg(account?.health_score || 0)}>
              {account?.health_score}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" /> Due Date
            </div>
            <p className="text-sm font-medium">
              {transition.due_date ? formatDate(transition.due_date) : 'Not set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              Reason
            </div>
            <p className="text-sm font-medium capitalize">
              {transition.reason.replace(/_/g, ' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <TransitionActions
        transitionId={transition.id}
        currentStatus={transition.status}
        hasBrief={!!brief}
        createdAt={transition.created_at}
      />

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Brief */}
          <BriefSection
            transitionId={transition.id}
            brief={brief ?? null}
            account={account}
            contacts={contacts}
            fromOwner={fromOwner}
            toOwner={toOwner}
            notes={transition.notes}
          />

          {/* Emails */}
          <EmailSection
            transitionId={transition.id}
            emails={emails}
            contacts={contacts}
            account={account}
            fromOwner={fromOwner}
            toOwner={toOwner}
            briefContent={brief?.content}
          />

          {/* Notes */}
          {transition.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{transition.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Timeline + Approval Chain */}
        <div className="space-y-6">
          <TransitionTimeline activities={activities} />
          <ApprovalHistory
            transitionStatus={transition.status}
            createdAt={transition.created_at}
          />
        </div>
      </div>
    </div>
  )
}

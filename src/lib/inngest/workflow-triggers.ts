import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

// Maps event names to the triggerType stored in workflow node configs
const TRIGGER_MAP: Record<string, string> = {
  'relay/account.assigned': 'Account Assigned',
  'relay/transition.completed': 'Transition Completed',
  'relay/renewal.approaching': 'Renewal Approaching',
  'relay/health-score.dropped': 'Health Score Below Threshold',
}

// Generic trigger handler — finds active workflows matching the trigger type and dispatches execution
async function findAndDispatchWorkflows(
  triggerType: string,
  accountId: string,
  orgId: string
) {
  const supabase = createAdminClient()

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id')
    .eq('status', 'active')
    .eq('org_id', orgId)
    .contains('nodes', [{ data: { type: 'trigger', config: { triggerType } } }])

  if (!workflows || workflows.length === 0) return []

  const events = workflows.map((w) => ({
    name: 'relay/workflow.execute' as const,
    data: { workflow_id: w.id, account_id: accountId, org_id: orgId },
  }))

  await inngest.send(events)

  return workflows.map((w) => w.id)
}

export const onAccountAssigned = inngest.createFunction(
  { id: 'workflow-trigger-account-assigned', name: 'Workflow Trigger: Account Assigned' },
  { event: 'relay/account.assigned' },
  async ({ event, step }) => {
    const { account_id, org_id } = event.data as { account_id: string; org_id: string }
    const dispatched = await step.run('find-and-dispatch', () =>
      findAndDispatchWorkflows(TRIGGER_MAP['relay/account.assigned'], account_id, org_id)
    )
    return { triggered: dispatched.length, workflow_ids: dispatched }
  }
)

export const onTransitionCompleted = inngest.createFunction(
  { id: 'workflow-trigger-transition-completed', name: 'Workflow Trigger: Transition Completed' },
  { event: 'relay/transition.completed' },
  async ({ event, step }) => {
    const { account_id, org_id } = event.data as { account_id: string; org_id: string }
    const dispatched = await step.run('find-and-dispatch', () =>
      findAndDispatchWorkflows(TRIGGER_MAP['relay/transition.completed'], account_id, org_id)
    )
    return { triggered: dispatched.length, workflow_ids: dispatched }
  }
)

export const onRenewalApproaching = inngest.createFunction(
  { id: 'workflow-trigger-renewal-approaching', name: 'Workflow Trigger: Renewal Approaching' },
  { event: 'relay/renewal.approaching' },
  async ({ event, step }) => {
    const { account_id, org_id } = event.data as { account_id: string; org_id: string }
    const dispatched = await step.run('find-and-dispatch', () =>
      findAndDispatchWorkflows(TRIGGER_MAP['relay/renewal.approaching'], account_id, org_id)
    )
    return { triggered: dispatched.length, workflow_ids: dispatched }
  }
)

export const onHealthScoreDropped = inngest.createFunction(
  { id: 'workflow-trigger-health-score-dropped', name: 'Workflow Trigger: Health Score Drop' },
  { event: 'relay/health-score.dropped' },
  async ({ event, step }) => {
    const { account_id, org_id } = event.data as { account_id: string; org_id: string }
    const dispatched = await step.run('find-and-dispatch', () =>
      findAndDispatchWorkflows(TRIGGER_MAP['relay/health-score.dropped'], account_id, org_id)
    )
    return { triggered: dispatched.length, workflow_ids: dispatched }
  }
)

import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorkflowNodeDef, ExecutionContext, ExecutorResult } from './types'

// Deterministic pseudo-random based on seed string (for demo condition evaluation)
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit int
  }
  return Math.abs(hash % 100) / 100
}

export async function executeNode(
  node: WorkflowNodeDef,
  ctx: ExecutionContext,
  supabase: SupabaseClient
): Promise<ExecutorResult> {
  switch (node.data.type) {
    case 'trigger':
      return executeTrigger(node)
    case 'sendEmail':
      return executeSendEmail(node, ctx, supabase)
    case 'wait':
      return executeWait(node)
    case 'condition':
      return executeCondition(node, ctx)
    case 'bookMeeting':
      return executeBookMeeting(node, ctx, supabase)
    case 'createTask':
      return executeCreateTask(node, ctx, supabase)
    case 'addNote':
      return executeAddNote(node, ctx, supabase)
    case 'end':
      return executeEnd(node)
    default:
      return { output: { error: `Unknown node type: ${node.data.type}` } }
  }
}

function executeTrigger(node: WorkflowNodeDef): ExecutorResult {
  return {
    output: { triggerType: node.data.config.triggerType },
  }
}

async function executeSendEmail(
  node: WorkflowNodeDef,
  ctx: ExecutionContext,
  supabase: SupabaseClient
): Promise<ExecutorResult> {
  const subject = (node.data.config.subject as string) || 'No subject'
  const body = (node.data.config.body as string) || ''
  const to = ctx.account.primary_contact_email

  if (!to) {
    return {
      output: { error: 'No contact email available', subject, skipped: true },
    }
  }

  try {
    const { sendTransitionEmail } = await import('@/lib/email/resend')
    const result = await sendTransitionEmail({ to, subject, body })

    if ('error' in result) {
      return { output: { error: result.error, subject, sentTo: to } }
    }

    // Track that an email was sent (for condition checks downstream)
    ctx.stepState.lastEmailSentAt = new Date().toISOString()
    ctx.stepState.lastEmailId = result.id

    return {
      output: { emailId: result.id, subject, sentTo: to },
    }
  } catch (err) {
    return {
      output: { error: String(err), subject, sentTo: to },
    }
  }
}

function executeWait(node: WorkflowNodeDef): ExecutorResult {
  const days = (node.data.config.days as number) || 1
  return {
    output: { days },
    sleepDays: days,
  }
}

function executeCondition(node: WorkflowNodeDef, ctx: ExecutionContext): ExecutorResult {
  const conditionType = (node.data.config.conditionType as string) || ''
  const threshold = node.data.config.threshold as number | undefined
  const seed = `${ctx.run_id}-${node.id}`
  const rand = seededRandom(seed)

  let result = false

  switch (conditionType) {
    case 'Email replied':
      result = rand < 0.3
      break
    case 'Email opened':
      result = rand < 0.6
      break
    case 'Email opened or replied':
      result = rand < 0.7
      break
    case 'No response':
      result = rand >= 0.3 // inverse of "replied"
      break
    case 'Health score above threshold':
      result = ctx.account.health_score > (threshold || 70)
      break
    case 'Meeting booked':
      result = rand < 0.4
      break
    default:
      result = rand < 0.5
  }

  return {
    output: { conditionType, result, threshold },
    nextHandle: result ? 'yes' : 'no',
  }
}

async function executeBookMeeting(
  node: WorkflowNodeDef,
  ctx: ExecutionContext,
  supabase: SupabaseClient
): Promise<ExecutorResult> {
  const duration = (node.data.config.duration as number) || 30
  const meetingType = (node.data.config.meetingType as string) || 'Meeting'

  // Log to transition_activities if there's a matching transition
  try {
    await supabase.from('transition_activities').insert({
      org_id: ctx.org_id,
      transition_id: ctx.workflow_id, // using workflow_id as reference
      type: 'meeting_booked',
      description: `${meetingType} (${duration} min) booked for ${ctx.account.name}`,
      metadata: { workflow_run_id: ctx.run_id, node_id: node.id, duration, meetingType },
    })
  } catch {
    // Activity logging is best-effort
  }

  return {
    output: { meetingType, duration, accountName: ctx.account.name },
  }
}

async function executeCreateTask(
  node: WorkflowNodeDef,
  ctx: ExecutionContext,
  supabase: SupabaseClient
): Promise<ExecutorResult> {
  const title = (node.data.config.title as string) || 'Task'
  const assignee = (node.data.config.assignee as string) || 'auto'

  try {
    await supabase.from('transition_activities').insert({
      org_id: ctx.org_id,
      transition_id: ctx.workflow_id,
      type: 'note_added',
      description: `Task created: ${title}`,
      metadata: { workflow_run_id: ctx.run_id, node_id: node.id, assignee, taskTitle: title },
    })
  } catch {
    // Best-effort
  }

  return {
    output: { taskTitle: title, assignee },
  }
}

async function executeAddNote(
  node: WorkflowNodeDef,
  ctx: ExecutionContext,
  supabase: SupabaseClient
): Promise<ExecutorResult> {
  const content = (node.data.config.content as string) || ''

  try {
    await supabase.from('transition_activities').insert({
      org_id: ctx.org_id,
      transition_id: ctx.workflow_id,
      type: 'note_added',
      description: content || `Note added for ${ctx.account.name}`,
      metadata: { workflow_run_id: ctx.run_id, node_id: node.id },
    })
  } catch {
    // Best-effort
  }

  return {
    output: { content },
  }
}

function executeEnd(node: WorkflowNodeDef): ExecutorResult {
  return {
    output: { status: node.data.config.status || 'Completed' },
    terminal: true,
  }
}

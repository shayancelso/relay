import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import { findTriggerNode, findNextNodeIds, getNodeById } from '@/lib/workflows/graph'
import { executeNode } from '@/lib/workflows/executors'
import type { WorkflowNodeDef, WorkflowEdgeDef, ExecutionContext } from '@/lib/workflows/types'

export const executeWorkflow = inngest.createFunction(
  { id: 'execute-workflow', name: 'Execute Workflow' },
  { event: 'relay/workflow.execute' },
  async ({ event, step }) => {
    const supabase = createAdminClient()
    const { workflow_id, account_id, org_id } = event.data as {
      workflow_id: string
      account_id: string
      org_id: string
    }

    // Step 1: Load workflow definition
    const workflow = await step.run('load-workflow', async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflow_id)
        .single()
      if (error) throw new Error(`Workflow not found: ${error.message}`)
      return data as { id: string; name: string; nodes: WorkflowNodeDef[]; edges: WorkflowEdgeDef[] }
    })

    // Step 2: Load account + primary contact
    const account = await step.run('load-account', async () => {
      const { data: acc } = await supabase
        .from('accounts')
        .select('id, name, health_score')
        .eq('id', account_id)
        .single()

      const { data: contact } = await supabase
        .from('account_contacts')
        .select('name, email')
        .eq('account_id', account_id)
        .eq('is_primary', true)
        .maybeSingle()

      return {
        id: acc?.id || account_id,
        name: acc?.name || 'Unknown Account',
        health_score: acc?.health_score || 50,
        primary_contact_email: contact?.email || null,
        primary_contact_name: contact?.name || null,
      }
    })

    // Step 3: Create workflow run
    const run = await step.run('create-run', async () => {
      const { data, error } = await supabase
        .from('workflow_runs')
        .insert({
          org_id,
          workflow_id,
          account_id,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw new Error(`Failed to create run: ${error.message}`)
      return data as { id: string }
    })

    // Step 4: Find trigger node
    const triggerNode = findTriggerNode(workflow.nodes)
    if (!triggerNode) {
      await step.run('fail-no-trigger', async () => {
        await supabase.from('workflow_runs').update({
          status: 'failed',
          error: 'No trigger node found',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
      })
      return { error: 'No trigger node found' }
    }

    // Step 5: Walk the graph
    const ctx: ExecutionContext = {
      run_id: run.id,
      workflow_id,
      org_id,
      account_id,
      account,
      stepState: {},
    }

    let currentNodeId: string | null = triggerNode.id
    let stepIndex = 0
    const MAX_STEPS = 50

    while (currentNodeId && stepIndex < MAX_STEPS) {
      const node = getNodeById(currentNodeId, workflow.nodes)
      if (!node) break

      // Update current position
      await step.run(`track-${stepIndex}-${node.id}`, async () => {
        await supabase.from('workflow_runs').update({
          current_node_id: node.id,
        }).eq('id', run.id)

        await supabase.from('workflow_step_logs').insert({
          run_id: run.id,
          node_id: node.id,
          node_type: node.data.type,
          status: 'running',
          input: node.data.config,
          started_at: new Date().toISOString(),
        })
      })

      // Handle wait nodes with Inngest sleep
      if (node.data.type === 'wait') {
        const days = (node.data.config.days as number) || 1
        await step.run(`log-wait-${stepIndex}-${node.id}`, async () => {
          await supabase.from('workflow_step_logs').update({
            status: 'completed',
            output: { days, sleeping: true },
            completed_at: new Date().toISOString(),
          }).eq('run_id', run.id).eq('node_id', node.id).eq('status', 'running')
        })
        await step.sleep(`sleep-${stepIndex}-${node.id}`, `${days}d`)

        const nextIds = findNextNodeIds(currentNodeId, workflow.edges)
        currentNodeId = nextIds[0] || null
        stepIndex++
        continue
      }

      // Execute node
      const result = await step.run(`exec-${stepIndex}-${node.id}`, async () => {
        return executeNode(node, ctx, supabase)
      })

      // Log completion
      await step.run(`done-${stepIndex}-${node.id}`, async () => {
        await supabase.from('workflow_step_logs').update({
          status: 'completed',
          output: result.output,
          completed_at: new Date().toISOString(),
        }).eq('run_id', run.id).eq('node_id', node.id).eq('status', 'running')
      })

      // Terminal node — stop
      if (result.terminal) break

      // Find next node (use branch handle for condition nodes)
      const nextIds = findNextNodeIds(currentNodeId, workflow.edges, result.nextHandle as 'yes' | 'no' | undefined)
      currentNodeId = nextIds[0] || null
      stepIndex++
    }

    // Mark run as completed
    await step.run('complete-run', async () => {
      await supabase.from('workflow_runs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', run.id)
    })

    return { run_id: run.id, steps_executed: stepIndex }
  }
)

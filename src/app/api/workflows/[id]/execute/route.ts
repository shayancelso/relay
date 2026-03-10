import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest/client'
import { NextResponse } from 'next/server'

// POST /api/workflows/[id]/execute — manually trigger a workflow run
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json().catch(() => ({}))

    // Load workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('id, org_id, status, name')
      .eq('id', id)
      .single()

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Determine account_id — use provided or pick first account in org
    let accountId = body.account_id
    if (!accountId) {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', workflow.org_id)
        .limit(1)

      accountId = accounts?.[0]?.id
    }

    if (!accountId) {
      return NextResponse.json({ error: 'No account available for test run' }, { status: 400 })
    }

    // Send Inngest event to start execution
    await inngest.send({
      name: 'relay/workflow.execute',
      data: {
        workflow_id: workflow.id,
        account_id: accountId,
        org_id: workflow.org_id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Workflow "${workflow.name}" execution started`,
      workflow_id: workflow.id,
      account_id: accountId,
    })
  } catch (err) {
    console.error('Workflow execute error:', err)
    return NextResponse.json({ error: 'Failed to trigger workflow' }, { status: 500 })
  }
}

import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/workflows/[id]/runs — fetch run history with step logs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: runs, error } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        step_logs:workflow_step_logs(*)
      `)
      .eq('workflow_id', id)
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json(runs || [])
  } catch (err) {
    console.error('Workflow runs fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}

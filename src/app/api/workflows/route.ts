import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/workflows — list all workflows for the org
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('Workflows fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

// POST /api/workflows — create a new workflow
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        org_id: body.org_id,
        name: body.name,
        description: body.description || null,
        status: body.status || 'draft',
        template_id: body.template_id || null,
        nodes: body.nodes || [],
        edges: body.edges || [],
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Workflow create error:', err)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}

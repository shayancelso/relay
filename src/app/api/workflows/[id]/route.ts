import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/workflows/[id] — fetch a single workflow
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Workflow fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

// PUT /api/workflows/[id] — update a workflow (save nodes/edges/name/status)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.status !== undefined) updates.status = body.status
    if (body.nodes !== undefined) updates.nodes = body.nodes
    if (body.edges !== undefined) updates.edges = body.edges
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('Workflow update error:', err)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

// DELETE /api/workflows/[id] — delete a workflow
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Workflow delete error:', err)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}

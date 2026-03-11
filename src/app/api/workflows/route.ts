import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/workflows — list all workflows for the org
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('workflows')
      .select('*')
      .eq('org_id', profile.org_id)
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const admin = createAdminClient()
    const body = await request.json()

    const { data, error } = await admin
      .from('workflows')
      .insert({
        org_id: profile.org_id,
        name: body.name,
        description: body.description || null,
        status: body.status || 'draft',
        template_id: body.template_id || null,
        nodes: body.nodes || [],
        edges: body.edges || [],
        created_by: user.id,
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

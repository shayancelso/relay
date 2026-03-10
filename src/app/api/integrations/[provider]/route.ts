import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper to get org_id from authenticated user
async function getOrgId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return profile?.org_id || null
}

// GET /api/integrations/[provider] — get single connection
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const orgId = await getOrgId()
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('integrations')
      .select('id, org_id, provider, auth_type, status, api_key_label, external_account_id, external_account_name, connected_by, connected_at, last_sync_at, last_error, config, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('provider', provider)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json(data || null)
  } catch (err) {
    console.error('Integration fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 })
  }
}

// PUT /api/integrations/[provider] — update config
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const orgId = await getOrgId()
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('integrations')
      .update({
        config: body.config || {},
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('provider', provider)
      .select('id, org_id, provider, auth_type, status, api_key_label, external_account_id, external_account_name, connected_by, connected_at, last_sync_at, last_error, config, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('Integration update error:', err)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

// DELETE /api/integrations/[provider] — disconnect
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const orgId = await getOrgId()
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('integrations')
      .delete()
      .eq('org_id', orgId)
      .eq('provider', provider)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Integration disconnect error:', err)
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 })
  }
}

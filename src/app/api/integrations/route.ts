import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'

// GET /api/integrations — list all connections for the user's org
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get user's org_id
    const { data: profile } = await admin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json([])
    }

    const { data: integrations, error } = await admin
      .from('integrations')
      .select('id, org_id, provider, auth_type, status, api_key_label, external_account_id, external_account_name, connected_by, connected_at, last_sync_at, last_error, config, created_at, updated_at')
      .eq('org_id', profile.org_id)

    if (error) throw error

    return NextResponse.json(integrations || [])
  } catch (err) {
    console.error('Integrations fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

// POST /api/integrations — connect a new integration (API key)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()
    const { provider, api_key, config } = body

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Get user's org_id
    const { data: profile } = await admin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'User has no organization' }, { status: 400 })
    }

    // Build the record
    const record: Record<string, unknown> = {
      org_id: profile.org_id,
      provider,
      auth_type: 'api_key',
      status: 'connected',
      connected_by: user.id,
      connected_at: new Date().toISOString(),
      config: config || {},
    }

    // Encrypt and store API key
    if (api_key) {
      record.api_key_encrypted = encrypt(api_key)
      record.api_key_label = `...${api_key.slice(-4)}`
    }

    // Upsert (one connection per provider per org)
    const { data: integration, error } = await admin
      .from('integrations')
      .upsert(record, { onConflict: 'org_id,provider' })
      .select('id, org_id, provider, auth_type, status, api_key_label, external_account_id, external_account_name, connected_by, connected_at, last_sync_at, last_error, config, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json(integration)
  } catch (err) {
    console.error('Integration connect error:', err)
    return NextResponse.json({ error: 'Failed to connect integration' }, { status: 500 })
  }
}

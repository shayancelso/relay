import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AccountImportRow } from '@/lib/csv/parser'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { accounts } = await request.json() as { accounts: AccountImportRow[] }

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Look up owner emails to get user IDs
    const ownerEmails = [...new Set(accounts.map(a => a.owner_email).filter(Boolean))]
    const { data: owners } = await supabase
      .from('users')
      .select('id, email')
      .eq('org_id', profile.org_id)
      .in('email', ownerEmails)

    const emailToId = new Map(owners?.map(o => [o.email, o.id]) || [])

    // Prepare rows for insert
    const rows = accounts.map(a => ({
      org_id: profile.org_id,
      name: a.name,
      arr: a.arr || 0,
      industry: a.industry || null,
      segment: a.segment || 'smb',
      health_score: a.health_score || 50,
      geography: a.geography || null,
      renewal_date: a.renewal_date || null,
      external_id: a.external_id || null,
      current_owner_id: a.owner_email ? emailToId.get(a.owner_email) || null : null,
    }))

    const { data: inserted, error } = await supabase
      .from('accounts')
      .insert(rows)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: inserted?.length || 0, errors: 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

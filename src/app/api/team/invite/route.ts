import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/team/invite — invite a new team member
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })
    }

    const { email, full_name, role } = await request.json()

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['admin', 'manager', 'rep'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if user already exists in this org
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('org_id', profile.org_id)
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'User already exists in this organization' }, { status: 409 })
    }

    // Create auth user with invite, passing metadata
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, org_id: profile.org_id, role },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Insert into users table
    const { data: newUser, error: userError } = await admin
      .from('users')
      .insert({
        id: authData.user.id,
        org_id: profile.org_id,
        email,
        full_name,
        role,
      })
      .select('id, email, full_name, role, avatar_url, capacity, specialties, created_at')
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (err) {
    console.error('Team invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

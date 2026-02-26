import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { user_id, full_name, email, org_name } = await request.json()

    if (!user_id || !full_name || !email || !org_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create organization
    const slug = org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: org_name, slug: `${slug}-${Date.now().toString(36)}` })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: user_id,
        org_id: org.id,
        email,
        full_name,
        role: 'admin',
      })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ org_id: org.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

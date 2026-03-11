import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/team — list all team members for the current user's org
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

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url, capacity, specialties, created_at')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('Team fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

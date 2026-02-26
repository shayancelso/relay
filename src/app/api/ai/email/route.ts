import { createClient } from '@/lib/supabase/server'
import { generateEmail } from '@/lib/ai/generate-email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const stream = await generateEmail({
      account_name: body.account_name,
      contact_name: body.contact_name,
      contact_title: body.contact_title,
      from_owner: body.from_owner,
      to_owner: body.to_owner,
      brief_summary: body.brief_summary,
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Email generation error:', err)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}

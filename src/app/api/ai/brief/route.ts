import { createClient } from '@/lib/supabase/server'
import { generateBrief } from '@/lib/ai/generate-brief'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const stream = await generateBrief({
      account: body.account,
      contacts: body.contacts || [],
      from_owner: body.from_owner,
      to_owner: body.to_owner,
      notes: body.notes,
    })

    // Save the brief after streaming completes
    // We'll collect the full content from the stream
    const [streamForClient, streamForSave] = stream.tee()

    // Save in background
    const savePromise = (async () => {
      const reader = streamForSave.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += decoder.decode(value)
      }

      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!profile) return

      // Upsert brief
      const { data: existing } = await supabase
        .from('transition_briefs')
        .select('id, version')
        .eq('transition_id', body.transition_id)
        .maybeSingle()

      if (existing) {
        await supabase.from('transition_briefs').update({
          content: fullContent,
          status: 'draft',
          ai_generated: true,
          generated_at: new Date().toISOString(),
          version: existing.version + 1,
        }).eq('id', existing.id)
      } else {
        await supabase.from('transition_briefs').insert({
          org_id: profile.org_id,
          transition_id: body.transition_id,
          content: fullContent,
          status: 'draft',
          ai_generated: true,
          generated_at: new Date().toISOString(),
        })
      }

      // Log activity
      await supabase.from('transition_activities').insert({
        org_id: profile.org_id,
        transition_id: body.transition_id,
        type: 'brief_generated',
        description: 'AI handoff brief generated',
        created_by: user.id,
      })
    })()

    // Don't await - let it complete in background
    savePromise.catch(console.error)

    return new Response(streamForClient, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Brief generation error:', err)
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
  }
}

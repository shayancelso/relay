import { createClient } from '@/lib/supabase/server'
import { sendTransitionEmail } from '@/lib/email/resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email_id, transition_id } = await request.json()

    // Get email details
    const { data: email } = await supabase
      .from('transition_emails')
      .select('*, contact:account_contacts(name, email)')
      .eq('id', email_id)
      .single()

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    if (!email.contact?.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 })
    }

    // Send via Resend
    const result = await sendTransitionEmail({
      to: email.contact.email,
      subject: email.subject,
      body: email.body,
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Update email status
    await supabase
      .from('transition_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', email_id)

    // Log activity
    const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (profile) {
      await supabase.from('transition_activities').insert({
        org_id: profile.org_id,
        transition_id,
        type: 'email_sent',
        description: `Intro email sent to ${email.contact.name}`,
        metadata: { email_id, resend_id: result.id },
        created_by: user.id,
      })

      // Auto-advance transition status
      await supabase
        .from('transitions')
        .update({ status: 'intro_sent' })
        .eq('id', transition_id)
        .in('status', ['draft', 'pending_approval', 'approved'])
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

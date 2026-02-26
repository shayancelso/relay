import { inngest } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

// Stall detection: runs every hour, flags transitions with no activity in 7+ days
export const detectStalledTransitions = inngest.createFunction(
  { id: 'detect-stalled-transitions', name: 'Detect Stalled Transitions' },
  { cron: '0 * * * *' }, // every hour
  async ({ step }) => {
    const supabase = createAdminClient()

    const stalledTransitions = await step.run('find-stalled', async () => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('transitions')
        .select('id, org_id, updated_at')
        .not('status', 'in', '("completed","cancelled","stalled")')
        .lt('updated_at', sevenDaysAgo.toISOString())

      if (error) throw error
      return data || []
    })

    if (stalledTransitions.length === 0) {
      return { stalled: 0 }
    }

    await step.run('mark-stalled', async () => {
      const ids = stalledTransitions.map(t => t.id)
      await supabase
        .from('transitions')
        .update({ status: 'stalled' })
        .in('id', ids)

      // Log activities
      const activities = stalledTransitions.map(t => ({
        org_id: t.org_id,
        transition_id: t.id,
        type: 'status_change' as const,
        description: 'Transition flagged as stalled (no activity for 7+ days)',
        metadata: { auto_detected: true },
      }))

      await supabase.from('transition_activities').insert(activities)
    })

    return { stalled: stalledTransitions.length }
  }
)

// Send email via Inngest (for reliable delivery)
export const sendTransitionEmailJob = inngest.createFunction(
  { id: 'send-transition-email', name: 'Send Transition Email' },
  { event: 'relay/email.send' },
  async ({ event, step }) => {
    const { email_id, transition_id } = event.data

    const supabase = createAdminClient()

    const email = await step.run('get-email', async () => {
      const { data, error } = await supabase
        .from('transition_emails')
        .select('*, contact:account_contacts(name, email)')
        .eq('id', email_id)
        .single()

      if (error) throw error
      return data
    })

    if (!email?.contact?.email) {
      return { error: 'No contact email' }
    }

    await step.run('send-via-resend', async () => {
      const { sendTransitionEmail } = await import('@/lib/email/resend')
      const result = await sendTransitionEmail({
        to: email.contact.email,
        subject: email.subject,
        body: email.body,
      })

      if ('error' in result) throw new Error(result.error)
      return result
    })

    await step.run('update-status', async () => {
      await supabase
        .from('transition_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', email_id)

      // Log activity
      await supabase.from('transition_activities').insert({
        org_id: email.org_id,
        transition_id,
        type: 'email_sent',
        description: `Email sent to ${email.contact.name}`,
        metadata: { email_id },
      })
    })

    return { sent: true }
  }
)

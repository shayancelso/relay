import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!)
  }
  return resendClient
}

export async function sendTransitionEmail(params: {
  to: string
  from?: string
  subject: string
  body: string
  replyTo?: string
}): Promise<{ id: string } | { error: string }> {
  const resend = getResendClient()

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || 'Relay <relay@yourdomain.com>',
      to: params.to,
      subject: params.subject,
      text: params.body,
      replyTo: params.replyTo,
    })

    if (error) {
      return { error: error.message }
    }

    return { id: data!.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

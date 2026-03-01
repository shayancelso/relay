import { NextRequest, NextResponse } from 'next/server'
import { sendTransitionEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  const { name, email, company, teamSize, monthlyTransitions, challenges, notes } = await req.json()

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/relay/demo'
  const notificationEmail = process.env.DEMO_NOTIFICATION_EMAIL

  const challengeList = Array.isArray(challenges) && challenges.length > 0
    ? challenges.map((c: string) => `  • ${c}`).join('\n')
    : '  (none selected)'

  const teamBody = [
    `Name:              ${name}`,
    `Email:             ${email}`,
    `Company:           ${company}`,
    `Team size:         ${teamSize}`,
    `Monthly transitions: ${monthlyTransitions || '(not provided)'}`,
    `Challenges:\n${challengeList}`,
    `Notes:             ${notes || '(none)'}`,
  ].join('\n')

  const confirmationBody = `Hi ${name},\n\nThanks for reaching out! We'll be in touch shortly to set up your personalized Relay demo.\n\nIn the meantime, you can book a time directly: ${calendlyUrl}\n\nTalk soon,\nThe Relay Team`

  const tasks: Promise<unknown>[] = [
    sendTransitionEmail({
      to: email,
      subject: 'Your Relay demo is confirmed',
      body: confirmationBody,
    }),
  ]

  if (notificationEmail) {
    tasks.push(
      sendTransitionEmail({
        to: notificationEmail,
        subject: `New demo request from ${name} at ${company}`,
        body: teamBody,
      })
    )
  }

  await Promise.allSettled(tasks)

  return NextResponse.json({ ok: true })
}

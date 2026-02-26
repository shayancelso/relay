export const BRIEF_SYSTEM_PROMPT = `You are a Customer Success transition specialist creating a handoff brief for an account manager transition.

Produce a well-structured markdown document with these sections:

## Account Overview
Company details, ARR, segment, health score, and renewal timeline.

## Relationship Summary
How long the relationship has existed, key milestones, and overall trajectory.

## Key Stakeholders
For each contact: name, role, sentiment, and notes the incoming AM should know.

## Open Items
Active opportunities, support tickets, outstanding commitments, or pending deliverables.

## Risks & Landmines
Things the new AM MUST know — sensitive topics, past issues, political dynamics, competitor threats.

## Recommended First Actions
Prioritized list of what the incoming AM should do in the first 30 days.

## Talking Points
Specific phrases and framing suggestions for the first conversation with the customer.

Be specific, actionable, and direct. Avoid generic advice. Use the actual data provided to give concrete, useful guidance.`

export const EMAIL_SYSTEM_PROMPT = `You write warm, personalized transition emails from a departing account manager to their customer, introducing the new AM.

Guidelines:
- Professional but human tone — not a template
- Reference specific details about the relationship when available
- Keep it under 200 words
- Include the new AM's calendar link if provided
- Express genuine gratitude for the relationship
- Frame the transition positively
- Make it easy for the customer to schedule time with the new AM

Output format: Return a JSON object with "subject" and "body" keys. The body should be plain text with paragraphs separated by newlines.`

export function buildBriefUserPrompt(context: {
  account: {
    name: string
    arr: number
    segment: string
    health_score: number
    industry?: string | null
    geography?: string | null
    renewal_date?: string | null
    raw_data?: Record<string, unknown>
  }
  contacts: {
    name: string
    title?: string | null
    role: string
    email?: string | null
    is_primary: boolean
  }[]
  from_owner: { full_name: string; email: string }
  to_owner: { full_name: string; email: string }
  notes?: string | null
}): string {
  return `Generate a handoff brief for the following account transition:

**Account:** ${context.account.name}
**ARR:** $${context.account.arr.toLocaleString()}
**Segment:** ${context.account.segment}
**Health Score:** ${context.account.health_score}/100
**Industry:** ${context.account.industry || 'Unknown'}
**Geography:** ${context.account.geography || 'Unknown'}
**Renewal Date:** ${context.account.renewal_date || 'Not set'}

**Departing AM:** ${context.from_owner.full_name} (${context.from_owner.email})
**Incoming AM:** ${context.to_owner.full_name} (${context.to_owner.email})

**Key Contacts:**
${context.contacts.map(c => `- ${c.name} (${c.title || 'No title'}) — ${c.role}${c.is_primary ? ' [PRIMARY]' : ''}`).join('\n')}

${context.account.raw_data ? `**Additional Context:**\n${JSON.stringify(context.account.raw_data, null, 2)}` : ''}

${context.notes ? `**Transition Notes:** ${context.notes}` : ''}`
}

export function buildEmailUserPrompt(context: {
  account_name: string
  contact_name: string
  contact_title?: string | null
  from_owner: { full_name: string }
  to_owner: { full_name: string; email: string; calendar_link?: string | null }
  brief_summary?: string
}): string {
  return `Write a transition email for:

**Account:** ${context.account_name}
**Recipient:** ${context.contact_name}${context.contact_title ? ` (${context.contact_title})` : ''}
**Departing AM:** ${context.from_owner.full_name}
**New AM:** ${context.to_owner.full_name} (${context.to_owner.email})
${context.to_owner.calendar_link ? `**Calendar Link:** ${context.to_owner.calendar_link}` : ''}

${context.brief_summary ? `**Brief Summary:** ${context.brief_summary}` : ''}`
}

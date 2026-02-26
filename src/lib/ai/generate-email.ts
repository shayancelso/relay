import { getAnthropicClient } from './client'
import { EMAIL_SYSTEM_PROMPT, buildEmailUserPrompt } from './prompts'

export interface GeneratedEmail {
  subject: string
  body: string
}

export async function generateEmail(context: Parameters<typeof buildEmailUserPrompt>[0]): Promise<ReadableStream> {
  const client = getAnthropicClient()
  const userPrompt = buildEmailUserPrompt(context)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })
}

export async function generateEmailSync(context: Parameters<typeof buildEmailUserPrompt>[0]): Promise<GeneratedEmail> {
  const client = getAnthropicClient()
  const userPrompt = buildEmailUserPrompt(context)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: EMAIL_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const text = textBlock?.text || '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // fallback
  }

  return { subject: 'Account Transition Introduction', body: text }
}

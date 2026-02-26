import { getAnthropicClient } from './client'
import { BRIEF_SYSTEM_PROMPT, buildBriefUserPrompt } from './prompts'

export async function generateBrief(context: Parameters<typeof buildBriefUserPrompt>[0]): Promise<ReadableStream> {
  const client = getAnthropicClient()
  const userPrompt = buildBriefUserPrompt(context)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: BRIEF_SYSTEM_PROMPT,
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

export async function generateBriefSync(context: Parameters<typeof buildBriefUserPrompt>[0]): Promise<string> {
  const client = getAnthropicClient()
  const userPrompt = buildBriefUserPrompt(context)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: BRIEF_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.text || ''
}

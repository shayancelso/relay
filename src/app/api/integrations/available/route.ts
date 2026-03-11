import { getOAuthConfig, oauthProviders } from '@/lib/integrations/oauth-config'
import { NextResponse } from 'next/server'

// GET /api/integrations/available — returns which OAuth providers have credentials configured
export async function GET() {
  const available: Record<string, boolean> = {}

  for (const provider of Object.keys(oauthProviders)) {
    const config = getOAuthConfig(provider)
    if (config) {
      const clientId = process.env[config.clientIdEnv]
      const clientSecret = process.env[config.clientSecretEnv]
      available[provider] = !!(clientId && clientSecret)
    }
  }

  return NextResponse.json(available)
}

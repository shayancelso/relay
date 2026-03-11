import { getOAuthConfig, getCallbackUrl } from '@/lib/integrations/oauth-config'
import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'

// GET /api/integrations/oauth-debug?provider=salesforce — show auth URL for debugging (no auth required)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') || 'salesforce'

  const config = getOAuthConfig(provider)
  if (!config) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]

  // Generate PKCE
  const verifier = randomBytes(32).toString('hex')
  const challenge = createHash('sha256')
    .update(verifier, 'ascii')
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const callbackUrl = getCallbackUrl(provider)

  // Build authorization URL
  const authUrl = new URL(config.authorizeUrl)
  authUrl.searchParams.set('client_id', clientId || 'MISSING')
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', config.scopes.join(' '))
  authUrl.searchParams.set('state', 'debug_state')
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.json({
    provider,
    client_id_set: !!clientId,
    client_secret_set: !!clientSecret,
    client_id_preview: clientId ? clientId.substring(0, 15) + '...' : 'MISSING',
    callback_url: callbackUrl,
    scopes: config.scopes,
    authorize_url: config.authorizeUrl,
    code_challenge: challenge,
    code_challenge_length: challenge.length,
    verifier_length: verifier.length,
    full_auth_url: authUrl.toString(),
    full_auth_url_length: authUrl.toString().length,
  })
}

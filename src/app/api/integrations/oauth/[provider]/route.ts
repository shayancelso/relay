import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOAuthConfig, getCallbackUrl } from '@/lib/integrations/oauth-config'
import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'

// Generate PKCE code verifier and challenge (RFC 7636)
function generatePKCE() {
  // Use hex encoding for verifier (64 chars, all alphanumeric, avoids base64url edge cases)
  const verifier = randomBytes(32).toString('hex')
  // SHA256 hash → manual base64url encoding (no padding)
  const challenge = createHash('sha256')
    .update(verifier, 'ascii')
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return { verifier, challenge }
}

// GET /api/integrations/oauth/[provider] — initiate OAuth flow
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Get user's org_id
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.redirect(new URL('/integrations?error=no_org', request.url))
    }

    // Get OAuth config for this provider
    const config = getOAuthConfig(provider)
    if (!config) {
      return NextResponse.redirect(new URL(`/integrations?error=unsupported_provider`, request.url))
    }

    // Check if client credentials are configured
    const clientId = process.env[config.clientIdEnv]
    const clientSecret = process.env[config.clientSecretEnv]
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL(`/integrations?error=not_configured`, request.url))
    }

    // Generate PKCE
    const { verifier, challenge } = generatePKCE()

    // Generate state parameter (CSRF protection + carries org context + PKCE verifier)
    const stateData = JSON.stringify({
      org_id: profile.org_id,
      user_id: user.id,
      provider,
      nonce: randomBytes(16).toString('hex'),
      code_verifier: verifier,
    })
    const state = Buffer.from(stateData).toString('base64url')

    // Build the callback URL
    const callbackUrl = getCallbackUrl(provider)

    // Build authorization URL
    const authUrl = new URL(config.authorizeUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.scopes.join(' '))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    // Provider-specific params
    if (provider === 'gcal' || provider === 'gmail') {
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
    }

    // Store state in cookie for CSRF validation on callback
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('OAuth initiate error:', err)
    return NextResponse.redirect(new URL('/integrations?error=oauth_failed', request.url))
  }
}

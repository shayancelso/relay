import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'
import { getOAuthConfig, getCallbackUrl } from '@/lib/integrations/oauth-config'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/integrations/oauth/callback — handle OAuth redirect
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    const provider = url.searchParams.get('provider')

    // User denied access
    if (error) {
      return NextResponse.redirect(new URL(`/integrations?error=access_denied`, request.url))
    }

    if (!code || !state || !provider) {
      return NextResponse.redirect(new URL(`/integrations?error=missing_params`, request.url))
    }

    // Validate state against cookie
    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL(`/integrations?error=invalid_state`, request.url))
    }

    // Decode state to get org_id and user_id
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { org_id, user_id } = stateData

    if (!org_id || !user_id) {
      return NextResponse.redirect(new URL(`/integrations?error=invalid_state`, request.url))
    }

    // Get OAuth config
    const config = getOAuthConfig(provider)
    if (!config) {
      return NextResponse.redirect(new URL(`/integrations?error=unsupported_provider`, request.url))
    }

    const clientId = process.env[config.clientIdEnv]!
    const clientSecret = process.env[config.clientSecretEnv]!
    const callbackUrl = getCallbackUrl(provider)

    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
    })

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('Token exchange failed:', errBody)
      return NextResponse.redirect(new URL(`/integrations?error=token_exchange_failed`, request.url))
    }

    const tokenData = await tokenRes.json()

    // Extract tokens (field names vary by provider)
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in // seconds
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null

    // Extract provider-specific account info
    let externalAccountId: string | null = null
    let externalAccountName: string | null = null

    if (provider === 'salesforce') {
      // Salesforce returns instance_url and id in the token response
      externalAccountId = tokenData.instance_url || null
      externalAccountName = tokenData.instance_url
        ? new URL(tokenData.instance_url).hostname.replace('.my.salesforce.com', '')
        : null
    } else if (provider === 'slack') {
      externalAccountId = tokenData.team?.id || null
      externalAccountName = tokenData.team?.name || null
    } else if (provider === 'hubspot') {
      externalAccountId = tokenData.hub_id?.toString() || null
    }

    // Store in database
    const admin = createAdminClient()
    const { error: dbError } = await admin
      .from('integrations')
      .upsert({
        org_id,
        provider,
        auth_type: 'oauth2',
        status: 'connected',
        access_token_encrypted: encrypt(accessToken),
        refresh_token_encrypted: refreshToken ? encrypt(refreshToken) : null,
        token_expires_at: tokenExpiresAt,
        oauth_metadata: {
          scope: tokenData.scope,
          token_type: tokenData.token_type,
        },
        external_account_id: externalAccountId,
        external_account_name: externalAccountName,
        connected_by: user_id,
        connected_at: new Date().toISOString(),
        config: {},
      }, { onConflict: 'org_id,provider' })

    if (dbError) {
      console.error('DB upsert error:', dbError)
      return NextResponse.redirect(new URL(`/integrations?error=db_error`, request.url))
    }

    // Clear the state cookie
    const response = NextResponse.redirect(new URL(`/integrations?connected=${provider}`, request.url))
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=callback_failed`, request.url))
  }
}

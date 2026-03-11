// OAuth provider configurations
// Each provider defines its authorize URL, token URL, scopes, and env var names

export interface OAuthProviderConfig {
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
}

export const oauthProviders: Record<string, OAuthProviderConfig> = {
  salesforce: {
    authorizeUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token', 'id'],
    clientIdEnv: 'SALESFORCE_CLIENT_ID',
    clientSecretEnv: 'SALESFORCE_CLIENT_SECRET',
  },
  hubspot: {
    authorizeUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read', 'crm.objects.companies.read'],
    clientIdEnv: 'HUBSPOT_CLIENT_ID',
    clientSecretEnv: 'HUBSPOT_CLIENT_SECRET',
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read', 'incoming-webhook'],
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
  },
  gcal: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  gmail: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  teams: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['User.Read', 'ChannelMessage.Send', 'Channel.ReadBasic.All'],
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
  outlookcal: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Calendars.ReadWrite', 'User.Read'],
    clientIdEnv: 'MICROSOFT_CLIENT_ID',
    clientSecretEnv: 'MICROSOFT_CLIENT_SECRET',
  },
}

export function getOAuthConfig(provider: string): OAuthProviderConfig | null {
  return oauthProviders[provider] || null
}

export function getCallbackUrl(provider: string): string {
  let base = 'http://localhost:3000'
  if (process.env.NEXT_PUBLIC_APP_URL) {
    base = process.env.NEXT_PUBLIC_APP_URL
  } else if (process.env.VERCEL_URL) {
    base = `https://${process.env.VERCEL_URL}`
  }
  return `${base}/api/integrations/oauth/callback?provider=${provider}`
}

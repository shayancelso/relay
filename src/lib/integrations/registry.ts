import type { IntegrationAuthType, IntegrationProvider } from '@/types'

export interface IntegrationDefinition {
  id: IntegrationProvider
  name: string
  category: string
  description: string
  icon: string
  color: string
  authType: IntegrationAuthType
  keyPlaceholder?: string
  keyHelpUrl?: string
}

export const integrationRegistry: IntegrationDefinition[] = [
  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Bi-directional sync: accounts, contacts, opportunities, activity history',
    icon: 'S',
    color: 'bg-sky-500',
    authType: 'oauth2',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Contacts, deals, and engagement data',
    icon: 'H',
    color: 'bg-orange-500',
    authType: 'oauth2',
  },
  // Customer Success
  {
    id: 'gainsight',
    name: 'Gainsight',
    category: 'Customer Success',
    description: 'Health scores, CSM assignments, success plans, risk alerts',
    icon: 'G',
    color: 'bg-violet-500',
    authType: 'api_key',
    keyPlaceholder: 'gs_key_...',
    keyHelpUrl: 'https://support.gainsight.com/SFDC_Edition/Connectors/Connectors/Generate_API_Access_Key',
  },
  {
    id: 'totango',
    name: 'Totango',
    category: 'Customer Success',
    description: 'Customer health, segments, and lifecycle data',
    icon: 'T',
    color: 'bg-teal-500',
    authType: 'api_key',
    keyPlaceholder: 'app-token/...',
  },
  {
    id: 'churnzero',
    name: 'ChurnZero',
    category: 'Customer Success',
    description: 'Usage data, health scores, and engagement metrics',
    icon: 'C',
    color: 'bg-rose-500',
    authType: 'api_key',
    keyPlaceholder: 'cz_...',
  },
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Transition notifications, approval requests, and status updates',
    icon: 'Sl',
    color: 'bg-emerald-600',
    authType: 'oauth2',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Transition notifications and approval workflows',
    icon: 'MT',
    color: 'bg-indigo-500',
    authType: 'oauth2',
  },
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    category: 'Communication',
    description: 'Email tracking for intro emails sent during transitions',
    icon: 'Em',
    color: 'bg-red-500',
    authType: 'oauth2',
  },
  // Support
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'Support',
    description: 'Open tickets and support history included in handoff briefs',
    icon: 'Z',
    color: 'bg-yellow-500',
    authType: 'api_key',
    keyPlaceholder: 'your-subdomain:user@email.com/token:api_token',
    keyHelpUrl: 'https://support.zendesk.com/hc/en-us/articles/4408889192858',
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'Support',
    description: 'Conversation history and customer health signals',
    icon: 'In',
    color: 'bg-blue-500',
    authType: 'api_key',
    keyPlaceholder: 'dG9r...',
    keyHelpUrl: 'https://developers.intercom.com/docs/build-an-integration/learn-more/authentication',
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    category: 'Support',
    description: 'Ticket history and CSAT scores for handoff context',
    icon: 'Fr',
    color: 'bg-cyan-500',
    authType: 'api_key',
    keyPlaceholder: 'your-subdomain:api_key',
  },
  // Calendar
  {
    id: 'gcal',
    name: 'Google Calendar',
    category: 'Calendar',
    description: 'Auto-schedule handoff meetings and check rep availability',
    icon: 'GC',
    color: 'bg-blue-600',
    authType: 'oauth2',
  },
  {
    id: 'outlookcal',
    name: 'Outlook Calendar',
    category: 'Calendar',
    description: 'Availability sync and meeting scheduling',
    icon: 'OC',
    color: 'bg-sky-600',
    authType: 'oauth2',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'Calendar',
    description: 'Customer-facing scheduling links embedded in transition emails',
    icon: 'Ca',
    color: 'bg-blue-400',
    authType: 'api_key',
    keyPlaceholder: 'eyJhbG...',
    keyHelpUrl: 'https://developer.calendly.com/how-to-authenticate-with-personal-access-tokens',
  },
]

// Group by category for display
export function getIntegrationGroups() {
  const categoryOrder = ['CRM', 'Customer Success', 'Communication', 'Support', 'Calendar']
  const grouped = new Map<string, IntegrationDefinition[]>()

  for (const def of integrationRegistry) {
    const list = grouped.get(def.category) || []
    list.push(def)
    grouped.set(def.category, list)
  }

  return categoryOrder
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({ label: cat, items: grouped.get(cat)! }))
}

export function getIntegrationDef(provider: string): IntegrationDefinition | undefined {
  return integrationRegistry.find((d) => d.id === provider)
}

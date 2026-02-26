export type UserRole = 'admin' | 'manager' | 'rep'
export type AccountSegment = 'commercial' | 'corporate' | 'enterprise' | 'fins' | 'international'
export type AccountSubSegment = 'smb' | 'mid_market' | 'enterprise'
export type ContactRole = 'champion' | 'decision_maker' | 'end_user' | 'exec_sponsor'
export type TransitionStatus = 'draft' | 'pending_approval' | 'approved' | 'intro_sent' | 'meeting_booked' | 'in_progress' | 'completed' | 'stalled' | 'cancelled'
export type TransitionReason = 'territory_change' | 'rep_departure' | 'rebalance' | 'promotion' | 'performance'
export type TransitionPriority = 'critical' | 'high' | 'medium' | 'low'
export type BriefStatus = 'generating' | 'draft' | 'reviewed' | 'approved'
export type EmailType = 'warm_intro' | 'follow_up' | 'internal_handoff'
export type EmailStatus = 'draft' | 'approved' | 'sent' | 'opened' | 'replied'
export type ActivityType = 'status_change' | 'brief_generated' | 'email_sent' | 'meeting_booked' | 'note_added'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  org_id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  calendar_link: string | null
  capacity: number
  specialties: string[]
  created_at: string
}

export interface Account {
  id: string
  org_id: string
  external_id: string | null
  name: string
  industry: string | null
  arr: number
  health_score: number
  geography: string | null
  segment: AccountSegment
  renewal_date: string | null
  sub_segment: AccountSubSegment | null
  employee_count: number
  country: string | null
  current_owner_id: string | null
  crm_source: string | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined fields
  current_owner?: User
  contacts?: AccountContact[]
}

export interface AccountContact {
  id: string
  account_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  role: ContactRole
  is_primary: boolean
  created_at: string
}

export interface Transition {
  id: string
  org_id: string
  account_id: string
  from_owner_id: string | null
  to_owner_id: string | null
  status: TransitionStatus
  reason: TransitionReason
  priority: TransitionPriority
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  account?: Account
  from_owner?: User
  to_owner?: User
  brief?: TransitionBrief
  emails?: TransitionEmail[]
  activities?: TransitionActivity[]
}

export interface TransitionBrief {
  id: string
  org_id: string
  transition_id: string
  content: string
  status: BriefStatus
  version: number
  ai_generated: boolean
  generated_at: string | null
  edited_at: string | null
  created_at: string
}

export interface TransitionEmail {
  id: string
  org_id: string
  transition_id: string
  contact_id: string | null
  type: EmailType
  subject: string
  body: string
  status: EmailStatus
  sent_at: string | null
  ai_generated: boolean
  created_at: string
  // Joined
  contact?: AccountContact
}

export interface TransitionActivity {
  id: string
  org_id: string
  transition_id: string
  type: ActivityType
  description: string
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  // Joined
  created_by_user?: User
}

export interface AssignmentRule {
  id: string
  org_id: string
  name: string
  rules: RuleCondition[]
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
  value: string | number | string[]
  action?: {
    type: 'assign_pool' | 'round_robin' | 'least_loaded'
    target_ids?: string[]
  }
}

export interface AssignmentRecommendation {
  account_id: string
  account_name: string
  recommendations: {
    user_id: string
    user_name: string
    score: number
    breakdown: {
      capacity: number
      arr_match: number
      industry_match: number
      geography_match: number
      health_score: number
    }
  }[]
}

export interface DashboardMetrics {
  active_transitions: number
  intros_sent_this_week: number
  meetings_booked: number
  stalled_count: number
  at_risk_count: number
  total_arr_in_transition: number
}

export interface PipelineItem {
  status: TransitionStatus
  count: number
}

export interface RepWorkload {
  id: string
  full_name: string
  capacity: number
  account_count: number
  active_transitions: number
}

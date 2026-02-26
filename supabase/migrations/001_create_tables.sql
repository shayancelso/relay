-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (references auth.users)
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'rep',
  avatar_url TEXT,
  calendar_link TEXT,
  capacity INT DEFAULT 25,
  specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts
CREATE TYPE account_segment AS ENUM ('enterprise', 'mid_market', 'smb');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  industry TEXT,
  arr DECIMAL(12,2) DEFAULT 0,
  health_score INT DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  geography TEXT,
  segment account_segment DEFAULT 'smb',
  renewal_date DATE,
  current_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  crm_source TEXT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Account Contacts
CREATE TYPE contact_role AS ENUM ('champion', 'decision_maker', 'end_user', 'exec_sponsor');

CREATE TABLE account_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  role contact_role DEFAULT 'end_user',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transitions
CREATE TYPE transition_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'intro_sent',
  'meeting_booked', 'in_progress', 'completed', 'stalled', 'cancelled'
);

CREATE TYPE transition_reason AS ENUM (
  'territory_change', 'rep_departure', 'rebalance', 'promotion', 'performance'
);

CREATE TYPE transition_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  from_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status transition_status NOT NULL DEFAULT 'draft',
  reason transition_reason NOT NULL DEFAULT 'territory_change',
  priority transition_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transition Briefs
CREATE TYPE brief_status AS ENUM ('generating', 'draft', 'reviewed', 'approved');

CREATE TABLE transition_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transition_id UUID NOT NULL UNIQUE REFERENCES transitions(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  status brief_status NOT NULL DEFAULT 'draft',
  version INT DEFAULT 1,
  ai_generated BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transition Emails
CREATE TYPE email_type AS ENUM ('warm_intro', 'follow_up', 'internal_handoff');
CREATE TYPE email_status AS ENUM ('draft', 'approved', 'sent', 'opened', 'replied');

CREATE TABLE transition_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transition_id UUID NOT NULL REFERENCES transitions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES account_contacts(id) ON DELETE SET NULL,
  type email_type NOT NULL DEFAULT 'warm_intro',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status email_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transition Activities (audit trail)
CREATE TYPE activity_type AS ENUM (
  'status_change', 'brief_generated', 'email_sent',
  'meeting_booked', 'note_added'
);

CREATE TABLE transition_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transition_id UUID NOT NULL REFERENCES transitions(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assignment Rules
CREATE TABLE assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER transitions_updated_at BEFORE UPDATE ON transitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assignment_rules_updated_at BEFORE UPDATE ON assignment_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_transitions_org_status ON transitions(org_id, status);
CREATE INDEX idx_transitions_org_status_updated ON transitions(org_id, status, updated_at);
CREATE INDEX idx_accounts_org_owner ON accounts(org_id, current_owner_id);
CREATE INDEX idx_accounts_org_health ON accounts(org_id, health_score);
CREATE INDEX idx_account_contacts_account ON account_contacts(account_id);
CREATE INDEX idx_transition_activities_transition ON transition_activities(transition_id);
CREATE INDEX idx_transition_emails_transition ON transition_emails(transition_id);
CREATE INDEX idx_users_org ON users(org_id);

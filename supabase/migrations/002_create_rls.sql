-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can only see their own org
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "Users can update own org" ON organizations
  FOR UPDATE USING (id = get_user_org_id());

-- Users: can see users in same org
CREATE POLICY "Users can view org members" ON users
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert self" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update self" ON users
  FOR UPDATE USING (id = auth.uid());

-- For all other tables, org_id isolation
-- Accounts
CREATE POLICY "org_isolation" ON accounts FOR ALL
  USING (org_id = get_user_org_id());

-- Account Contacts (through account's org)
CREATE POLICY "org_isolation" ON account_contacts FOR ALL
  USING (account_id IN (SELECT id FROM accounts WHERE org_id = get_user_org_id()));

-- Transitions
CREATE POLICY "org_isolation" ON transitions FOR ALL
  USING (org_id = get_user_org_id());

-- Transition Briefs
CREATE POLICY "org_isolation" ON transition_briefs FOR ALL
  USING (org_id = get_user_org_id());

-- Transition Emails
CREATE POLICY "org_isolation" ON transition_emails FOR ALL
  USING (org_id = get_user_org_id());

-- Transition Activities
CREATE POLICY "org_isolation" ON transition_activities FOR ALL
  USING (org_id = get_user_org_id());

-- Assignment Rules
CREATE POLICY "org_isolation" ON assignment_rules FOR ALL
  USING (org_id = get_user_org_id());

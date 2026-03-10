-- Integration connection status
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'pending');

-- Connected integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  status integration_status NOT NULL DEFAULT 'disconnected',

  -- API key storage
  api_key_encrypted TEXT,
  api_key_label TEXT,

  -- OAuth token storage
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_metadata JSONB DEFAULT '{}',

  -- Connection info
  external_account_id TEXT,
  external_account_name TEXT,
  connected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, provider)
);

CREATE INDEX idx_integrations_org ON integrations(org_id);
CREATE INDEX idx_integrations_status ON integrations(org_id, status);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON integrations FOR ALL
  USING (org_id = get_user_org_id());

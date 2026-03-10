-- Workflow definitions
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status workflow_status NOT NULL DEFAULT 'draft',
  template_id TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow runs (one per execution per account)
CREATE TYPE workflow_run_status AS ENUM ('running', 'completed', 'failed', 'cancelled');

CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status workflow_run_status NOT NULL DEFAULT 'running',
  current_node_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step execution log
CREATE TYPE workflow_step_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

CREATE TABLE workflow_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status workflow_step_status NOT NULL DEFAULT 'pending',
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflows_org ON workflows(org_id);
CREATE INDEX idx_workflows_status ON workflows(org_id, status);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_account ON workflow_runs(account_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(org_id, status);
CREATE INDEX idx_workflow_step_logs_run ON workflow_step_logs(run_id);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org isolation" ON workflows
  FOR ALL USING (org_id = get_user_org_id());

CREATE POLICY "org isolation" ON workflow_runs
  FOR ALL USING (org_id = get_user_org_id());

CREATE POLICY "org isolation" ON workflow_step_logs
  FOR ALL USING (
    run_id IN (SELECT id FROM workflow_runs WHERE org_id = get_user_org_id())
  );

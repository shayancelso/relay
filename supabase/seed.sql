-- =============================================================================
-- Relay Demo Seed Data
-- =============================================================================
-- This seed file populates the database with realistic demo data for the Relay
-- account transition management platform.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Organization
-- -----------------------------------------------------------------------------
INSERT INTO organizations (id, name, slug, logo_url, settings) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Acme Corp', 'acme-corp', NULL, '{
    "timezone": "America/New_York",
    "default_transition_due_days": 14,
    "auto_generate_briefs": true,
    "email_notifications": true,
    "stale_threshold_days": 5
  }');

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
-- NOTE: These user inserts are commented out because they reference auth.users,
-- which requires corresponding entries in Supabase Auth. In a real environment,
-- users are created through the Auth signup flow first, then their profiles are
-- inserted here. These are provided as reference for the expected user data.
--
-- To use these in local development, first create matching auth.users entries
-- via the Supabase Auth Admin API or dashboard, then uncomment these inserts.
-- -----------------------------------------------------------------------------

-- INSERT INTO users (id, org_id, email, full_name, role, avatar_url, calendar_link, capacity, specialties) VALUES
--   (
--     'aaaaaaaa-1111-4000-8000-000000000001',
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--     'sarah.chen@acmecorp.com',
--     'Sarah Chen',
--     'admin',
--     NULL,
--     'https://cal.com/sarah-chen',
--     30,
--     ARRAY['enterprise', 'healthcare', 'fintech']
--   ),
--   (
--     'aaaaaaaa-2222-4000-8000-000000000002',
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--     'marcus.johnson@acmecorp.com',
--     'Marcus Johnson',
--     'manager',
--     NULL,
--     'https://cal.com/marcus-johnson',
--     25,
--     ARRAY['mid_market', 'saas', 'retail']
--   ),
--   (
--     'aaaaaaaa-3333-4000-8000-000000000003',
--     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--     'elena.rodriguez@acmecorp.com',
--     'Elena Rodriguez',
--     'rep',
--     NULL,
--     'https://cal.com/elena-rodriguez',
--     20,
--     ARRAY['smb', 'ecommerce', 'logistics']
--   );

-- For the remaining seed data, we use the placeholder user UUIDs.
-- These will only work if the corresponding users rows exist.
-- In development, you can temporarily disable the foreign key checks or
-- create the auth.users + users rows first.

-- -----------------------------------------------------------------------------
-- Accounts (20 realistic accounts)
-- -----------------------------------------------------------------------------
-- NOTE: current_owner_id is set to NULL here because users may not exist yet.
-- Update these after creating users via Auth.
-- -----------------------------------------------------------------------------

INSERT INTO accounts (id, org_id, external_id, name, industry, arr, health_score, geography, segment, renewal_date, current_owner_id, crm_source) VALUES
  -- Enterprise accounts
  ('b0000001-0000-4000-8000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10001', 'Northwind Health Systems', 'Healthcare', 480000.00, 82, 'US - Northeast', 'enterprise',
   '2026-09-15', NULL, 'salesforce'),

  ('b0000002-0000-4000-8000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10002', 'Meridian Financial Group', 'FinTech', 425000.00, 91, 'US - West', 'enterprise',
   '2026-11-30', NULL, 'salesforce'),

  ('b0000003-0000-4000-8000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10003', 'TechVantage Solutions', 'SaaS', 350000.00, 45, 'US - West', 'enterprise',
   '2026-06-01', NULL, 'salesforce'),

  ('b0000004-0000-4000-8000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10004', 'Atlas Manufacturing Inc', 'Manufacturing', 500000.00, 73, 'US - Midwest', 'enterprise',
   '2026-12-31', NULL, 'salesforce'),

  ('b0000005-0000-4000-8000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10005', 'Pinnacle Insurance Co', 'Insurance', 390000.00, 68, 'US - South', 'enterprise',
   '2026-08-15', NULL, 'salesforce'),

  ('b0000006-0000-4000-8000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10006', 'GlobalEdge Logistics', 'Logistics', 310000.00, 55, 'EMEA - UK', 'enterprise',
   '2026-07-01', NULL, 'salesforce'),

  -- Mid-market accounts
  ('b0000007-0000-4000-8000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10007', 'BrightPath Education', 'EdTech', 145000.00, 88, 'US - Northeast', 'mid_market',
   '2026-10-01', NULL, 'salesforce'),

  ('b0000008-0000-4000-8000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10008', 'Verdant Energy Corp', 'Energy', 180000.00, 76, 'US - South', 'mid_market',
   '2026-05-15', NULL, 'hubspot'),

  ('b0000009-0000-4000-8000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10009', 'ClearView Analytics', 'SaaS', 120000.00, 62, 'US - West', 'mid_market',
   '2027-01-15', NULL, 'salesforce'),

  ('b0000010-0000-4000-8000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10010', 'Redstone Retail Group', 'Retail', 165000.00, 39, 'US - Midwest', 'mid_market',
   '2026-04-30', NULL, 'hubspot'),

  ('b0000011-0000-4000-8000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10011', 'NovaCare Medical', 'Healthcare', 195000.00, 84, 'US - West', 'mid_market',
   '2026-09-30', NULL, 'salesforce'),

  ('b0000012-0000-4000-8000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10012', 'Stratos Cloud Services', 'SaaS', 135000.00, 71, 'EMEA - Germany', 'mid_market',
   '2026-11-15', NULL, 'salesforce'),

  ('b0000013-0000-4000-8000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'SF-10013', 'Harbor Freight Digital', 'eCommerce', 110000.00, 57, 'US - Northeast', 'mid_market',
   '2026-08-01', NULL, 'hubspot'),

  -- SMB accounts
  ('b0000014-0000-4000-8000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20001', 'Bloom & Co Design Studio', 'Creative Services', 24000.00, 93, 'US - West', 'smb',
   '2026-06-15', NULL, 'hubspot'),

  ('b0000015-0000-4000-8000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20002', 'QuickShip Fulfillment', 'Logistics', 36000.00, 80, 'US - South', 'smb',
   '2026-07-31', NULL, 'hubspot'),

  ('b0000016-0000-4000-8000-000000000016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20003', 'Maple Street Bakeries', 'Food & Beverage', 18000.00, 47, 'US - Midwest', 'smb',
   '2026-05-01', NULL, 'hubspot'),

  ('b0000017-0000-4000-8000-000000000017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20004', 'SurePoint Legal Tech', 'LegalTech', 42000.00, 65, 'US - South', 'smb',
   '2026-10-15', NULL, 'hubspot'),

  ('b0000018-0000-4000-8000-000000000018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20005', 'PeakFit Wellness', 'Health & Wellness', 15000.00, 88, 'US - West', 'smb',
   '2026-12-01', NULL, 'hubspot'),

  ('b0000019-0000-4000-8000-000000000019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20006', 'Ironclad Security Solutions', 'Cybersecurity', 48000.00, 72, 'US - Northeast', 'smb',
   '2026-09-01', NULL, 'salesforce'),

  ('b0000020-0000-4000-8000-000000000020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'HS-20007', 'Cascade Data Systems', 'SaaS', 29000.00, 34, 'APAC - Australia', 'smb',
   '2026-04-15', NULL, 'hubspot');

-- -----------------------------------------------------------------------------
-- Account Contacts (8 contacts across various accounts)
-- -----------------------------------------------------------------------------

INSERT INTO account_contacts (id, account_id, name, title, email, phone, role, is_primary) VALUES
  -- Northwind Health Systems contacts
  ('c0000001-0000-4000-8000-000000000001', 'b0000001-0000-4000-8000-000000000001',
   'Dr. Patricia Holloway', 'VP of Operations', 'p.holloway@northwindhealth.com',
   '+1-617-555-0142', 'exec_sponsor', true),

  ('c0000002-0000-4000-8000-000000000002', 'b0000001-0000-4000-8000-000000000001',
   'James Whitfield', 'IT Director', 'j.whitfield@northwindhealth.com',
   '+1-617-555-0198', 'champion', false),

  -- Meridian Financial Group contacts
  ('c0000003-0000-4000-8000-000000000003', 'b0000002-0000-4000-8000-000000000002',
   'Linda Nakamura', 'Chief Technology Officer', 'l.nakamura@meridianfg.com',
   '+1-415-555-0234', 'decision_maker', true),

  -- TechVantage Solutions contacts
  ('c0000004-0000-4000-8000-000000000004', 'b0000003-0000-4000-8000-000000000003',
   'Ryan Patel', 'Head of Engineering', 'ryan.patel@techvantage.io',
   '+1-650-555-0371', 'champion', true),

  ('c0000005-0000-4000-8000-000000000005', 'b0000003-0000-4000-8000-000000000003',
   'Samantha Lee', 'Product Manager', 's.lee@techvantage.io',
   '+1-650-555-0399', 'end_user', false),

  -- BrightPath Education contact
  ('c0000006-0000-4000-8000-000000000006', 'b0000007-0000-4000-8000-000000000007',
   'Michael Torres', 'Director of Digital Learning', 'm.torres@brightpathedu.org',
   '+1-212-555-0456', 'decision_maker', true),

  -- Redstone Retail Group contact
  ('c0000007-0000-4000-8000-000000000007', 'b0000010-0000-4000-8000-000000000010',
   'Karen Wu', 'VP of Merchandising', 'k.wu@redstonertl.com',
   '+1-312-555-0523', 'exec_sponsor', true),

  -- Cascade Data Systems contact
  ('c0000008-0000-4000-8000-000000000008', 'b0000020-0000-4000-8000-000000000020',
   'Tom Hargreaves', 'Founder & CEO', 'tom@cascadedata.io',
   '+61-2-5555-0612', 'decision_maker', true);

-- -----------------------------------------------------------------------------
-- Transitions (5 sample transitions in various statuses)
-- -----------------------------------------------------------------------------
-- NOTE: from_owner_id and to_owner_id are set to NULL here because users may
-- not exist yet. Update these after creating users via Auth.
-- -----------------------------------------------------------------------------

INSERT INTO transitions (id, org_id, account_id, from_owner_id, to_owner_id, status, reason, priority, due_date, completed_at, notes) VALUES
  -- TechVantage: critical, low health score, territory change in progress
  ('d0000001-0000-4000-8000-000000000001',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'b0000003-0000-4000-8000-000000000003',
   NULL, NULL,
   'in_progress', 'territory_change', 'critical',
   '2026-03-10', NULL,
   'High-value enterprise account with declining health score. Champion (Ryan Patel) has expressed concerns about the transition. Needs careful handling.'),

  -- Redstone Retail: stalled, low health score
  ('d0000002-0000-4000-8000-000000000002',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'b0000010-0000-4000-8000-000000000010',
   NULL, NULL,
   'stalled', 'rep_departure', 'high',
   '2026-02-28', NULL,
   'Previous rep left abruptly. Karen Wu has not responded to intro emails. Renewal coming up in April - urgent.'),

  -- BrightPath Education: intro sent, going well
  ('d0000003-0000-4000-8000-000000000003',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'b0000007-0000-4000-8000-000000000007',
   NULL, NULL,
   'intro_sent', 'rebalance', 'medium',
   '2026-03-20', NULL,
   'Rebalancing mid-market accounts. Michael Torres acknowledged the intro email and is open to meeting the new rep.'),

  -- Cascade Data: draft, just created
  ('d0000004-0000-4000-8000-000000000004',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'b0000020-0000-4000-8000-000000000020',
   NULL, NULL,
   'draft', 'performance', 'low',
   '2026-04-01', NULL,
   'SMB account with low health score. Current rep not meeting engagement targets.'),

  -- Northwind Health: completed successfully
  ('d0000005-0000-4000-8000-000000000005',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'b0000001-0000-4000-8000-000000000001',
   NULL, NULL,
   'completed', 'promotion', 'high',
   '2026-02-15', '2026-02-12 14:30:00+00',
   'Smooth transition after previous rep was promoted to manager. Dr. Holloway met with new rep and is happy with the handoff.');

-- -----------------------------------------------------------------------------
-- Transition Activities (3 sample audit trail entries)
-- -----------------------------------------------------------------------------

INSERT INTO transition_activities (id, org_id, transition_id, type, description, metadata, created_by) VALUES
  ('e0000001-0000-4000-8000-000000000001',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd0000001-0000-4000-8000-000000000001',
   'status_change',
   'Transition moved from approved to in_progress',
   '{"from_status": "approved", "to_status": "in_progress"}',
   NULL),

  ('e0000002-0000-4000-8000-000000000002',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd0000003-0000-4000-8000-000000000003',
   'email_sent',
   'Warm introduction email sent to Michael Torres at BrightPath Education',
   '{"email_type": "warm_intro", "recipient": "m.torres@brightpathedu.org", "subject": "Introducing your new account manager"}',
   NULL),

  ('e0000003-0000-4000-8000-000000000003',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd0000005-0000-4000-8000-000000000005',
   'meeting_booked',
   'Handoff meeting completed with Dr. Holloway at Northwind Health Systems',
   '{"meeting_date": "2026-02-10T15:00:00Z", "attendees": ["Dr. Patricia Holloway", "James Whitfield"], "duration_minutes": 45}',
   NULL);

-- -----------------------------------------------------------------------------
-- Assignment Rules (2 sample rule sets)
-- -----------------------------------------------------------------------------

INSERT INTO assignment_rules (id, org_id, name, rules, is_active, priority) VALUES
  ('f0000001-0000-4000-8000-000000000001',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Geographic Territory Assignment',
   '[
     {
       "condition": "geography",
       "operator": "starts_with",
       "value": "US - West",
       "assign_to_specialty": "enterprise",
       "description": "West coast enterprise accounts go to reps with enterprise specialty"
     },
     {
       "condition": "geography",
       "operator": "starts_with",
       "value": "US - Northeast",
       "assign_to_specialty": "healthcare",
       "description": "Northeast accounts prioritize reps with healthcare experience"
     },
     {
       "condition": "geography",
       "operator": "starts_with",
       "value": "EMEA",
       "assign_to_specialty": "mid_market",
       "description": "EMEA accounts assigned to mid-market specialists"
     }
   ]',
   true, 10),

  ('f0000002-0000-4000-8000-000000000002',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Segment-Based Capacity Balancing',
   '[
     {
       "condition": "segment",
       "operator": "equals",
       "value": "enterprise",
       "max_per_rep": 8,
       "weight": 3,
       "description": "Enterprise accounts are weighted 3x and capped at 8 per rep"
     },
     {
       "condition": "segment",
       "operator": "equals",
       "value": "mid_market",
       "max_per_rep": 15,
       "weight": 2,
       "description": "Mid-market accounts are weighted 2x and capped at 15 per rep"
     },
     {
       "condition": "segment",
       "operator": "equals",
       "value": "smb",
       "max_per_rep": 30,
       "weight": 1,
       "description": "SMB accounts have standard weighting with higher cap"
     },
     {
       "condition": "health_score",
       "operator": "less_than",
       "value": 50,
       "priority_boost": true,
       "description": "Low health accounts get priority assignment to experienced reps"
     }
   ]',
   true, 20);

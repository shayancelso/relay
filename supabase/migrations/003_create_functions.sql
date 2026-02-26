-- Dashboard metrics aggregation
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_transitions', (
      SELECT COUNT(*) FROM transitions
      WHERE org_id = p_org_id AND status NOT IN ('completed', 'cancelled')
    ),
    'intros_sent_this_week', (
      SELECT COUNT(*) FROM transition_emails
      WHERE org_id = p_org_id AND status = 'sent'
      AND sent_at >= date_trunc('week', now())
    ),
    'meetings_booked', (
      SELECT COUNT(*) FROM transitions
      WHERE org_id = p_org_id AND status = 'meeting_booked'
    ),
    'stalled_count', (
      SELECT COUNT(*) FROM transitions
      WHERE org_id = p_org_id AND status = 'stalled'
    ),
    'at_risk_count', (
      SELECT COUNT(*) FROM transitions
      WHERE org_id = p_org_id AND status NOT IN ('completed', 'cancelled')
      AND updated_at < now() - interval '5 days'
    ),
    'total_arr_in_transition', (
      SELECT COALESCE(SUM(a.arr), 0) FROM transitions t
      JOIN accounts a ON a.id = t.account_id
      WHERE t.org_id = p_org_id AND t.status NOT IN ('completed', 'cancelled')
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transition pipeline (count by status)
CREATE OR REPLACE FUNCTION get_transition_pipeline(p_org_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT status, COUNT(*) as count
      FROM transitions
      WHERE org_id = p_org_id
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'draft' THEN 1
          WHEN 'pending_approval' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'intro_sent' THEN 4
          WHEN 'meeting_booked' THEN 5
          WHEN 'in_progress' THEN 6
          WHEN 'completed' THEN 7
          WHEN 'stalled' THEN 8
          WHEN 'cancelled' THEN 9
        END
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rep workload (accounts per rep vs capacity)
CREATE OR REPLACE FUNCTION get_rep_workload(p_org_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT u.id, u.full_name, u.capacity,
        COUNT(a.id) as account_count,
        COUNT(tr.id) FILTER (WHERE tr.status NOT IN ('completed', 'cancelled')) as active_transitions
      FROM users u
      LEFT JOIN accounts a ON a.current_owner_id = u.id
      LEFT JOIN transitions tr ON (tr.to_owner_id = u.id)
      WHERE u.org_id = p_org_id AND u.role IN ('rep', 'manager')
      GROUP BY u.id, u.full_name, u.capacity
      ORDER BY u.full_name
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recent activities across org
CREATE OR REPLACE FUNCTION get_recent_activities(p_org_id UUID, p_limit INT DEFAULT 20)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT ta.*, u.full_name as created_by_name, a.name as account_name
      FROM transition_activities ta
      LEFT JOIN users u ON u.id = ta.created_by
      LEFT JOIN transitions tr ON tr.id = ta.transition_id
      LEFT JOIN accounts a ON a.id = tr.account_id
      WHERE ta.org_id = p_org_id
      ORDER BY ta.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

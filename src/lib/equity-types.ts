// ---------------------------------------------------------------------------
// Shared equity rule types & demo constants
// Used by both the Rules page (editor) and Team page (chart consumer)
// ---------------------------------------------------------------------------

export type EquityMetric = 'arr' | 'account_count' | 'employee_count' | 'custom'
export type TargetType = 'mean_relative' | 'absolute'

export type EquityRuleScope = {
  segments?: string[]        // account segments to include (empty/undefined = all)
  excludeOnRamp?: boolean    // skip reps with <12mo tenure
  repSpecialties?: string[]  // only reps with these specialties (empty/undefined = all)
}

export type SegmentTarget = {
  segment: string
  target: number
  tolerance?: number
}

export type EquityRule = {
  id: string
  name: string
  metric: EquityMetric
  customFieldName?: string   // e.g. "open_tickets", "health_score", "utilization"
  customFieldUnit?: string   // e.g. "tickets", "pts", "%"
  tolerance: number          // e.g. 20 = within ±20% of team mean (mean_relative) or ±N (absolute)
  weight: number             // 1–100
  mustFollow: boolean
  active: boolean
  description: string
  targetType?: TargetType           // defaults to 'mean_relative'
  defaultTarget?: number            // for absolute: base target value
  segmentTargets?: SegmentTarget[]  // per-segment overrides (absolute mode)
  scope?: EquityRuleScope            // optional scope filters (undefined = global)
}

export const DEMO_EQUITY_RULES: EquityRule[] = [
  {
    id: 'eq-1',
    name: 'ARR Balance',
    metric: 'arr',
    tolerance: 20,
    weight: 85,
    mustFollow: true,
    active: true,
    description: "No rep's total managed ARR should exceed ±20% of the team mean ($1.95M)",
    scope: { segments: ['enterprise'] },
  },
  {
    id: 'eq-2',
    name: 'Account Count Balance',
    metric: 'account_count',
    tolerance: 15,
    weight: 90,
    mustFollow: true,
    active: true,
    description: 'All reps should carry within ±15% of the average account count',
    scope: { segments: ['enterprise', 'fins'] },
  },
  {
    id: 'eq-3',
    name: 'Employee Headcount',
    metric: 'employee_count',
    tolerance: 25,
    weight: 60,
    mustFollow: false,
    active: true,
    description: 'Cumulative employee count across each book should be within ±25% of the mean',
    scope: { segments: ['corporate', 'commercial'], excludeOnRamp: true },
  },
  {
    id: 'eq-4',
    name: 'Custom: Open Tickets',
    metric: 'custom',
    customFieldName: 'open_tickets',
    customFieldUnit: 'tickets',
    tolerance: 20,
    weight: 35,
    mustFollow: false,
    active: false,
    description: 'Example: if you track open support tickets per account, this rule balances books by total support load',
  },
  {
    id: 'eq-5',
    name: 'Health Score Targets',
    metric: 'custom',
    customFieldName: 'health_score',
    customFieldUnit: 'pts',
    tolerance: 5,
    weight: 75,
    mustFollow: false,
    active: true,
    description: "Each rep's average health score should meet their segment target (±5 pts). Enterprise: 75, FINS: 78, Corporate: 72, International: 68, Commercial: 65.",
    targetType: 'absolute',
    defaultTarget: 70,
    segmentTargets: [
      { segment: 'enterprise', target: 75 },
      { segment: 'fins', target: 78 },
      { segment: 'corporate', target: 72 },
      { segment: 'international', target: 68 },
      { segment: 'commercial', target: 65 },
    ],
  },
  {
    id: 'eq-6',
    name: 'Utilization Targets',
    metric: 'custom',
    customFieldName: 'utilization',
    customFieldUnit: '%',
    tolerance: 10,
    weight: 65,
    mustFollow: false,
    active: true,
    description: 'Rep utilization should meet their segment target (±10%). Enterprise: 85%, FINS: 82%, Corporate: 80%, International: 72%, Commercial: 70%.',
    targetType: 'absolute',
    defaultTarget: 75,
    segmentTargets: [
      { segment: 'enterprise', target: 85 },
      { segment: 'fins', target: 82 },
      { segment: 'corporate', target: 80 },
      { segment: 'international', target: 72 },
      { segment: 'commercial', target: 70 },
    ],
  },
]

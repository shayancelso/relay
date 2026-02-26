import type { AssignmentRule, RuleCondition } from '@/types'

export function createDefaultRules(): Partial<AssignmentRule>[] {
  return [
    {
      name: 'Enterprise accounts to senior reps',
      rules: [
        {
          field: 'segment',
          operator: 'equals',
          value: 'enterprise',
          action: { type: 'assign_pool', target_ids: [] },
        },
      ] as RuleCondition[],
      is_active: false,
      priority: 1,
    },
    {
      name: 'Round robin for SMB',
      rules: [
        {
          field: 'segment',
          operator: 'equals',
          value: 'smb',
          action: { type: 'round_robin' },
        },
      ] as RuleCondition[],
      is_active: false,
      priority: 2,
    },
  ]
}

export function validateRule(rule: RuleCondition): string | null {
  if (!rule.field) return 'Field is required'
  if (!rule.operator) return 'Operator is required'
  if (rule.value === undefined || rule.value === '') return 'Value is required'
  return null
}

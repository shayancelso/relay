import type { Account, User, AssignmentRule, AssignmentRecommendation, RuleCondition } from '@/types'

interface WeightConfig {
  capacity: number
  arr_match: number
  industry_match: number
  geography_match: number
  health_score: number
}

const DEFAULT_WEIGHTS: WeightConfig = {
  capacity: 0.30,
  arr_match: 0.25,
  industry_match: 0.20,
  geography_match: 0.15,
  health_score: 0.10,
}

function getARRTier(arr: number): string {
  if (arr >= 200000) return 'enterprise'
  if (arr >= 50000) return 'mid_market'
  return 'smb'
}

function scoreCapacity(rep: User, currentAccountCount: number): number {
  const utilization = currentAccountCount / Math.max(rep.capacity, 1)
  if (utilization >= 1) return 0
  if (utilization >= 0.9) return 20
  if (utilization >= 0.7) return 60
  return 100
}

function scoreARRMatch(account: Account, rep: User, repAccounts: Account[]): number {
  const accountTier = getARRTier(account.arr)
  if (repAccounts.length === 0) return 50

  const repAvgARR = repAccounts.reduce((sum, a) => sum + a.arr, 0) / repAccounts.length
  const repTier = getARRTier(repAvgARR)

  if (accountTier === repTier) return 100
  return 40
}

function scoreIndustryMatch(account: Account, rep: User, repAccounts: Account[]): number {
  if (!account.industry) return 50

  if (rep.specialties.some(s => s.toLowerCase() === account.industry?.toLowerCase())) {
    return 100
  }

  const repIndustries = repAccounts.map(a => a.industry?.toLowerCase()).filter(Boolean)
  if (repIndustries.includes(account.industry.toLowerCase())) {
    return 70
  }

  return 30
}

function scoreGeography(account: Account, repAccounts: Account[]): number {
  if (!account.geography) return 50

  const repGeos = repAccounts.map(a => a.geography?.toLowerCase()).filter(Boolean)
  if (repGeos.includes(account.geography.toLowerCase())) {
    return 100
  }

  return 30
}

function scoreHealthRisk(account: Account): number {
  // Higher health = less risky, so we want experienced reps for low-health accounts
  // This score represents "importance" — low health means this assignment is more critical
  if (account.health_score < 40) return 100
  if (account.health_score < 60) return 70
  if (account.health_score < 80) return 40
  return 20
}

function evaluateRules(
  account: Account,
  rep: User,
  rules: AssignmentRule[]
): { eligible: boolean; bonus: number } {
  let eligible = true
  let bonus = 0

  for (const rule of rules) {
    if (!rule.is_active) continue

    for (const condition of rule.rules as RuleCondition[]) {
      const fieldValue = getFieldValue(account, condition.field)

      const matches = evaluateCondition(fieldValue, condition.operator, condition.value)

      if (matches && condition.action) {
        if (condition.action.type === 'assign_pool' && condition.action.target_ids) {
          if (!condition.action.target_ids.includes(rep.id)) {
            eligible = false
          } else {
            bonus += 20
          }
        }
      }
    }
  }

  return { eligible, bonus }
}

function getFieldValue(account: Account, field: string): unknown {
  switch (field) {
    case 'segment': return account.segment
    case 'industry': return account.industry
    case 'geography': return account.geography
    case 'arr': return account.arr
    case 'health_score': return account.health_score
    default: return null
  }
}

function evaluateCondition(fieldValue: unknown, operator: string, condValue: unknown): boolean {
  switch (operator) {
    case 'equals': return fieldValue === condValue
    case 'not_equals': return fieldValue !== condValue
    case 'contains':
      return typeof fieldValue === 'string' && typeof condValue === 'string' &&
        fieldValue.toLowerCase().includes(condValue.toLowerCase())
    case 'greater_than': return Number(fieldValue) > Number(condValue)
    case 'less_than': return Number(fieldValue) < Number(condValue)
    case 'in':
      return Array.isArray(condValue) && condValue.includes(fieldValue)
    default: return false
  }
}

export function runAssignmentEngine(
  accounts: Account[],
  availableReps: User[],
  repAccountCounts: Map<string, number>,
  repCurrentAccounts: Map<string, Account[]>,
  rules: AssignmentRule[],
  weights: WeightConfig = DEFAULT_WEIGHTS,
): AssignmentRecommendation[] {
  const recommendations: AssignmentRecommendation[] = []

  for (const account of accounts) {
    const recs: AssignmentRecommendation['recommendations'] = []

    for (const rep of availableReps) {
      const accountCount = repAccountCounts.get(rep.id) || 0
      const repAccounts = repCurrentAccounts.get(rep.id) || []

      // Evaluate rules first
      const { eligible, bonus } = evaluateRules(account, rep, rules)
      if (!eligible) continue

      // Score each dimension
      const breakdown = {
        capacity: scoreCapacity(rep, accountCount),
        arr_match: scoreARRMatch(account, rep, repAccounts),
        industry_match: scoreIndustryMatch(account, rep, repAccounts),
        geography_match: scoreGeography(account, repAccounts),
        health_score: scoreHealthRisk(account),
      }

      const score =
        breakdown.capacity * weights.capacity +
        breakdown.arr_match * weights.arr_match +
        breakdown.industry_match * weights.industry_match +
        breakdown.geography_match * weights.geography_match +
        breakdown.health_score * weights.health_score +
        bonus

      recs.push({
        user_id: rep.id,
        user_name: rep.full_name,
        score: Math.round(score),
        breakdown,
      })
    }

    recs.sort((a, b) => b.score - a.score)

    recommendations.push({
      account_id: account.id,
      account_name: account.name,
      recommendations: recs.slice(0, 3),
    })
  }

  return recommendations
}

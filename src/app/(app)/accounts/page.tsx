'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { demoAccounts, demoTeamMembers } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '@/lib/role-context'
import { formatCurrency, getSegmentColor, formatSegment, getHealthBg, cn } from '@/lib/utils'
import {
  Search, Upload, X, Download, UserCog, ArrowLeftRight, Building2,
  Inbox, Sparkles, ArrowRight, GitMerge, Zap, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

const SEGMENTS = ['all', 'commercial', 'corporate', 'enterprise', 'fins', 'international'] as const

// ─── Queue Types ──────────────────────────────────────────────────────────────

type QueueStatus = 'pending' | 'assigned' | 'overridden'

type RuleMatch = {
  ruleName: string
  action: string
  confidence: 'high' | 'medium' | 'low'
}

type QueueRepStatic = {
  userId: string
  name: string
  score: number
  capacityPct: number
  currentAccounts: number
  specialtyMatch: boolean
  industryMatch: boolean
  matchReasons: string[]
}

type QueueAccount = {
  id: string
  name: string
  segment: 'commercial' | 'corporate' | 'enterprise' | 'fins' | 'international'
  industry: string
  arr: number
  geography: string
  employee_count: number
  health_score: number
  created_at: string
  crm_source: string
  matchedRule: RuleMatch | null
  recommendations: QueueRepStatic[]
  status: QueueStatus
}

// ─── Queue Helpers ────────────────────────────────────────────────────────────

const TODAY = new Date('2026-03-03')

function daysInQueue(createdAt: string) {
  const d = Math.round((TODAY.getTime() - new Date(createdAt).getTime()) / 86400000)
  return Math.max(d, 1)
}

function getQueueSegmentBorder(segment: QueueAccount['segment']) {
  return {
    commercial: 'border-l-sky-400',
    corporate: 'border-l-violet-400',
    enterprise: 'border-l-amber-400',
    fins: 'border-l-emerald-400',
    international: 'border-l-rose-400',
  }[segment]
}

function getScoreRingClass(score: number) {
  if (score >= 85) return 'ring-emerald-400'
  if (score >= 70) return 'ring-blue-400'
  if (score >= 55) return 'ring-amber-400'
  return 'ring-stone-300'
}

function getScoreTextClass(score: number) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 55) return 'text-amber-600'
  return 'text-stone-400'
}

// ─── Queue Demo Data ──────────────────────────────────────────────────────────

const QUEUE_ACCOUNTS: QueueAccount[] = [
  {
    id: 'q-1', name: 'Acme Financial', segment: 'fins', industry: 'Financial Services',
    arr: 485000, geography: 'Toronto, ON', employee_count: 1240, health_score: 82,
    created_at: '2026-02-28', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'FINS Specialist', action: 'Assign to FINS specialist pool (least-loaded)', confidence: 'high' },
    recommendations: [
      { userId: 'user-13', name: 'Priya Patel', score: 91, capacityPct: 68, currentAccounts: 34, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', '12 Fintech accounts', 'Geography: Toronto'] },
      { userId: 'user-15', name: 'Sofia Gutierrez', score: 83, capacityPct: 72, currentAccounts: 31, specialtyMatch: true, industryMatch: false, matchReasons: ['FINS specialty match', 'Low current load'] },
      { userId: 'user-14', name: 'Connor Walsh', score: 79, capacityPct: 65, currentAccounts: 28, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', 'Banking experience'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-2', name: 'NovaTech Inc', segment: 'enterprise', industry: 'Technology',
    arr: 1200000, geography: 'San Francisco, CA', employee_count: 5800, health_score: 88,
    created_at: '2026-03-01', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Enterprise High-Value', action: 'Assign to Enterprise specialist (highest capacity)', confidence: 'high' },
    recommendations: [
      { userId: 'user-9', name: 'Nathan Brooks', score: 88, capacityPct: 78, currentAccounts: 42, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'SaaS experience', 'Highest score'] },
      { userId: 'user-12', name: 'Mei-Lin Wu', score: 82, capacityPct: 61, currentAccounts: 38, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'Tech vertical focus'] },
      { userId: 'user-11', name: "Ryan O'Sullivan", score: 79, capacityPct: 55, currentAccounts: 35, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-3', name: 'Bright Solutions', segment: 'commercial', industry: 'Professional Services',
    arr: 32000, geography: 'Vancouver, BC', employee_count: 88, health_score: 75,
    created_at: '2026-02-26', crm_source: 'HubSpot · Closed Won',
    matchedRule: { ruleName: 'Commercial Growth', action: 'Assign to Commercial pool (round-robin)', confidence: 'high' },
    recommendations: [
      { userId: 'user-23', name: 'Grace Hwang', score: 85, capacityPct: 62, currentAccounts: 52, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty', 'Low load', 'West Coast accounts'] },
      { userId: 'user-26', name: 'Javier Moreno', score: 78, capacityPct: 70, currentAccounts: 48, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty', 'Round-robin turn'] },
      { userId: 'user-30', name: 'Oscar Delgado', score: 71, capacityPct: 65, currentAccounts: 45, specialtyMatch: false, industryMatch: false, matchReasons: ['Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-4', name: 'MetroBank', segment: 'fins', industry: 'Banking',
    arr: 220000, geography: 'Montreal, QC', employee_count: 3200, health_score: 79,
    created_at: '2026-02-27', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'FINS Specialist', action: 'Assign to FINS specialist pool (least-loaded)', confidence: 'high' },
    recommendations: [
      { userId: 'user-16', name: 'Takeshi Nakamura', score: 87, capacityPct: 71, currentAccounts: 36, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', 'Banking vertical', 'QC geography'] },
      { userId: 'user-13', name: 'Priya Patel', score: 80, capacityPct: 68, currentAccounts: 34, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', 'Banking experience'] },
      { userId: 'user-14', name: 'Connor Walsh', score: 74, capacityPct: 65, currentAccounts: 28, specialtyMatch: true, industryMatch: false, matchReasons: ['FINS specialty match'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-5', name: 'Quantum Health', segment: 'enterprise', industry: 'Healthcare',
    arr: 890000, geography: 'Boston, MA', employee_count: 4100, health_score: 85,
    created_at: '2026-03-02', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Enterprise High-Value', action: 'Assign to Enterprise specialist (highest capacity)', confidence: 'high' },
    recommendations: [
      { userId: 'user-10', name: 'Aisha Mbeki', score: 86, capacityPct: 66, currentAccounts: 39, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'Healthcare vertical', 'East Coast coverage'] },
      { userId: 'user-9', name: 'Nathan Brooks', score: 79, capacityPct: 78, currentAccounts: 42, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'High volume rep'] },
      { userId: 'user-12', name: 'Mei-Lin Wu', score: 75, capacityPct: 61, currentAccounts: 38, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-6', name: 'TruckFleet Co', segment: 'corporate', industry: 'Transportation',
    arr: 150000, geography: 'Calgary, AB', employee_count: 820, health_score: 72,
    created_at: '2026-02-25', crm_source: 'HubSpot · Closed Won',
    matchedRule: { ruleName: 'Corporate Mid-Market', action: 'Assign by industry match, then capacity', confidence: 'medium' },
    recommendations: [
      { userId: 'user-17', name: 'Amara Osei', score: 83, capacityPct: 69, currentAccounts: 41, specialtyMatch: true, industryMatch: false, matchReasons: ['Corporate specialty', 'Western Canada accounts'] },
      { userId: 'user-19', name: 'Claire Beaumont', score: 76, capacityPct: 72, currentAccounts: 44, specialtyMatch: true, industryMatch: false, matchReasons: ['Corporate specialty', 'Mid-market focus'] },
      { userId: 'user-22', name: 'Farid Ansari', score: 70, capacityPct: 67, currentAccounts: 40, specialtyMatch: false, industryMatch: false, matchReasons: ['Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-7', name: 'GreenLeaf Organic', segment: 'commercial', industry: 'Consumer Goods',
    arr: 18000, geography: 'Victoria, BC', employee_count: 45, health_score: 68,
    created_at: '2026-02-24', crm_source: 'HubSpot · Closed Won',
    matchedRule: { ruleName: 'Commercial Growth', action: 'Assign to Commercial pool (round-robin)', confidence: 'high' },
    recommendations: [
      { userId: 'user-26', name: 'Javier Moreno', score: 82, capacityPct: 70, currentAccounts: 48, specialtyMatch: true, industryMatch: true, matchReasons: ['Commercial specialty', 'Consumer goods vertical', 'BC geography'] },
      { userId: 'user-23', name: 'Grace Hwang', score: 76, capacityPct: 62, currentAccounts: 52, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty', 'Low load'] },
      { userId: 'user-30', name: 'Oscar Delgado', score: 68, capacityPct: 65, currentAccounts: 45, specialtyMatch: false, industryMatch: false, matchReasons: ['Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-8', name: 'Nordique AG', segment: 'international', industry: 'Manufacturing',
    arr: 94000, geography: 'Stockholm, Sweden', employee_count: 660, health_score: 77,
    created_at: '2026-02-28', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'International Routing', action: 'Assign to International team (EMEA)', confidence: 'high' },
    recommendations: [
      { userId: 'user-34', name: 'Tomas Eriksen', score: 89, capacityPct: 64, currentAccounts: 38, specialtyMatch: true, industryMatch: true, matchReasons: ['International specialty', 'EMEA territory', 'Nordic market expertise'] },
      { userId: 'user-33', name: 'Saoirse Murphy', score: 77, capacityPct: 71, currentAccounts: 42, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty', 'EMEA coverage'] },
      { userId: 'user-31', name: 'Pia Johansson', score: 71, capacityPct: 68, currentAccounts: 40, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty', 'Scandinavian languages'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-9', name: 'ClearVault', segment: 'fins', industry: 'Financial Technology',
    arr: 310000, geography: 'Toronto, ON', employee_count: 430, health_score: 83,
    created_at: '2026-03-01', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'FINS Specialist', action: 'Assign to FINS specialist pool (least-loaded)', confidence: 'high' },
    recommendations: [
      { userId: 'user-15', name: 'Sofia Gutierrez', score: 86, capacityPct: 72, currentAccounts: 31, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', 'Fintech vertical', 'Toronto geography'] },
      { userId: 'user-13', name: 'Priya Patel', score: 79, capacityPct: 68, currentAccounts: 34, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', '12 Fintech accounts'] },
      { userId: 'user-16', name: 'Takeshi Nakamura', score: 73, capacityPct: 71, currentAccounts: 36, specialtyMatch: true, industryMatch: false, matchReasons: ['FINS specialty match'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-10', name: 'HorizonAI', segment: 'enterprise', industry: 'Artificial Intelligence',
    arr: 640000, geography: 'New York, NY', employee_count: 2100, health_score: 87,
    created_at: '2026-02-27', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Enterprise High-Value', action: 'Assign to Enterprise specialist (highest capacity)', confidence: 'medium' },
    recommendations: [
      { userId: 'user-10', name: 'Aisha Mbeki', score: 84, capacityPct: 66, currentAccounts: 39, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'AI/Tech vertical', 'NY territory'] },
      { userId: 'user-9', name: 'Nathan Brooks', score: 78, capacityPct: 78, currentAccounts: 42, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'Tech focus'] },
      { userId: 'user-12', name: 'Mei-Lin Wu', score: 73, capacityPct: 61, currentAccounts: 38, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-11', name: 'PharmaCore', segment: 'corporate', industry: 'Pharmaceuticals',
    arr: 180000, geography: 'Chicago, IL', employee_count: 1560, health_score: 74,
    created_at: '2026-02-25', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Corporate Mid-Market', action: 'Assign by industry match, then capacity', confidence: 'medium' },
    recommendations: [
      { userId: 'user-19', name: 'Claire Beaumont', score: 81, capacityPct: 72, currentAccounts: 44, specialtyMatch: true, industryMatch: true, matchReasons: ['Corporate specialty', 'Healthcare/Pharma vertical', 'Midwest territory'] },
      { userId: 'user-17', name: 'Amara Osei', score: 74, capacityPct: 69, currentAccounts: 41, specialtyMatch: true, industryMatch: false, matchReasons: ['Corporate specialty', 'Mid-market experience'] },
      { userId: 'user-22', name: 'Farid Ansari', score: 68, capacityPct: 67, currentAccounts: 40, specialtyMatch: false, industryMatch: false, matchReasons: ['Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-12', name: 'SkyBridge Logistics', segment: 'commercial', industry: 'Logistics',
    arr: 41000, geography: 'Ottawa, ON', employee_count: 130, health_score: 71,
    created_at: '2026-02-26', crm_source: 'HubSpot · Closed Won',
    matchedRule: { ruleName: 'Commercial Growth', action: 'Assign to Commercial pool (round-robin)', confidence: 'high' },
    recommendations: [
      { userId: 'user-23', name: 'Grace Hwang', score: 80, capacityPct: 62, currentAccounts: 52, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty', 'Low load', 'Ontario geography'] },
      { userId: 'user-26', name: 'Javier Moreno', score: 73, capacityPct: 70, currentAccounts: 48, specialtyMatch: true, industryMatch: true, matchReasons: ['Commercial specialty', 'Logistics vertical'] },
      { userId: 'user-30', name: 'Oscar Delgado', score: 65, capacityPct: 65, currentAccounts: 45, specialtyMatch: false, industryMatch: false, matchReasons: ['Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-13', name: 'DataStream Analytics', segment: 'corporate', industry: 'Data & Analytics',
    arr: 260000, geography: 'Austin, TX', employee_count: 780, health_score: 81,
    created_at: '2026-03-01', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Corporate Mid-Market', action: 'Assign by industry match, then capacity', confidence: 'high' },
    recommendations: [
      { userId: 'user-22', name: 'Farid Ansari', score: 85, capacityPct: 67, currentAccounts: 40, specialtyMatch: true, industryMatch: true, matchReasons: ['Corporate specialty', 'Analytics vertical', 'Texas territory'] },
      { userId: 'user-17', name: 'Amara Osei', score: 77, capacityPct: 69, currentAccounts: 41, specialtyMatch: true, industryMatch: false, matchReasons: ['Corporate specialty', 'Mid-market experience'] },
      { userId: 'user-19', name: 'Claire Beaumont', score: 70, capacityPct: 72, currentAccounts: 44, specialtyMatch: true, industryMatch: false, matchReasons: ['Corporate specialty'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-14', name: 'Pacific Rim Trading', segment: 'international', industry: 'Import/Export',
    arr: 130000, geography: 'Vancouver, BC', employee_count: 390, health_score: 76,
    created_at: '2026-02-28', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'International Routing', action: 'Assign to International team (APAC)', confidence: 'high' },
    recommendations: [
      { userId: 'user-16', name: 'Takeshi Nakamura', score: 91, capacityPct: 71, currentAccounts: 36, specialtyMatch: true, industryMatch: true, matchReasons: ['International specialty', 'APAC territory', 'Trade expertise'] },
      { userId: 'user-34', name: 'Tomas Eriksen', score: 80, capacityPct: 64, currentAccounts: 38, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty', 'Global accounts'] },
      { userId: 'user-33', name: 'Saoirse Murphy', score: 72, capacityPct: 71, currentAccounts: 42, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-15', name: 'MedCloud Systems', segment: 'fins', industry: 'Health Insurance',
    arr: 270000, geography: 'Toronto, ON', employee_count: 920, health_score: 80,
    created_at: '2026-02-27', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'FINS Specialist', action: 'Assign to FINS specialist pool (least-loaded)', confidence: 'high' },
    recommendations: [
      { userId: 'user-14', name: 'Connor Walsh', score: 87, capacityPct: 65, currentAccounts: 28, specialtyMatch: true, industryMatch: true, matchReasons: ['FINS specialty match', 'Insurance vertical', 'Toronto geography'] },
      { userId: 'user-15', name: 'Sofia Gutierrez', score: 80, capacityPct: 72, currentAccounts: 31, specialtyMatch: true, industryMatch: false, matchReasons: ['FINS specialty match', 'Low load'] },
      { userId: 'user-13', name: 'Priya Patel', score: 74, capacityPct: 68, currentAccounts: 34, specialtyMatch: true, industryMatch: false, matchReasons: ['FINS specialty match'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-16', name: 'TechPulse', segment: 'enterprise', industry: 'Software',
    arr: 380000, geography: 'Seattle, WA', employee_count: 1800, health_score: 84,
    created_at: '2026-02-26', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'Enterprise High-Value', action: 'Assign to Enterprise specialist (highest capacity)', confidence: 'medium' },
    recommendations: [
      { userId: 'user-12', name: 'Mei-Lin Wu', score: 79, capacityPct: 61, currentAccounts: 38, specialtyMatch: true, industryMatch: true, matchReasons: ['Enterprise specialty', 'Software vertical', 'Pacific Northwest'] },
      { userId: 'user-10', name: 'Aisha Mbeki', score: 73, capacityPct: 66, currentAccounts: 39, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'Tech experience'] },
      { userId: 'user-11', name: "Ryan O'Sullivan", score: 67, capacityPct: 55, currentAccounts: 35, specialtyMatch: true, industryMatch: false, matchReasons: ['Enterprise specialty', 'Available capacity'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-17', name: 'Coastal Industries', segment: 'commercial', industry: 'Manufacturing',
    arr: 22000, geography: 'Halifax, NS', employee_count: 67, health_score: 65,
    created_at: '2026-02-24', crm_source: 'HubSpot · Closed Won',
    matchedRule: null,
    recommendations: [
      { userId: 'user-30', name: 'Oscar Delgado', score: 72, capacityPct: 65, currentAccounts: 45, specialtyMatch: false, industryMatch: true, matchReasons: ['Manufacturing experience', 'Available capacity'] },
      { userId: 'user-23', name: 'Grace Hwang', score: 65, capacityPct: 62, currentAccounts: 52, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty', 'Low load'] },
      { userId: 'user-26', name: 'Javier Moreno', score: 60, capacityPct: 70, currentAccounts: 48, specialtyMatch: true, industryMatch: false, matchReasons: ['Commercial specialty'] },
    ],
    status: 'pending',
  },
  {
    id: 'q-18', name: 'GlobalTrace', segment: 'international', industry: 'Supply Chain',
    arr: 195000, geography: 'Dublin, Ireland', employee_count: 510, health_score: 73,
    created_at: '2026-02-25', crm_source: 'Salesforce · Closed Won',
    matchedRule: { ruleName: 'International Routing', action: 'Assign to International team (EMEA)', confidence: 'medium' },
    recommendations: [
      { userId: 'user-33', name: 'Saoirse Murphy', score: 78, capacityPct: 71, currentAccounts: 42, specialtyMatch: true, industryMatch: true, matchReasons: ['International specialty', 'EMEA coverage', 'Ireland territory'] },
      { userId: 'user-34', name: 'Tomas Eriksen', score: 72, capacityPct: 64, currentAccounts: 38, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty', 'EMEA coverage'] },
      { userId: 'user-31', name: 'Pia Johansson', score: 65, capacityPct: 68, currentAccounts: 40, specialtyMatch: true, industryMatch: false, matchReasons: ['International specialty'] },
    ],
    status: 'pending',
  },
]

// ─── Routing Queue Tab ────────────────────────────────────────────────────────

function RoutingQueueTab() {
  const [selectedId, setSelectedId] = useState<string>(QUEUE_ACCOUNTS[0].id)
  const [filterSegment, setFilterSegment] = useState<string>('all')
  const [sortMode, setSortMode] = useState<'arr' | 'oldest'>('arr')
  const [assignedMap, setAssignedMap] = useState<Map<string, string>>(new Map())

  // Derive current ARR per rep from live account data
  const teamRepARR = useMemo(() => {
    const reps = demoTeamMembers.filter(m => m.role === 'rep' && m.capacity > 0)
    return new Map(reps.map(r => [
      r.id,
      demoAccounts.filter(a => a.current_owner_id === r.id).reduce((s, a) => s + a.arr, 0),
    ]))
  }, [])

  const teamMeanARR = useMemo(() => {
    const vals = [...teamRepARR.values()]
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }, [teamRepARR])

  function getEquityImpact(repId: string, additionalARR: number) {
    const current = teamRepARR.get(repId) ?? 0
    const newARR = current + additionalARR
    const dev = teamMeanARR > 0 ? ((newARR - teamMeanARR) / teamMeanARR) * 100 : 0
    return { newARR, dev: Math.round(dev), flagged: Math.abs(dev) > 20 }
  }

  const displayAccounts = useMemo(() => {
    let result = QUEUE_ACCOUNTS
    if (filterSegment !== 'all') result = result.filter(a => a.segment === filterSegment)
    return [...result].sort(
      sortMode === 'arr'
        ? (a, b) => b.arr - a.arr
        : (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  }, [filterSegment, sortMode])

  const selectedAccount = displayAccounts.find(a => a.id === selectedId) ?? displayAccounts[0]
  const pendingCount = QUEUE_ACCOUNTS.filter(a => !assignedMap.has(a.id)).length
  const totalQueueARR = QUEUE_ACCOUNTS.reduce((s, a) => s + a.arr, 0)
  const ruleMatchedCount = QUEUE_ACCOUNTS.filter(a => a.matchedRule !== null).length
  const avgDays = +(QUEUE_ACCOUNTS.reduce((s, a) => s + daysInQueue(a.created_at), 0) / QUEUE_ACCOUNTS.length).toFixed(1)

  function handleAssign(account: QueueAccount, rep: QueueRepStatic) {
    setAssignedMap(prev => { const m = new Map(prev); m.set(account.id, rep.name); return m })
    toast.success(`${account.name} assigned to ${rep.name}`)
  }

  function handleRouteAll() {
    const toRoute = QUEUE_ACCOUNTS.filter(a => a.matchedRule?.confidence === 'high' && !assignedMap.has(a.id))
    if (toRoute.length === 0) {
      toast.info('All high-confidence accounts are already assigned')
      return
    }
    const newMap = new Map(assignedMap)
    toRoute.forEach(a => { newMap.set(a.id, a.recommendations[0].name) })
    setAssignedMap(newMap)
    toast.success(`${toRoute.length} accounts routed by rule`, {
      description: 'All high-confidence matches have been assigned.',
    })
  }

  const confidenceStyle = {
    high: 'bg-emerald-100 text-emerald-800',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-stone-100 text-stone-600',
  }

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-5 text-[12px]">
          <span>
            <span className="font-semibold text-foreground">{pendingCount}</span>
            <span className="ml-1 text-muted-foreground">pending</span>
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">{formatCurrency(totalQueueARR)}</span>
            <span className="ml-1 text-muted-foreground">ARR</span>
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">{avgDays}d</span>
            <span className="ml-1 text-muted-foreground">avg in queue</span>
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">{ruleMatchedCount}</span>
            <span className="ml-1 text-muted-foreground">rule-matched</span>
          </span>
        </div>
        <button
          onClick={handleRouteAll}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <Zap className="h-3.5 w-3.5" />
          Route All by Rules
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-[320px_1fr] overflow-hidden rounded-xl border border-border/60 bg-card">

        {/* ── Left Panel: Queue List ── */}
        <div className="flex flex-col border-r border-border/60">
          {/* Filter / sort toolbar */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <div className="flex flex-1 flex-wrap gap-1">
              {(['all', 'commercial', 'corporate', 'enterprise', 'fins', 'international'] as const).map(seg => (
                <button
                  key={seg}
                  onClick={() => setFilterSegment(seg)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                    filterSegment === seg
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {seg === 'all' ? 'All' : formatSegment(seg)}
                </button>
              ))}
            </div>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as 'arr' | 'oldest')}
              className="cursor-pointer border-0 bg-transparent text-[10px] text-muted-foreground outline-none"
            >
              <option value="arr">ARR ↓</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Account list */}
          <div className="divide-y divide-border/40 overflow-y-auto" style={{ maxHeight: 580 }}>
            {displayAccounts.map(account => {
              const isSelected = account.id === selectedAccount?.id
              const assignedTo = assignedMap.get(account.id)
              return (
                <button
                  key={account.id}
                  onClick={() => setSelectedId(account.id)}
                  className={cn(
                    'w-full border-l-4 px-3 py-3 text-left transition-colors',
                    getQueueSegmentBorder(account.segment),
                    isSelected ? 'border-r-2 border-r-emerald-500 bg-stone-50' : 'hover:bg-muted/40',
                    assignedTo ? 'opacity-50' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-medium leading-tight text-foreground">{account.name}</span>
                    {account.matchedRule ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">matched</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">no rule</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={cn('h-4 px-1 py-0 text-[9px] font-medium', getSegmentColor(account.segment))}>
                      {formatSegment(account.segment)}
                    </Badge>
                    <span className="tabular-nums text-[11px] font-medium text-foreground/70">{formatCurrency(account.arr)}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{daysInQueue(account.created_at)}d ago</span>
                  </div>
                  {assignedTo && (
                    <div className="mt-1.5">
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium text-stone-500">
                        Assigned to {assignedTo}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right Panel: Detail ── */}
        {selectedAccount ? (
          <div className="overflow-y-auto p-6" style={{ maxHeight: 640 }}>
            <div className="space-y-5">

              {/* A. Account snapshot */}
              <div>
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedAccount.name}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    ['Segment', <Badge key="s" variant="outline" className={cn('text-[10px] font-medium px-1.5 py-0', getSegmentColor(selectedAccount.segment))}>{formatSegment(selectedAccount.segment)}</Badge>],
                    ['ARR', <span key="a" className="text-[12px] font-semibold tabular-nums">{formatCurrency(selectedAccount.arr)}</span>],
                    ['Industry', selectedAccount.industry],
                    ['Geography', selectedAccount.geography],
                    ['Employees', selectedAccount.employee_count.toLocaleString()],
                    ['Health Score', <span key="h" className={cn('inline-flex h-5 w-7 items-center justify-center rounded text-[10px] font-semibold tabular-nums', getHealthBg(selectedAccount.health_score))}>{selectedAccount.health_score}</span>],
                    ['In queue', `${daysInQueue(selectedAccount.created_at)} day${daysInQueue(selectedAccount.created_at) !== 1 ? 's' : ''}`],
                    ['CRM source', selectedAccount.crm_source],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex flex-col gap-0.5">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
                      <dd className="text-[12px] text-foreground">{value}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* B. Rule match card */}
              {selectedAccount.matchedRule ? (
                <div className="rounded-lg border border-emerald-200/60 border-l-4 border-l-emerald-400 bg-emerald-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <GitMerge className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-[12px] font-semibold text-emerald-900">{selectedAccount.matchedRule.ruleName}</span>
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', confidenceStyle[selectedAccount.matchedRule.confidence])}>
                          {selectedAccount.matchedRule.confidence} confidence
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-emerald-700">{selectedAccount.matchedRule.action}</p>
                    </div>
                    <Link href="/rules" className="flex shrink-0 items-center gap-0.5 text-[10px] text-emerald-600 hover:text-emerald-800">
                      View rule <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200/60 border-l-4 border-l-amber-400 bg-amber-50/40 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[12px] font-semibold text-amber-900">No assignment rule matched this account</p>
                      <p className="mt-0.5 text-[11px] text-amber-700">Consider creating a rule for this account type to automate future assignments.</p>
                      <Link href="/rules" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950">
                        Create a rule <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* C. Rep recommendation cards */}
              <div>
                <h4 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Recommended Reps
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedAccount.recommendations.map((rep, idx) => {
                    const equity = getEquityImpact(rep.userId, selectedAccount.arr)
                    const isThisRepAssigned = assignedMap.get(selectedAccount.id) === rep.name
                    const isAnyAssigned = assignedMap.has(selectedAccount.id)
                    return (
                      <div
                        key={rep.userId}
                        className={cn(
                          'flex flex-col gap-3 rounded-xl border border-border/60 p-4',
                          idx === 0 ? 'ring-1 ring-emerald-400/40' : '',
                        )}
                      >
                        {/* Rank + Name */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground/50">#{idx + 1}</span>
                          <span className="text-[12px] font-semibold leading-tight text-foreground">{rep.name}</span>
                        </div>

                        {/* Score ring */}
                        <div className="flex justify-center">
                          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full ring-4', getScoreRingClass(rep.score))}>
                            <span className={cn('text-[18px] font-bold tabular-nums', getScoreTextClass(rep.score))}>{rep.score}</span>
                          </div>
                        </div>

                        {/* Capacity bar */}
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Capacity</span>
                            <span className="font-medium tabular-nums">{rep.capacityPct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                rep.capacityPct > 85 ? 'bg-red-400' : rep.capacityPct > 70 ? 'bg-amber-400' : 'bg-emerald-400',
                              )}
                              style={{ width: `${rep.capacityPct}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">{rep.currentAccounts} accounts</div>
                        </div>

                        {/* Match reasons */}
                        <ul className="space-y-0.5">
                          {rep.matchReasons.map(r => (
                            <li key={r} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                              <span className="mt-0.5 text-emerald-500">✓</span>
                              {r}
                            </li>
                          ))}
                        </ul>

                        {/* Equity chip */}
                        <div className={cn(
                          'rounded-lg px-2.5 py-1.5 text-[10px]',
                          equity.flagged ? 'bg-amber-50 text-amber-700' : equity.dev < -5 ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700',
                        )}>
                          {equity.flagged ? (
                            <span className="font-semibold">⚠ +{equity.dev}% above ARR mean</span>
                          ) : equity.dev < -5 ? (
                            <span className="font-semibold">↑ Helps balance team ARR</span>
                          ) : (
                            <span className="font-semibold">✓ Keeps ARR balanced</span>
                          )}
                          <div className="mt-0.5 opacity-70">
                            → {formatCurrency(equity.newARR)} ({equity.dev >= 0 ? '+' : ''}{equity.dev}% vs mean)
                          </div>
                        </div>

                        {/* Assign button */}
                        <button
                          onClick={() => handleAssign(selectedAccount, rep)}
                          disabled={isAnyAssigned}
                          className={cn(
                            'w-full rounded-lg py-1.5 text-[11px] font-medium transition-colors',
                            isThisRepAssigned
                              ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                              : isAnyAssigned
                              ? 'cursor-not-allowed border border-border/60 text-muted-foreground/50'
                              : idx === 0
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'border border-border/60 text-foreground hover:bg-muted',
                          )}
                        >
                          {isThisRepAssigned
                            ? `Assigned to ${rep.name.split(' ')[0]}`
                            : `Assign to ${rep.name.split(' ')[0]}`}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12 text-center">
            <div>
              <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">Select an account to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { role } = useRole()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'arr' | 'health'>(
    (searchParams.get('sort') as 'name' | 'arr' | 'health') ?? 'arr'
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    (searchParams.get('dir') as 'asc' | 'desc') ?? 'desc'
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { isTrialMode, enterDemoMode } = useTrialMode()

  const baseAccounts = role === 'rep'
    ? demoAccounts.filter(a => a.current_owner_id === 'user-3')
    : demoAccounts

  const filtered = useMemo(() => {
    let result = baseAccounts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.industry?.toLowerCase().includes(q))
    }
    if (segment !== 'all') {
      result = result.filter(a => a.segment === segment)
    }
    result = [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
      if (sortBy === 'arr') return (a.arr - b.arr) * dir
      return (a.health_score - b.health_score) * dir
    })
    return result
  }, [baseAccounts, search, segment, sortBy, sortDir])

  const displayedAccounts = filtered.slice(0, 50)

  const selectedArr = useMemo(
    () => demoAccounts.filter(a => selectedIds.has(a.id)).reduce((s, a) => s + a.arr, 0),
    [selectedIds],
  )

  const allDisplayedSelected =
    displayedAccounts.length > 0 &&
    displayedAccounts.every(a => selectedIds.has(a.id))

  const someDisplayedSelected = displayedAccounts.some(a => selectedIds.has(a.id))

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) displayedAccounts.forEach(a => next.add(a.id))
      else displayedAccounts.forEach(a => next.delete(a.id))
      return next
    })
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const segmentSummary = SEGMENTS.filter(s => s !== 'all').map(s => ({
    segment: s,
    count: baseAccounts.filter(a => a.segment === s).length,
    arr: baseAccounts.filter(a => a.segment === s).reduce((sum, a) => sum + a.arr, 0),
  }))

  const totalArr = baseAccounts.reduce((s, a) => s + a.arr, 0)
  const selectedCount = selectedIds.size
  const createTransitionsHref = `/transitions/new?accounts=${Array.from(selectedIds).join(',')}`
  const queuePendingCount = QUEUE_ACCOUNTS.length

  if (isTrialMode) {
    return <TrialPageEmpty icon={Building2} title="Your Accounts" description="Connect your CRM to see your book of business here." ctaLabel="Go to Integrations" ctaHref="/integrations" onExploreDemo={enterDemoMode} />
  }

  return (
    <div className={cn('space-y-6', selectedCount > 0 ? 'pb-24' : '')}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {role === 'rep' ? 'My Accounts' : 'Accounts'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {baseAccounts.length.toLocaleString()} accounts
            <span className="mx-1.5 text-border">·</span>
            {formatCurrency(totalArr)} total ARR
          </p>
        </div>
        {role === 'revops_admin' && (
          <Link
            href="/accounts/upload"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Link>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="all" className="text-[12px]">
              All Accounts
              <span className="ml-1.5 opacity-60">{baseAccounts.length.toLocaleString()}</span>
            </TabsTrigger>
            {role !== 'rep' && (
              <TabsTrigger value="unassigned" className="gap-1.5 text-[12px]">
                Unassigned
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {queuePendingCount}
                </span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ── All Accounts tab ── */}
        <TabsContent value="all" className="mt-4">
          {/* Segment Filter Chips */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            <button
              onClick={() => setSegment('all')}
              className={cn(
                'rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all',
                segment === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
              )}
            >
              All
              <span className={cn('ml-1.5', segment === 'all' ? 'opacity-70' : 'opacity-50')}>
                {baseAccounts.length.toLocaleString()}
              </span>
            </button>
            {segmentSummary.map(s => (
              <button
                key={s.segment}
                onClick={() => setSegment(s.segment === segment ? 'all' : s.segment)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all',
                  segment === s.segment
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                )}
              >
                {formatSegment(s.segment)}
                <span className={cn('ml-1.5', segment === s.segment ? 'opacity-70' : 'opacity-50')}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Sort toolbar */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-[12px] bg-card border-border/60 placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
              />
            </div>

            <div className="flex items-center gap-0.5 ml-auto">
              <span className="text-[11px] text-muted-foreground mr-2">Sort by</span>
              {(['name', 'arr', 'health'] as const).map(field => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                    sortBy === field
                      ? 'bg-foreground/8 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {field === 'arr' ? 'ARR' : field === 'health' ? 'Health' : 'Name'}
                  {sortBy === field && (
                    <span className="ml-1 opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Selected count banner */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 mb-4">
              <span className="text-[12px] font-medium text-emerald-800">
                {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <span className="text-emerald-600/50">·</span>
              <span className="text-[12px] font-medium tabular-nums text-emerald-700">
                {formatCurrency(selectedArr)} ARR
              </span>
              <button
                onClick={clearSelection}
                className="ml-auto flex items-center gap-1 text-[11px] text-emerald-700/70 transition-colors hover:text-emerald-900"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
          )}

          {/* Table */}
          <Card className="overflow-hidden border-border/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20">
                      <th className="w-10 px-4 py-3">
                        <Checkbox
                          checked={
                            allDisplayedSelected
                              ? true
                              : someDisplayedSelected
                              ? 'indeterminate'
                              : false
                          }
                          onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                          aria-label="Select all accounts"
                        />
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-4 py-3">
                        Account
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        Segment
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        Industry
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        ARR
                      </th>
                      <th className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        Health
                      </th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        Employees
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3">
                        Owner
                      </th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 py-3 pr-4">
                        Country
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayedAccounts.map((account) => {
                      const owner = demoTeamMembers.find(m => m.id === account.current_owner_id)
                      const isSelected = selectedIds.has(account.id)
                      return (
                        <tr
                          key={account.id}
                          className={cn(
                            'group transition-colors hover:bg-muted/30',
                            isSelected && 'bg-emerald-50/60 hover:bg-emerald-50',
                          )}
                        >
                          <td className="w-10 px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => toggleRow(account.id, !!checked)}
                              aria-label={`Select ${account.name}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/accounts/${account.id}`}
                              className="text-[13px] font-medium text-foreground hover:text-foreground/70 transition-colors"
                            >
                              {account.name}
                            </Link>
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] font-medium px-1.5 py-0', getSegmentColor(account.segment))}
                            >
                              {formatSegment(account.segment)}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-[12px] text-muted-foreground">
                            {account.industry || '—'}
                          </td>
                          <td className="px-3 py-3 text-right text-[13px] font-medium tabular-nums text-foreground">
                            {formatCurrency(account.arr)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn(
                              'inline-flex items-center justify-center h-6 w-8 rounded text-[11px] font-semibold tabular-nums',
                              getHealthBg(account.health_score)
                            )}>
                              {account.health_score}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] text-muted-foreground tabular-nums">
                            {account.employee_count.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-[12px] text-muted-foreground">
                            {owner?.full_name || '—'}
                          </td>
                          <td className="px-3 py-3 pr-4 text-[12px] text-muted-foreground">
                            {account.country || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length > 50 && (
                <div className="border-t border-border/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Showing 50 of {filtered.length.toLocaleString()} accounts
                  </span>
                  <span className="text-[11px] text-muted-foreground/50">
                    Refine your search to see more
                  </span>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-[13px] text-muted-foreground">No accounts match your filters</p>
                  <button
                    onClick={() => { setSearch(''); setSegment('all') }}
                    className="mt-2 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Unassigned / Routing Queue tab ── */}
        {role !== 'rep' && (
          <TabsContent value="unassigned" className="mt-4">
            <RoutingQueueTab />
          </TabsContent>
        )}
      </Tabs>

      {/* ── Sticky Bulk Action Bar ──────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-white/10 bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 shadow-2xl"
          style={{ animation: 'relay-slide-up 200ms cubic-bezier(0.16,1,0.3,1)' }}
        >
          <style>{`
            @keyframes relay-slide-up {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
          `}</style>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <span className="text-white/30">·</span>
            <span className="text-sm font-medium tabular-nums text-emerald-400">
              {formatCurrency(selectedArr)} ARR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={createTransitionsHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Create Transitions
            </Link>

            <button
              onClick={() =>
                toast.success(`Exporting ${selectedCount} accounts`, {
                  description: 'CSV download will begin shortly.',
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={() =>
                toast.success('Assign owner', {
                  description: `Owner assignment dialog would open for ${selectedCount} account${selectedCount !== 1 ? 's' : ''}.`,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign Owner
            </button>

            <button
              onClick={clearSelection}
              aria-label="Clear selection"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

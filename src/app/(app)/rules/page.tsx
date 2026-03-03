'use client'

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Edit3,
  MoreHorizontal,
  ShieldAlert,
  Users,
  User,
  Zap,
  BarChart3,
  Globe,
  Tag,
  TrendingUp,
  Heart,
  ArrowUpDown,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  Layers,
  SlidersHorizontal,
  Map,
  Target,
  RefreshCw,
  ChevronUp,
  History,
  Shuffle,
  Lock,
  Scale,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { demoTeamMembers, demoAccounts } from '@/lib/demo-data'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConditionField =
  | 'segment'
  | 'industry'
  | 'geography'
  | 'arr'
  | 'health_score'
  // Rep fields — match on rep attributes, not account attributes
  | 'rep_experience_years'
  | 'rep_segment_specialty'
  | 'rep_performance_tier'
  | 'rep_industry_expertise'
  | 'rep_account_count'

type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'is_any_of'

type Condition = {
  id: string
  field: ConditionField
  operator: ConditionOperator
  value: string
  value2?: string // for between
}

type ConditionGroup = {
  id: string
  logic: 'AND' | 'OR'
  conditions: (Condition | ConditionGroup)[]
}

type ActionType = 'assign_to' | 'round_robin' | 'least_loaded'

type RuleAction = {
  type: ActionType
  userIds: string[]
  label: string
}

type Rule = {
  id: string
  name: string
  priority: number
  active: boolean
  conditionGroup: ConditionGroup
  action: RuleAction
  hitCount: number
  lastTriggered: string
  createdBy: string
  createdAt: string
  modifiedAt: string
  version: number
  weight: number      // 1–100 — how important this rule is (higher = harder to break)
  mustFollow: boolean // true = hard constraint, cannot be violated by equity pass
}

type EquityMetric = 'arr' | 'account_count' | 'employee_count' | 'custom'

type EquityRule = {
  id: string
  name: string
  metric: EquityMetric
  customFieldName?: string  // e.g. "open_tickets"
  customFieldUnit?: string  // e.g. "tickets"
  tolerance: number         // e.g. 20 = within ±20% of the team mean
  weight: number            // 1–100
  mustFollow: boolean
  active: boolean
  description: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<ConditionField, string> = {
  segment: 'Segment',
  industry: 'Industry',
  geography: 'Geography',
  arr: 'ARR',
  health_score: 'Health Score',
  rep_experience_years: 'Rep Experience',
  rep_segment_specialty: 'Rep Specialty',
  rep_performance_tier: 'Rep Performance',
  rep_industry_expertise: 'Rep Industry',
  rep_account_count: 'Rep Book Size',
}

const FIELD_COLORS: Record<ConditionField, string> = {
  segment: 'border-violet-400 bg-violet-50 text-violet-700',
  industry: 'border-sky-400 bg-sky-50 text-sky-700',
  geography: 'border-amber-400 bg-amber-50 text-amber-700',
  arr: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  health_score: 'border-rose-400 bg-rose-50 text-rose-700',
  rep_experience_years: 'border-indigo-400 bg-indigo-50 text-indigo-700',
  rep_segment_specialty: 'border-indigo-400 bg-indigo-50 text-indigo-700',
  rep_performance_tier: 'border-indigo-400 bg-indigo-50 text-indigo-700',
  rep_industry_expertise: 'border-indigo-400 bg-indigo-50 text-indigo-700',
  rep_account_count: 'border-indigo-400 bg-indigo-50 text-indigo-700',
}

const FIELD_LEFT_BORDER: Record<ConditionField, string> = {
  segment: 'border-l-violet-400',
  industry: 'border-l-sky-400',
  geography: 'border-l-amber-400',
  arr: 'border-l-emerald-400',
  health_score: 'border-l-rose-400',
  rep_experience_years: 'border-l-indigo-400',
  rep_segment_specialty: 'border-l-indigo-400',
  rep_performance_tier: 'border-l-indigo-400',
  rep_industry_expertise: 'border-l-indigo-400',
  rep_account_count: 'border-l-indigo-400',
}

// Set of fields that match on rep attributes rather than account attributes
const REP_FIELDS = new Set<ConditionField>([
  'rep_experience_years',
  'rep_segment_specialty',
  'rep_performance_tier',
  'rep_industry_expertise',
  'rep_account_count',
])

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  between: 'between',
  is_any_of: 'is any of',
}

const SEGMENT_OPTIONS = ['enterprise', 'commercial', 'corporate', 'fins', 'international']
const GEOGRAPHY_OPTIONS = ['North America', 'EMEA', 'APAC', 'LATAM']
const INDUSTRY_OPTIONS = ['Fintech', 'Healthcare', 'SaaS', 'Manufacturing', 'Retail']

// ---------------------------------------------------------------------------
// Rule-builder helpers
// ---------------------------------------------------------------------------

type FieldDataType = 'text' | 'number' | 'enum'

const FIELD_DATA_TYPES: Record<ConditionField, FieldDataType> = {
  segment: 'enum',
  industry: 'enum',
  geography: 'enum',
  arr: 'number',
  health_score: 'number',
  rep_experience_years: 'number',
  rep_segment_specialty: 'enum',
  rep_performance_tier: 'enum',
  rep_industry_expertise: 'enum',
  rep_account_count: 'number',
}

const FIELD_ENUM_OPTIONS: Partial<Record<ConditionField, { value: string; label: string }[]>> = {
  segment: SEGMENT_OPTIONS.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
  geography: GEOGRAPHY_OPTIONS.map(v => ({ value: v, label: v })),
  industry: INDUSTRY_OPTIONS.map(v => ({ value: v, label: v })),
  rep_segment_specialty: SEGMENT_OPTIONS.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
  rep_performance_tier: [
    { value: 'top_performer', label: 'Top Performer' },
    { value: 'solid', label: 'Solid' },
    { value: 'developing', label: 'Developing' },
  ],
  rep_industry_expertise: INDUSTRY_OPTIONS.map(v => ({ value: v, label: v })),
}

const ACCOUNT_CONDITION_FIELDS: ConditionField[] = ['segment', 'industry', 'geography', 'arr', 'health_score']
const REP_CONDITION_FIELDS: ConditionField[] = [
  'rep_experience_years',
  'rep_segment_specialty',
  'rep_performance_tier',
  'rep_industry_expertise',
  'rep_account_count',
]

function getOperatorsForField(field: ConditionField): ConditionOperator[] {
  const type = FIELD_DATA_TYPES[field]
  if (type === 'number') return ['equals', 'greater_than', 'less_than', 'between']
  if (type === 'enum') return ['equals', 'not_equals', 'is_any_of']
  return ['equals', 'not_equals', 'contains']
}

const PICKABLE_MEMBERS = demoTeamMembers.filter(
  m => (m.role === 'rep' || m.role === 'manager') && m.capacity > 0
)

function buildActionLabel(type: ActionType, userIds: string[]): string {
  const names = userIds
    .map(id => demoTeamMembers.find(m => m.id === id)?.full_name ?? id)
    .join(', ')
  if (type === 'round_robin') return `Round-robin: ${names}`
  if (type === 'least_loaded') return `Least loaded from: ${names}`
  return `Assign to ${names}`
}

// ---------------------------------------------------------------------------
// Demo Rules Data
// ---------------------------------------------------------------------------

const buildId = (prefix: string, n: number) => `${prefix}-${n}`

const DEMO_RULES: Rule[] = [
  {
    id: 'rule-1',
    name: 'Enterprise High-Value Routing',
    priority: 1,
    active: true,
    weight: 90,
    mustFollow: true,
    conditionGroup: {
      id: 'cg-1',
      logic: 'AND',
      conditions: [
        { id: 'c-1-1', field: 'segment', operator: 'equals', value: 'enterprise' },
        { id: 'c-1-2', field: 'arr', operator: 'greater_than', value: '100000' },
      ],
    },
    action: { type: 'assign_to', userIds: ['user-4'], label: 'Assign to David Kim' },
    hitCount: 142,
    lastTriggered: '2 hours ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 23, 2026',
    modifiedAt: 'Feb 25, 2026',
    version: 3,
  },
  {
    id: 'rule-2',
    name: 'FINS Specialist Assignment',
    priority: 2,
    active: true,
    weight: 85,
    mustFollow: true,
    conditionGroup: {
      id: 'cg-2',
      logic: 'AND',
      conditions: [
        { id: 'c-2-1', field: 'segment', operator: 'equals', value: 'fins' },
      ],
    },
    action: { type: 'round_robin', userIds: ['user-4', 'user-6'], label: "Round-robin: David Kim, James O'Brien" },
    hitCount: 89,
    lastTriggered: '5 hours ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 22, 2026',
    modifiedAt: 'Feb 24, 2026',
    version: 2,
  },
  {
    id: 'rule-3',
    name: 'At-Risk Account Escalation',
    priority: 3,
    active: true,
    weight: 95,
    mustFollow: true,
    conditionGroup: {
      id: 'cg-3',
      logic: 'AND',
      conditions: [
        { id: 'c-3-1', field: 'health_score', operator: 'less_than', value: '40' },
      ],
    },
    action: { type: 'assign_to', userIds: ['user-2'], label: 'Assign to Marcus Johnson (manager)' },
    hitCount: 23,
    lastTriggered: '1 hour ago',
    createdBy: 'Marcus Johnson',
    createdAt: 'Feb 20, 2026',
    modifiedAt: 'Feb 26, 2026',
    version: 4,
  },
  {
    id: 'rule-4',
    name: 'Commercial Growth Accounts',
    priority: 4,
    active: true,
    weight: 70,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-4',
      logic: 'AND',
      conditions: [
        { id: 'c-4-1', field: 'segment', operator: 'equals', value: 'commercial' },
        { id: 'c-4-2', field: 'arr', operator: 'greater_than', value: '25000' },
      ],
    },
    action: { type: 'round_robin', userIds: ['user-3', 'user-5'], label: 'Round-robin: Elena Rodriguez, Priya Patel' },
    hitCount: 234,
    lastTriggered: '30 minutes ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 19, 2026',
    modifiedAt: 'Feb 25, 2026',
    version: 2,
  },
  {
    id: 'rule-5',
    name: 'International Routing',
    priority: 5,
    active: true,
    weight: 75,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-5',
      logic: 'AND',
      conditions: [
        { id: 'c-5-1', field: 'segment', operator: 'equals', value: 'international' },
      ],
    },
    action: { type: 'assign_to', userIds: ['user-5'], label: 'Assign to Priya Patel (specialized)' },
    hitCount: 156,
    lastTriggered: '3 hours ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 18, 2026',
    modifiedAt: 'Feb 23, 2026',
    version: 1,
  },
  {
    id: 'rule-6',
    name: 'Corporate Mid-Market',
    priority: 6,
    active: true,
    weight: 65,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-6',
      logic: 'AND',
      conditions: [
        { id: 'c-6-1', field: 'segment', operator: 'equals', value: 'corporate' },
        { id: 'c-6-2', field: 'arr', operator: 'between', value: '50000', value2: '200000' },
      ],
    },
    action: { type: 'least_loaded', userIds: ['user-3', 'user-4', 'user-5', 'user-6'], label: 'Least loaded from: Corporate Team' },
    hitCount: 178,
    lastTriggered: '45 minutes ago',
    createdBy: 'Marcus Johnson',
    createdAt: 'Feb 17, 2026',
    modifiedAt: 'Feb 24, 2026',
    version: 3,
  },
  {
    id: 'rule-7',
    name: 'New Account Onboarding',
    priority: 7,
    active: false,
    weight: 40,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-7',
      logic: 'AND',
      conditions: [],
    },
    action: { type: 'round_robin', userIds: ['user-3', 'user-4', 'user-5', 'user-6'], label: 'Round-robin across all reps' },
    hitCount: 67,
    lastTriggered: '12 hours ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 15, 2026',
    modifiedAt: 'Feb 20, 2026',
    version: 2,
  },
  {
    id: 'rule-8',
    name: 'High Health Cross-Sell',
    priority: 8,
    active: true,
    weight: 55,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-8',
      logic: 'AND',
      conditions: [
        {
          id: 'ncg-8-1',
          logic: 'AND',
          conditions: [
            { id: 'c-8-1', field: 'health_score', operator: 'greater_than', value: '85' },
            { id: 'c-8-2', field: 'arr', operator: 'greater_than', value: '75000' },
          ],
        } as ConditionGroup,
      ],
    },
    action: { type: 'assign_to', userIds: ['user-3'], label: 'Assign to Elena Rodriguez' },
    hitCount: 45,
    lastTriggered: '6 hours ago',
    createdBy: 'Elena Rodriguez',
    createdAt: 'Feb 14, 2026',
    modifiedAt: 'Feb 22, 2026',
    version: 2,
  },
  {
    id: 'rule-9',
    name: 'Senior Rep for Complex Accounts',
    priority: 9,
    active: true,
    weight: 80,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-9',
      logic: 'AND',
      conditions: [
        { id: 'c-9-1', field: 'segment', operator: 'equals', value: 'enterprise' },
        { id: 'c-9-2', field: 'rep_experience_years', operator: 'greater_than', value: '2' },
      ],
    },
    action: { type: 'least_loaded', userIds: ['user-4', 'user-3'], label: 'Least loaded from Enterprise team' },
    hitCount: 31,
    lastTriggered: '4 hours ago',
    createdBy: 'Marcus Johnson',
    createdAt: 'Feb 26, 2026',
    modifiedAt: 'Feb 26, 2026',
    version: 1,
  },
  {
    id: 'rule-10',
    name: 'Top Performer Upsell Queue',
    priority: 10,
    active: true,
    weight: 60,
    mustFollow: false,
    conditionGroup: {
      id: 'cg-10',
      logic: 'AND',
      conditions: [
        { id: 'c-10-1', field: 'health_score', operator: 'greater_than', value: '80' },
        { id: 'c-10-2', field: 'arr', operator: 'greater_than', value: '50000' },
        { id: 'c-10-3', field: 'rep_performance_tier', operator: 'equals', value: 'top_performer' },
      ],
    },
    action: { type: 'round_robin', userIds: ['user-3', 'user-9'], label: 'Round-robin: Elena Rodriguez, Nathan Brooks' },
    hitCount: 18,
    lastTriggered: '8 hours ago',
    createdBy: 'Sarah Chen',
    createdAt: 'Feb 27, 2026',
    modifiedAt: 'Feb 27, 2026',
    version: 1,
  },
]

// ---------------------------------------------------------------------------
// Equity Rules + Book of Business Data
// ---------------------------------------------------------------------------

const DEMO_EQUITY_RULES: EquityRule[] = [
  {
    id: 'eq-1',
    name: 'ARR Balance',
    metric: 'arr',
    tolerance: 20,
    weight: 85,
    mustFollow: true,
    active: true,
    description: "No rep's total managed ARR should exceed ±20% of the team mean ($1.95M)",
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
]

// James O'Brien is ~23.8% over mean ARR and ~24% over mean account count → triggers EQ-1 and EQ-2
const BOOK_DATA = [
  { repId: 'user-3',  name: 'Elena Rodriguez', arr: 1_850_000, accounts: 28, employees: 12_400 },
  { repId: 'user-4',  name: 'David Kim',        arr: 2_140_000, accounts: 32, employees: 14_200 },
  { repId: 'user-5',  name: 'Priya Patel',      arr: 1_720_000, accounts: 25, employees: 11_800 },
  { repId: 'user-6',  name: "James O'Brien",    arr: 2_420_000, accounts: 36, employees: 16_500 },
  { repId: 'user-9',  name: 'Nathan Brooks',    arr: 1_960_000, accounts: 29, employees: 13_500 },
  { repId: 'user-10', name: 'Aisha Mbeki',      arr: 1_640_000, accounts: 24, employees: 10_900 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS: Record<string, string> = {
  'user-1':  'bg-violet-100 text-violet-700',
  'user-2':  'bg-sky-100 text-sky-700',
  'user-3':  'bg-emerald-100 text-emerald-700',
  'user-4':  'bg-amber-100 text-amber-700',
  'user-5':  'bg-rose-100 text-rose-700',
  'user-6':  'bg-cyan-100 text-cyan-700',
  'user-9':  'bg-violet-100 text-violet-700',
  'user-10': 'bg-teal-100 text-teal-700',
}

function Avatar({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const member = demoTeamMembers.find((m) => m.id === userId)
  if (!member) return null
  const initials = getInitials(member.full_name)
  const colorClass = AVATAR_COLORS[userId] ?? 'bg-stone-100 text-stone-600'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold shrink-0',
        size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs',
        colorClass
      )}
    >
      {initials}
    </span>
  )
}

function AvatarInitials({
  name,
  colorClass,
  size = 'sm',
}: {
  name: string
  colorClass?: string
  size?: 'sm' | 'md'
}) {
  const initials = getInitials(name)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold shrink-0',
        size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs',
        colorClass ?? 'bg-stone-100 text-stone-600'
      )}
    >
      {initials}
    </span>
  )
}

function isConditionGroup(item: Condition | ConditionGroup): item is ConditionGroup {
  return 'logic' in item && 'conditions' in item
}

function formatARR(val: string) {
  const n = parseInt(val, 10)
  if (isNaN(n)) return val
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function formatBookARR(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val}`
}

// ---------------------------------------------------------------------------
// Condition builder sub-components (used in NewRuleSheet)
// ---------------------------------------------------------------------------

function ConditionValueInput({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (value: string, value2?: string) => void
}) {
  const enumOpts = FIELD_ENUM_OPTIONS[condition.field]

  if (condition.operator === 'between') {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Input
          type="number"
          placeholder="min"
          value={condition.value}
          onChange={e => onChange(e.target.value, condition.value2)}
          className="h-8 text-xs"
        />
        <span className="text-[10px] text-muted-foreground shrink-0">–</span>
        <Input
          type="number"
          placeholder="max"
          value={condition.value2 ?? ''}
          onChange={e => onChange(condition.value, e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    )
  }

  if (enumOpts) {
    return (
      <Select value={condition.value || ''} onValueChange={v => onChange(v)}>
        <SelectTrigger className="h-8 text-xs flex-1">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {enumOpts.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      type={FIELD_DATA_TYPES[condition.field] === 'number' ? 'number' : 'text'}
      placeholder={FIELD_DATA_TYPES[condition.field] === 'number' ? 'e.g. 100000' : 'Enter value'}
      value={condition.value}
      onChange={e => onChange(e.target.value)}
      className="h-8 text-xs flex-1"
    />
  )
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
  showRemove,
  index,
  logic,
}: {
  condition: Condition
  onChange: (c: Condition) => void
  onRemove: () => void
  showRemove: boolean
  index: number
  logic: 'AND' | 'OR'
}) {
  const operators = getOperatorsForField(condition.field)

  return (
    <div className="flex flex-col gap-1">
      {index > 0 && (
        <span
          className={cn(
            'text-[9px] font-bold uppercase tracking-widest px-0.5',
            logic === 'AND' ? 'text-violet-400' : 'text-amber-400'
          )}
        >
          {logic}
        </span>
      )}
      <div className="flex items-start gap-1.5 flex-wrap">
        {/* Field selector */}
        <Select
          value={condition.field}
          onValueChange={v => {
            const newField = v as ConditionField
            const newOps = getOperatorsForField(newField)
            onChange({ ...condition, field: newField, operator: newOps[0], value: '', value2: undefined })
          }}
        >
          <SelectTrigger className="h-8 text-xs w-36 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[10px]">Account Fields</SelectLabel>
              {ACCOUNT_CONDITION_FIELDS.map(f => (
                <SelectItem key={f} value={f} className="text-xs">{FIELD_LABELS[f]}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-[10px]">Rep Fields</SelectLabel>
              {REP_CONDITION_FIELDS.map(f => (
                <SelectItem key={f} value={f} className="text-xs">{FIELD_LABELS[f]}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Operator selector */}
        <Select
          value={condition.operator}
          onValueChange={v =>
            onChange({ ...condition, operator: v as ConditionOperator, value: '', value2: undefined })
          }
        >
          <SelectTrigger className="h-8 text-xs w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map(op => (
              <SelectItem key={op} value={op} className="text-xs">
                {OPERATOR_LABELS[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value input */}
        <div className="flex-1 min-w-[80px]">
          <ConditionValueInput
            condition={condition}
            onChange={(v, v2) => onChange({ ...condition, value: v, value2: v2 })}
          />
        </div>

        {/* Remove */}
        {showRemove && (
          <button
            onClick={onRemove}
            className="h-8 w-7 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Condition display
// ---------------------------------------------------------------------------

function ConditionBadge({ condition }: { condition: Condition }) {
  const fieldColor = FIELD_COLORS[condition.field]
  const isRepField = REP_FIELDS.has(condition.field)
  let valueDisplay = condition.value
  if (condition.field === 'arr') {
    valueDisplay =
      condition.operator === 'between'
        ? `${formatARR(condition.value)} – ${formatARR(condition.value2 ?? '0')}`
        : formatARR(condition.value)
  }
  if (condition.field === 'health_score') {
    valueDisplay = `${condition.value}%`
  }
  if (condition.field === 'segment') {
    valueDisplay = condition.value.charAt(0).toUpperCase() + condition.value.slice(1)
  }
  if (condition.field === 'rep_experience_years') {
    valueDisplay = `${condition.value} yrs`
  }
  if (condition.field === 'rep_performance_tier') {
    const tierLabels: Record<string, string> = {
      top_performer: 'Top Performer',
      solid: 'Solid',
      developing: 'Developing',
    }
    valueDisplay = tierLabels[condition.value] ?? condition.value
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-l-2 font-medium',
        fieldColor
      )}
    >
      {isRepField && (
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 bg-indigo-100 rounded px-0.5 mr-0.5">
          Rep:
        </span>
      )}
      <span className="opacity-60">{FIELD_LABELS[condition.field]}</span>
      <span className="opacity-50">{OPERATOR_LABELS[condition.operator]}</span>
      <span>{valueDisplay}</span>
    </span>
  )
}

function ConditionGroupDisplay({
  group,
  depth = 0,
}: {
  group: ConditionGroup
  depth?: number
}) {
  if (group.conditions.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No conditions — matches all accounts</span>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        depth > 0 && 'pl-3 border-l-2 border-dashed border-stone-200 ml-1'
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider',
          depth === 0 ? 'text-stone-400' : 'text-stone-400'
        )}
      >
        Match{' '}
        <span
          className={cn(
            'px-1.5 py-0.5 rounded font-bold',
            group.logic === 'AND' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
          )}
        >
          {group.logic === 'AND' ? 'ALL' : 'ANY'}
        </span>{' '}
        of the following
      </span>
      {group.conditions.map((item, idx) => (
        <div key={isConditionGroup(item) ? item.id : item.id} className="flex flex-col gap-1">
          {idx > 0 && (
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest px-1.5',
                group.logic === 'AND' ? 'text-violet-400' : 'text-amber-400'
              )}
            >
              {group.logic}
            </span>
          )}
          {isConditionGroup(item) ? (
            <div
              className={cn(
                'rounded-md p-2',
                depth === 0 ? 'bg-stone-50' : 'bg-white'
              )}
            >
              <ConditionGroupDisplay group={item} depth={depth + 1} />
            </div>
          ) : (
            <ConditionBadge condition={item} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action display
// ---------------------------------------------------------------------------

function ActionDisplay({ action }: { action: RuleAction }) {
  const icon =
    action.type === 'round_robin' ? (
      <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
    ) : action.type === 'least_loaded' ? (
      <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
    ) : (
      <User className="w-3.5 h-3.5 text-violet-600" />
    )

  const label =
    action.type === 'round_robin'
      ? 'Round-robin across'
      : action.type === 'least_loaded'
      ? 'Least loaded from'
      : 'Assign to'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}:</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {action.userIds.map((id) => (
          <div key={id} className="flex items-center gap-1">
            <Avatar userId={id} size="sm" />
            <span className="text-xs font-medium text-stone-700">
              {demoTeamMembers.find((m) => m.id === id)?.full_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rule Card
// ---------------------------------------------------------------------------

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  rule: Rule
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const maxHits = 300
  const hitPct = Math.min((rule.hitCount / maxHits) * 100, 100)

  const weightColor =
    rule.weight >= 80
      ? 'bg-emerald-100 text-emerald-700'
      : rule.weight >= 50
      ? 'bg-amber-100 text-amber-700'
      : 'bg-stone-100 text-stone-500'

  return (
    <div
      className={cn(
        'group bg-white rounded-xl border transition-all duration-200',
        rule.mustFollow && 'border-l-4 border-l-red-400',
        rule.active
          ? 'border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-px'
          : 'border-stone-200/60 opacity-60 hover:opacity-80'
      )}
    >
      {/* Header Row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
        {/* Drag handle */}
        <button className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Priority badge */}
        <span className="font-mono text-[11px] font-bold text-stone-400 bg-stone-100 rounded px-1.5 py-0.5 shrink-0">
          #{rule.priority}
        </span>

        {/* Weight badge */}
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0', weightColor)}>
          W:{rule.weight}
        </span>

        {/* Must-follow badge */}
        {rule.mustFollow && (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200 shrink-0">
            <Lock className="w-2.5 h-2.5" />
            Must Follow
          </span>
        )}

        {/* Rule name */}
        <span className="text-[13px] font-semibold text-stone-800 flex-1 truncate">
          {rule.name}
        </span>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5 w-16">
                    <Progress value={hitPct} className="h-1" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-stone-600 tabular-nums">
                    {rule.hitCount.toLocaleString()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Matched {rule.hitCount} accounts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <Clock className="w-3 h-3" />
            <span>{rule.lastTriggered}</span>
          </div>
        </div>

        {/* Toggle */}
        <Switch
          checked={rule.active}
          onCheckedChange={() => onToggle(rule.id)}
          className="shrink-0"
        />

        {/* 3-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="gap-2 text-xs">
              <Edit3 className="w-3.5 h-3.5" />
              Edit Rule
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => onDuplicate(rule.id)}>
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => onMoveUp(rule.id)}>
              <ChevronUp className="w-3.5 h-3.5" />
              Move Up
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs" onClick={() => onMoveDown(rule.id)}>
              <ChevronDown className="w-3.5 h-3.5" />
              Move Down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs text-red-600 focus:text-red-600"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Conditions + Action body */}
      <div className="px-4 py-3 flex flex-col gap-4">
        {/* Conditions */}
        <div>
          <ConditionGroupDisplay group={rule.conditionGroup} depth={0} />
        </div>

        {/* Action */}
        <div className="flex items-start gap-2 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5 shrink-0">
            Then
          </span>
          <ActionDisplay action={rule.action} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-50 rounded-b-xl border-t border-stone-100">
        <div className="flex items-center gap-3 text-[10px] text-stone-400">
          <span>
            Created by <span className="font-medium text-stone-500">{rule.createdBy}</span> ·{' '}
            {rule.createdAt}
          </span>
          <span className="hidden sm:inline">
            Modified <span className="font-medium text-stone-500">{rule.modifiedAt}</span>
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono text-stone-400">
          v{rule.version}
        </Badge>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Catch-All Card
// ---------------------------------------------------------------------------

function CatchAllCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 transition-all duration-200 hover:bg-amber-50/70">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-200/60">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <div className="flex-1">
          <span className="text-[13px] font-semibold text-amber-900">Catch-All Fallback</span>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Accounts matching no rules above are routed here
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] shrink-0">
          Always Active
        </Badge>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 pulse-subtle" />
            <span className="text-xs text-amber-800 font-semibold">312 unrouted accounts matched</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 shrink-0">
            Then
          </span>
          <div className="flex items-center gap-1.5 text-xs text-amber-800">
            <Shuffle className="w-3.5 h-3.5 text-amber-600" />
            <span>Round-robin across all available reps</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {demoTeamMembers.slice(2).map((m) => (
              <Avatar key={m.id} userId={m.id} size="sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// How It Works Banner
// ---------------------------------------------------------------------------

function HowItWorksBanner() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sky-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="w-4 h-4 text-sky-600 shrink-0" />
        <span className="text-xs font-semibold text-sky-800 flex-1">
          How does rule evaluation work?
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-sky-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        className="expand-transition"
        data-open={open ? 'true' : 'false'}
      >
        <div className="px-4 pb-4 flex flex-col gap-4">
          <p className="text-xs text-sky-700">
            The engine uses a <strong>three-pass evaluation</strong> model. Must-follow rules are
            enforced first, then weighted soft rules fire in priority order, and finally an equity
            pass balances rep books — breaking the lowest-weight rules first when needed.
          </p>

          {/* 3-step diagram */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-sky-100">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3 h-3 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Step 1 — Must Follow rules</p>
                <p className="text-[11px] text-sky-600 mt-0.5 leading-relaxed">
                  Always enforced first. Hard constraints that cannot be overridden — shown with a
                  red left border and <span className="font-semibold">Must Follow</span> lock badge.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-sky-100">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <SlidersHorizontal className="w-3 h-3 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Step 2 — Weighted soft rules</p>
                <p className="text-[11px] text-sky-600 mt-0.5 leading-relaxed">
                  Evaluated in priority order. Higher weight (W:90) means the engine resists breaking
                  them. Lower-weight rules break first when there is a conflict.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-sky-100">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Scale className="w-3 h-3 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Step 3 — Equity pass</p>
                <p className="text-[11px] text-sky-600 mt-0.5 leading-relaxed">
                  Book of business equity rules applied last. If a soft rule must break to balance
                  rep books, the lowest-weight rule breaks first.
                </p>
              </div>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Account arrives', color: 'bg-stone-700 text-white' },
              null,
              { label: 'Must Follow', color: 'bg-red-100 text-red-800', sub: 'pass 1' },
              null,
              { label: 'Weighted rules', color: 'bg-amber-100 text-amber-800', sub: 'pass 2' },
              null,
              { label: 'Equity check', color: 'bg-emerald-100 text-emerald-800', sub: 'pass 3' },
              null,
              { label: 'Assignment', color: 'bg-stone-800 text-white' },
            ].map((item, i) =>
              item === null ? (
                <ChevronRight key={i} className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <div key={i} className="flex flex-col items-center">
                  <span className={cn('px-2 py-1 rounded text-[10px] font-semibold', item.color)}>
                    {item.label}
                  </span>
                  {item.sub && (
                    <span className="text-[9px] text-stone-400 mt-0.5">{item.sub}</span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NewRuleSheet
// ---------------------------------------------------------------------------

function NewRuleSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (rule: Rule) => void
}) {
  const [name, setName]               = useState('')
  const [conditions, setConditions]   = useState<Condition[]>([
    { id: 'new-c-1', field: 'segment', operator: 'equals', value: '' },
  ])
  const [logic, setLogic]             = useState<'AND' | 'OR'>('AND')
  const [actionType, setActionType]   = useState<ActionType>('round_robin')
  const [selectedRepIds, setSelectedRepIds] = useState<string[]>([])
  const [weight, setWeight]           = useState(70)
  const [mustFollow, setMustFollow]   = useState(false)

  const reset = () => {
    setName('')
    setConditions([{ id: 'new-c-1', field: 'segment', operator: 'equals', value: '' }])
    setLogic('AND')
    setActionType('round_robin')
    setSelectedRepIds([])
    setWeight(70)
    setMustFollow(false)
  }

  const handleSave = () => {
    if (!name.trim()) { toast.error('Rule name required'); return }
    if (selectedRepIds.length === 0) { toast.error('Select at least one rep or manager'); return }
    const filledConditions = conditions.filter(c => c.value !== '')
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: name.trim(),
      priority: 999,
      active: true,
      weight,
      mustFollow,
      conditionGroup: { id: `cg-${Date.now()}`, logic, conditions: filledConditions },
      action: {
        type: actionType,
        userIds: selectedRepIds,
        label: buildActionLabel(actionType, selectedRepIds),
      },
      hitCount: 0,
      lastTriggered: 'Never',
      createdBy: 'Sarah Chen',
      createdAt: 'Just now',
      modifiedAt: 'Just now',
      version: 1,
    }
    onSave(newRule)
    toast.success('Rule created', { description: `"${name.trim()}" added to your rules.` })
    reset()
    onClose()
  }

  const weightColor =
    weight >= 80 ? 'bg-emerald-100 text-emerald-700'
    : weight >= 50 ? 'bg-amber-100 text-amber-700'
    : 'bg-stone-100 text-stone-600'

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-stone-200 shrink-0">
          <SheetTitle className="text-base">New Rule</SheetTitle>
          <SheetDescription className="text-xs">
            Configure a routing rule. Accounts will be evaluated top-to-bottom until the first match.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="flex flex-col gap-6 py-6">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-stone-700">Rule Name</Label>
              <Input
                placeholder="e.g. Enterprise High-Value Routing"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Conditions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">Conditions</Label>
                <div className="flex items-center rounded border border-stone-200 overflow-hidden">
                  {(['AND', 'OR'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setLogic(l)}
                      className={cn(
                        'px-2.5 py-1 text-[10px] font-bold border-r border-stone-200 last:border-r-0',
                        logic === l
                          ? 'bg-stone-800 text-white'
                          : 'text-stone-500 hover:bg-stone-50'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {conditions.map((cond, idx) => (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    onChange={updated =>
                      setConditions(prev => prev.map(c => c.id === cond.id ? updated : c))
                    }
                    onRemove={() => setConditions(prev => prev.filter(c => c.id !== cond.id))}
                    showRemove={conditions.length > 1}
                    index={idx}
                    logic={logic}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setConditions(prev => [
                    ...prev,
                    { id: `new-c-${Date.now()}`, field: 'segment', operator: 'equals', value: '' },
                  ])
                }
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <Plus className="w-3 h-3" />
                Add condition
              </button>
            </div>

            {/* Action */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-semibold text-stone-700">Assignment Action</Label>
              <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                {([
                  { v: 'round_robin',  label: 'Round-Robin' },
                  { v: 'least_loaded', label: 'Least Loaded' },
                  { v: 'assign_to',    label: 'Assign To' },
                ] as const).map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => { setActionType(v); setSelectedRepIds([]) }}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-medium border-r border-stone-200 last:border-r-0 transition-colors',
                      actionType === v ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                {actionType === 'assign_to'
                  ? 'Always route to the selected rep.'
                  : actionType === 'round_robin'
                  ? 'Rotate evenly across the selected pool.'
                  : 'Always pick the rep with the fewest active accounts.'}
              </p>

              {/* Rep picker */}
              <div className="rounded-lg border border-stone-200 overflow-hidden max-h-48 overflow-y-auto">
                {PICKABLE_MEMBERS.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedRepIds.includes(member.id)}
                      onCheckedChange={checked => {
                        if (actionType === 'assign_to') {
                          setSelectedRepIds(checked ? [member.id] : [])
                        } else {
                          setSelectedRepIds(prev =>
                            checked
                              ? [...prev, member.id]
                              : prev.filter(id => id !== member.id)
                          )
                        }
                      }}
                    />
                    <Avatar userId={member.id} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-800">{member.full_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {member.role}{member.specialties.length > 0 ? ` · ${member.specialties.slice(0, 2).join(', ')}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">Weight</Label>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', weightColor)}>
                  {weight}/100
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={weight}
                onChange={e => setWeight(parseInt(e.target.value))}
                className="w-full accent-stone-800"
              />
              <p className="text-[10px] text-muted-foreground">
                Higher weight = harder for the engine to break this rule when resolving equity conflicts.
              </p>
            </div>

            {/* Must Follow */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-stone-50">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-semibold text-stone-800">Must Follow</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hard constraint — this rule is never overridden by the equity pass.
                </p>
              </div>
              <Switch checked={mustFollow} onCheckedChange={setMustFollow} />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-stone-200 shrink-0 flex flex-row gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose() }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 press-scale gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Create Rule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// TAB 1 — Rules
// ---------------------------------------------------------------------------

function RulesTab({
  rules,
  setRules,
}: {
  rules: Rule[]
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
}) {
  const handleToggle = useCallback((id: string) => {
    setRules((prev) => {
      const rule = prev.find((r) => r.id === id)
      const next = prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
      if (rule) {
        const nowActive = !rule.active
        toast.success(nowActive ? 'Rule enabled' : 'Rule disabled', {
          description: `"${rule.name}" is now ${nowActive ? 'active' : 'inactive'}.`,
        })
      }
      return next
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setRules((prev) => {
      const filtered = prev.filter((r) => r.id !== id)
      return filtered.map((r, i) => ({ ...r, priority: i + 1 }))
    })
    toast.success('Rule deleted')
  }, [])

  const handleDuplicate = useCallback((id: string) => {
    setRules((prev) => {
      const rule = prev.find((r) => r.id === id)
      if (!rule) return prev
      const newRule: Rule = {
        ...rule,
        id: `rule-${Date.now()}`,
        name: `${rule.name} (copy)`,
        priority: prev.length + 1,
        hitCount: 0,
        version: 1,
        createdAt: 'Just now',
        modifiedAt: 'Just now',
      }
      return [...prev, newRule]
    })
    toast.success('Rule duplicated')
  }, [])

  const handleMoveUp = useCallback((id: string) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }, [])

  const handleMoveDown = useCallback((id: string) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }, [])

  const handleNewRule = useCallback(() => {
    toast('New rule editor coming soon', { description: 'Rule builder will open here' })
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <HowItWorksBanner />

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}

        <CatchAllCard />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 2 — Templates
// ---------------------------------------------------------------------------

const TEMPLATES = [
  // ── Match Rules ──────────────────────────────────────────────────────────
  {
    id: 't1',
    section: 'match' as const,
    icon: Globe,
    title: 'Territory-Based Routing',
    description: 'Route accounts automatically based on geography, region, or territory assignments.',
    badge: 'Popular',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  {
    id: 't2',
    section: 'match' as const,
    icon: Layers,
    title: 'Segment Tiering',
    description: "Split accounts across Enterprise, Corporate, and Commercial teams by segment.",
    badge: 'Recommended',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 't3',
    section: 'match' as const,
    icon: BarChart3,
    title: 'Capacity Balancing',
    description: "Distribute accounts evenly based on each rep's current capacity and workload.",
    badge: null,
    badgeColor: '',
  },
  {
    id: 't4',
    section: 'match' as const,
    icon: Target,
    title: 'Specialty Matching',
    description: 'Match account industry or vertical to the rep with the most relevant expertise.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't5',
    section: 'match' as const,
    icon: Heart,
    title: 'Health-Based Escalation',
    description: 'Automatically escalate at-risk accounts to managers or senior reps.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't6',
    section: 'match' as const,
    icon: Shuffle,
    title: 'Round-Robin Default',
    description: 'Simple, even distribution across all available reps with no conditions.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't7',
    section: 'match' as const,
    icon: User,
    title: 'Rep Experience Routing',
    description: 'Route accounts needing complex onboarding to reps with 2+ years of experience.',
    badge: 'New',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    id: 't8',
    section: 'match' as const,
    icon: TrendingUp,
    title: 'Top Performer Assignment',
    description: 'Direct high-value cross-sell opportunities to your top-performing AMs.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't9',
    section: 'match' as const,
    icon: Target,
    title: 'Industry Expert Match',
    description: 'Match account vertical to the rep with documented specialty expertise in that industry.',
    badge: null,
    badgeColor: '',
  },
  // ── Equity Rules ─────────────────────────────────────────────────────────
  {
    id: 't10',
    section: 'equity' as const,
    icon: Scale,
    title: 'ARR Book Balancer',
    description: "Keep all reps' total managed ARR within ±20% of the team mean.",
    badge: 'Equity',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 't11',
    section: 'equity' as const,
    icon: Users,
    title: 'Account Count Equity',
    description: 'Ensure no rep carries more than ±20% more accounts than the average.',
    badge: 'Equity',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
]

function TemplateCard({ t }: { t: typeof TEMPLATES[0] }) {
  const Icon = t.icon
  return (
    <div className="group bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-3 card-hover">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
          <Icon className="w-4.5 h-4.5 text-stone-600" />
        </div>
        {t.badge && (
          <Badge className={cn('text-[10px] h-5 px-1.5', t.badgeColor)}>
            {t.badge}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <h4 className="text-sm font-semibold text-stone-800">{t.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs press-scale"
          onClick={() => toast.success('Template applied — 1 new rule created')}
        >
          Use Template
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs press-scale"
          onClick={() => toast('Preview coming soon')}
        >
          Preview
        </Button>
      </div>
    </div>
  )
}

function TemplatesTab() {
  const matchTemplates = TEMPLATES.filter((t) => t.section === 'match')
  const equityTemplates = TEMPLATES.filter((t) => t.section === 'equity')

  return (
    <div className="flex flex-col gap-8">
      {/* Match Rules section */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Match Rules</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Route accounts based on account attributes and rep characteristics.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchTemplates.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      </div>

      {/* Equity Rules section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Equity Rules</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Keep rep books balanced by ARR, account count, or custom metrics.
            </p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5 ml-1">
            <Scale className="w-2.5 h-2.5 mr-0.5" />
            Book of Business
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equityTemplates.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 3 — Simulator
// ---------------------------------------------------------------------------

type SimInput = {
  segment: string
  arr: number
  healthScore: number
  geography: string
  industry: string
}

type SimResult = {
  ruleId: string
  ruleName: string
  matched: boolean
  reason: string
}

function evaluateCondition(condition: Condition, input: SimInput): boolean {
  const { field, operator, value, value2 } = condition
  let inputVal: number | string

  if (field === 'segment') inputVal = input.segment
  else if (field === 'geography') inputVal = input.geography
  else if (field === 'industry') inputVal = input.industry
  else if (field === 'arr') inputVal = input.arr
  else if (field === 'health_score') inputVal = input.healthScore
  else return false // rep fields not simulatable without rep input

  if (typeof inputVal === 'string') {
    if (operator === 'equals') return inputVal.toLowerCase() === value.toLowerCase()
    if (operator === 'not_equals') return inputVal.toLowerCase() !== value.toLowerCase()
    if (operator === 'contains') return inputVal.toLowerCase().includes(value.toLowerCase())
    if (operator === 'is_any_of')
      return value
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .includes(inputVal.toLowerCase())
    return false
  }

  const numVal = inputVal as number
  const numTarget = parseFloat(value)
  if (operator === 'equals') return numVal === numTarget
  if (operator === 'greater_than') return numVal > numTarget
  if (operator === 'less_than') return numVal < numTarget
  if (operator === 'between') return numVal >= numTarget && numVal <= parseFloat(value2 ?? '0')
  return false
}

function evaluateGroup(group: ConditionGroup, input: SimInput): boolean {
  if (group.conditions.length === 0) return true

  const results = group.conditions.map((item) => {
    if (isConditionGroup(item)) return evaluateGroup(item, input)
    return evaluateCondition(item, input)
  })

  return group.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

function runSimulation(rules: Rule[], input: SimInput): SimResult[] {
  return rules.map((rule) => {
    const matched = rule.active && evaluateGroup(rule.conditionGroup, input)
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      reason: matched
        ? 'All conditions satisfied'
        : !rule.active
        ? 'Rule is inactive'
        : 'Conditions not met',
    }
  })
}

const PRESET_ACCOUNTS: { label: string; input: SimInput; icon: string }[] = [
  {
    label: 'Enterprise Whale',
    icon: '🐋',
    input: { segment: 'enterprise', arr: 500000, healthScore: 90, geography: 'North America', industry: 'Fintech' },
  },
  {
    label: 'At-Risk SMB',
    icon: '⚠️',
    input: { segment: 'commercial', arr: 15000, healthScore: 28, geography: 'North America', industry: 'Retail' },
  },
  {
    label: 'New FINS Account',
    icon: '🏦',
    input: { segment: 'fins', arr: 75000, healthScore: 65, geography: 'EMEA', industry: 'Fintech' },
  },
  {
    label: 'International Corporate',
    icon: '🌍',
    input: { segment: 'international', arr: 120000, healthScore: 55, geography: 'APAC', industry: 'SaaS' },
  },
]

function SimulatorTab() {
  const [input, setInput] = useState<SimInput>({
    segment: 'commercial',
    arr: 150000,
    healthScore: 72,
    geography: 'North America',
    industry: 'SaaS',
  })
  const [results, setResults] = useState<SimResult[] | null>(null)
  const [ran, setRan] = useState(false)

  const handleRun = () => {
    const res = runSimulation(DEMO_RULES, input)
    setResults(res)
    setRan(true)
  }

  const handlePreset = (preset: (typeof PRESET_ACCOUNTS)[0]) => {
    setInput(preset.input)
    const res = runSimulation(DEMO_RULES, preset.input)
    setResults(res)
    setRan(true)
  }

  const firstMatch = results?.find((r) => r.matched)
  const matchingRule = firstMatch ? DEMO_RULES.find((r) => r.id === firstMatch.ruleId) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Test Account</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure account attributes to simulate which rule matches.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-4">
            {/* Segment */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-stone-600">Segment</Label>
              <select
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                value={input.segment}
                onChange={(e) => setInput((p) => ({ ...p, segment: e.target.value }))}
              >
                {SEGMENT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* ARR */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-stone-600">
                ARR
                <span className="ml-1 font-mono text-emerald-600">
                  ${input.arr.toLocaleString()}
                </span>
              </Label>
              <Input
                type="number"
                value={input.arr}
                min={0}
                step={5000}
                onChange={(e) => setInput((p) => ({ ...p, arr: parseInt(e.target.value, 10) || 0 }))}
                className="text-sm"
              />
            </div>

            {/* Health Score */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-stone-600">
                Health Score
                <span
                  className={cn(
                    'ml-1 font-mono font-semibold',
                    input.healthScore >= 80
                      ? 'text-emerald-600'
                      : input.healthScore >= 60
                      ? 'text-amber-600'
                      : input.healthScore >= 40
                      ? 'text-orange-600'
                      : 'text-red-600'
                  )}
                >
                  {input.healthScore}
                </span>
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                value={input.healthScore}
                onChange={(e) =>
                  setInput((p) => ({ ...p, healthScore: parseInt(e.target.value, 10) }))
                }
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>0 — Critical</span>
                <span>100 — Excellent</span>
              </div>
            </div>

            {/* Geography */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-stone-600">Geography</Label>
              <select
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                value={input.geography}
                onChange={(e) => setInput((p) => ({ ...p, geography: e.target.value }))}
              >
                {GEOGRAPHY_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-stone-600">Industry</Label>
              <Input
                value={input.industry}
                onChange={(e) => setInput((p) => ({ ...p, industry: e.target.value }))}
                placeholder="e.g. Fintech"
                className="text-sm"
              />
            </div>

            <Button
              className="w-full press-scale bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleRun}
            >
              <Play className="w-4 h-4" />
              Run Simulation
            </Button>
          </div>

          {/* Quick Tests */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Quick Test Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="text-left bg-white rounded-lg border border-stone-200 px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-150 press-scale"
                >
                  <div className="text-base mb-0.5">{preset.icon}</div>
                  <div className="text-xs font-semibold text-stone-700">{preset.label}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {preset.input.segment} · ${(preset.input.arr / 1000).toFixed(0)}K · H{preset.input.healthScore}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Simulation Results</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trace shows rule evaluation order. First match wins.
            </p>
          </div>

          {!ran ? (
            <div className="bg-white rounded-xl border border-stone-200 border-dashed flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-stone-400" />
              </div>
              <p className="text-sm text-stone-400">Run simulation to see results</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Final assignment */}
              {matchingRule ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col gap-2 fade-in-up">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">Match Found</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Matched rule{' '}
                    <strong className="font-semibold">#{matchingRule.priority} — {matchingRule.name}</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-1 pt-2 border-t border-emerald-200">
                    <span className="text-xs text-emerald-700 font-medium">Would be assigned via:</span>
                    <ActionDisplay action={matchingRule.action} />
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col gap-2 fade-in-up">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">No Rule Matched</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Account falls to catch-all fallback: round-robin across all reps.
                  </p>
                </div>
              )}

              {/* Trace */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-semibold text-stone-600">Evaluation Trace</span>
                </div>
                <div className="divide-y divide-stone-100">
                  {results!.map((res, idx) => {
                    const rule = DEMO_RULES.find((r) => r.id === res.ruleId)!
                    const isFirstMatch = res.matched && results!.findIndex((r) => r.matched) === idx

                    return (
                      <div
                        key={res.ruleId}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 text-xs',
                          isFirstMatch && 'bg-emerald-50'
                        )}
                      >
                        <span className="font-mono text-[10px] text-stone-400 w-5 shrink-0">
                          #{rule.priority}
                        </span>
                        {isFirstMatch ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                        )}
                        <span
                          className={cn(
                            'flex-1 truncate',
                            isFirstMatch ? 'font-semibold text-emerald-800' : 'text-stone-500'
                          )}
                        >
                          {res.ruleName}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] shrink-0',
                            isFirstMatch ? 'text-emerald-600 font-bold' : 'text-stone-400'
                          )}
                        >
                          {isFirstMatch ? 'MATCH' : res.reason}
                        </span>
                      </div>
                    )
                  })}
                  {/* Catch-all */}
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-xs',
                      !matchingRule && 'bg-amber-50'
                    )}
                  >
                    <span className="font-mono text-[10px] text-stone-400 w-5 shrink-0">∞</span>
                    <ShieldAlert
                      className={cn(
                        'w-3.5 h-3.5 shrink-0',
                        !matchingRule ? 'text-amber-600' : 'text-stone-300'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1',
                        !matchingRule ? 'font-semibold text-amber-800' : 'text-stone-400'
                      )}
                    >
                      Catch-All Fallback
                    </span>
                    <span
                      className={cn(
                        'text-[10px] shrink-0',
                        !matchingRule ? 'text-amber-600 font-bold' : 'text-stone-400'
                      )}
                    >
                      {!matchingRule ? 'ROUTED HERE' : 'skipped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 4 — History
// ---------------------------------------------------------------------------

const HISTORY_ENTRIES = [
  {
    id: 'h1',
    user: 'Sarah Chen',
    userId: 'user-1',
    action: 'created rule',
    target: 'Enterprise High-Value Routing',
    timestamp: '3 days ago',
    version: 'v1',
  },
  {
    id: 'h2',
    user: 'Sarah Chen',
    userId: 'user-1',
    action: 'modified conditions on',
    target: 'FINS Specialist Assignment',
    timestamp: '2 days ago',
    version: 'v2',
  },
  {
    id: 'h3',
    user: 'Marcus Johnson',
    userId: 'user-2',
    action: 'deactivated',
    target: 'At-Risk Account Escalation',
    timestamp: '2 days ago',
    version: 'v3',
  },
  {
    id: 'h4',
    user: 'Sarah Chen',
    userId: 'user-1',
    action: 'activated',
    target: 'At-Risk Account Escalation',
    timestamp: '1 day ago',
    version: 'v4',
  },
  {
    id: 'h5',
    user: 'Elena Rodriguez',
    userId: 'user-3',
    action: 'created rule',
    target: 'High Health Cross-Sell',
    timestamp: '1 day ago',
    version: 'v1',
  },
  {
    id: 'h6',
    user: 'Marcus Johnson',
    userId: 'user-2',
    action: 'updated action on',
    target: 'Corporate Mid-Market',
    timestamp: '20 hours ago',
    version: 'v3',
  },
  {
    id: 'h7',
    user: 'Sarah Chen',
    userId: 'user-1',
    action: 'reordered priority of',
    target: 'Commercial Growth Accounts',
    timestamp: '12 hours ago',
    version: 'v2',
  },
  {
    id: 'h8',
    user: 'Sarah Chen',
    userId: 'user-1',
    action: 'activated',
    target: 'At-Risk Account Escalation',
    timestamp: '4 hours ago',
    version: 'v4',
  },
  {
    id: 'h9',
    user: 'David Kim',
    userId: 'user-4',
    action: 'tested simulation for',
    target: 'Enterprise High-Value Routing',
    timestamp: '2 hours ago',
    version: 'v3',
  },
  {
    id: 'h10',
    user: 'Elena Rodriguez',
    userId: 'user-3',
    action: 'modified conditions on',
    target: 'High Health Cross-Sell',
    timestamp: '45 minutes ago',
    version: 'v2',
  },
]

const ACTION_COLORS: Record<string, string> = {
  'created rule': 'text-emerald-600',
  'modified conditions on': 'text-sky-600',
  deactivated: 'text-red-500',
  activated: 'text-emerald-600',
  'updated action on': 'text-violet-600',
  'reordered priority of': 'text-amber-600',
  'tested simulation for': 'text-stone-400',
}

function HistoryTab() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-800">Audit Log</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete history of all rule changes and modifications.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="divide-y divide-stone-100">
          {HISTORY_ENTRIES.map((entry) => (
            <div
              key={entry.id}
              className="group flex items-center gap-4 px-4 py-3 row-hover"
            >
              {/* Avatar */}
              <AvatarInitials
                name={entry.user}
                colorClass={AVATAR_COLORS[entry.userId]}
                size="sm"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-700 leading-snug">
                  <span className="font-semibold">{entry.user}</span>{' '}
                  <span className={cn(ACTION_COLORS[entry.action] ?? 'text-stone-600')}>
                    {entry.action}
                  </span>{' '}
                  <span className="font-medium text-stone-800">"{entry.target}"</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-stone-300" />
                  <span className="text-[10px] text-stone-400">{entry.timestamp}</span>
                </div>
              </div>

              {/* Version */}
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-mono text-stone-400 shrink-0"
              >
                {entry.version}
              </Badge>

              {/* Restore */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity press-scale gap-1 text-stone-500"
                onClick={() => toast.success('Version restored')}
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AddEquityRuleSheet
// ---------------------------------------------------------------------------

function AddEquityRuleSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (rule: EquityRule) => void
}) {
  const [name, setName]                   = useState('')
  const [metric, setMetric]               = useState<EquityMetric>('arr')
  const [customFieldName, setCustomFieldName] = useState('')
  const [customFieldUnit, setCustomFieldUnit] = useState('')
  const [tolerance, setTolerance]         = useState(20)
  const [weight, setWeight]               = useState(70)
  const [mustFollow, setMustFollow]       = useState(false)
  const [description, setDescription]     = useState('')

  // Live mean preview from real account data
  const liveMean = useMemo(() => {
    const activeReps = demoTeamMembers.filter(m => m.role === 'rep' && m.capacity > 0)
    if (metric === 'arr') {
      const vals = activeReps
        .map(r => demoAccounts.filter(a => a.current_owner_id === r.id).reduce((s, a) => s + a.arr, 0))
        .filter(v => v > 0)
      return vals.length > 0 ? vals.reduce((a, b) => a + b) / vals.length : 0
    }
    if (metric === 'account_count') {
      const vals = activeReps
        .map(r => demoAccounts.filter(a => a.current_owner_id === r.id).length)
        .filter(v => v > 0)
      return vals.length > 0 ? vals.reduce((a, b) => a + b) / vals.length : 0
    }
    if (metric === 'employee_count') {
      const vals = activeReps
        .map(r => demoAccounts.filter(a => a.current_owner_id === r.id).reduce((s, a) => s + (a.employee_count ?? 0), 0))
        .filter(v => v > 0)
      return vals.length > 0 ? vals.reduce((a, b) => a + b) / vals.length : 0
    }
    return 0
  }, [metric])

  const formatMean = (v: number) => {
    if (metric === 'arr') return formatBookARR(v)
    return Math.round(v).toLocaleString()
  }

  const reset = () => {
    setName('')
    setMetric('arr')
    setCustomFieldName('')
    setCustomFieldUnit('')
    setTolerance(20)
    setWeight(70)
    setMustFollow(false)
    setDescription('')
  }

  const handleSave = () => {
    if (!name.trim()) { toast.error('Rule name required'); return }
    if (metric === 'custom' && !customFieldName.trim()) {
      toast.error('Custom field name required')
      return
    }
    const autoDesc =
      metric === 'arr'
        ? `No rep's total managed ARR should exceed ±${tolerance}% of the team mean (${formatMean(liveMean)})`
        : metric === 'account_count'
        ? `All reps should carry within ±${tolerance}% of the average account count (${Math.round(liveMean)})`
        : metric === 'employee_count'
        ? `Cumulative employee count across each book should be within ±${tolerance}% of the mean`
        : `Balance ${customFieldName} across rep books within ±${tolerance}% of the mean`

    const newRule: EquityRule = {
      id: `eq-${Date.now()}`,
      name: name.trim(),
      metric,
      customFieldName: metric === 'custom' ? customFieldName.trim() : undefined,
      customFieldUnit: metric === 'custom' ? customFieldUnit.trim() || undefined : undefined,
      tolerance,
      weight,
      mustFollow,
      active: true,
      description: description.trim() || autoDesc,
    }
    onSave(newRule)
    toast.success('Equity rule created', { description: `"${name.trim()}" is now active.` })
    reset()
    onClose()
  }

  const weightColor =
    weight >= 80 ? 'bg-emerald-100 text-emerald-700'
    : weight >= 50 ? 'bg-amber-100 text-amber-700'
    : 'bg-stone-100 text-stone-600'

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-stone-200 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Scale className="w-4 h-4 text-emerald-600" />
            Add Equity Rule
          </SheetTitle>
          <SheetDescription className="text-xs">
            Configure a book-of-business balancing constraint.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="flex flex-col gap-6 py-6">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-stone-700">Rule Name</Label>
              <Input
                placeholder="e.g. ARR Balance"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Metric */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-stone-700">Balance Metric</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: 'arr',            label: 'ARR',            desc: 'Total managed ARR' },
                  { v: 'account_count',  label: 'Account Count',  desc: 'Number of accounts' },
                  { v: 'employee_count', label: 'Employee Count', desc: 'Employees across book' },
                  { v: 'custom',         label: 'Custom Field',   desc: 'Any numeric CRM field' },
                ] as const).map(({ v, label, desc }) => (
                  <button
                    key={v}
                    onClick={() => setMetric(v)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                      metric === v
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    )}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className={cn('text-[10px] mt-0.5', metric === v ? 'text-stone-300' : 'text-muted-foreground')}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom field inputs */}
            {metric === 'custom' && (
              <div className="flex flex-col gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-purple-800">CRM Field Name</Label>
                  <Input
                    placeholder="e.g. open_tickets"
                    value={customFieldName}
                    onChange={e => setCustomFieldName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-purple-800">Unit (optional)</Label>
                  <Input
                    placeholder="e.g. tickets"
                    value={customFieldUnit}
                    onChange={e => setCustomFieldUnit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Tolerance slider + live preview */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">Tolerance</Label>
                <span className="text-sm font-bold text-stone-800">±{tolerance}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={tolerance}
                onChange={e => setTolerance(parseInt(e.target.value))}
                className="w-full accent-stone-800"
              />
              {liveMean > 0 && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200 mt-1">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Floor</p>
                    <p className="text-xs font-bold text-stone-700">
                      {formatMean(liveMean * (1 - tolerance / 100))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Team Mean</p>
                    <p className="text-xs font-bold text-emerald-700">{formatMean(liveMean)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Ceiling</p>
                    <p className="text-xs font-bold text-stone-700">
                      {formatMean(liveMean * (1 + tolerance / 100))}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">Weight</Label>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', weightColor)}>
                  {weight}/100
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={weight}
                onChange={e => setWeight(parseInt(e.target.value))}
                className="w-full accent-stone-800"
              />
            </div>

            {/* Must Follow */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-stone-50">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-semibold text-stone-800">Must Follow</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hard constraint — routing rules cannot break this.
                </p>
              </div>
              <Switch checked={mustFollow} onCheckedChange={setMustFollow} />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-stone-700">Description (optional)</Label>
              <Textarea
                placeholder="Describe when this equity rule fires…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-stone-200 shrink-0 flex flex-row gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose() }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 press-scale gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Create Equity Rule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// TAB 5 — Book of Business
// ---------------------------------------------------------------------------

function BookOfBusinessTab({
  equityRules,
  setEquityRules,
  onAddEquityRule,
}: {
  equityRules: EquityRule[]
  setEquityRules: React.Dispatch<React.SetStateAction<EquityRule[]>>
  onAddEquityRule: () => void
}) {
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [sortCol, setSortCol] = useState<string>('arr')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleColSort = (col: string) => {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'name' ? 'asc' : 'desc')
    }
  }

  // Compute ALL active reps' book stats from real account data.
  // open_tickets: deterministic mock — 2.5–4.5 tickets per account, seeded by rep ID.
  const repBookData = useMemo(() => {
    const activeReps = demoTeamMembers.filter(m => m.role === 'rep' && m.capacity > 0)
    return activeReps
      .map(rep => {
        const repAccounts = demoAccounts.filter(a => a.current_owner_id === rep.id)
        if (repAccounts.length === 0) return null
        const arr        = repAccounts.reduce((s, a) => s + a.arr, 0)
        const accounts   = repAccounts.length
        const employees  = repAccounts.reduce((s, a) => s + (a.employee_count ?? 0), 0)
        // Deterministic per-rep noise (hash rep.id)
        const seed = rep.id.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
        const rate = 2.5 + ((Math.abs(seed) % 100) / 100) * 2   // 2.5 – 4.5 per account
        const open_tickets = Math.round(accounts * rate)
        return { repId: rep.id, name: rep.full_name, arr, accounts, employees, open_tickets }
      })
      .filter(Boolean) as {
        repId: string; name: string
        arr: number; accounts: number; employees: number; open_tickets: number
      }[]
  }, [])

  // Team means
  const means = useMemo(() => {
    const n = repBookData.length
    if (n === 0) return { arr: 0, accounts: 0, employees: 0, open_tickets: 0 }
    return {
      arr:          repBookData.reduce((s, r) => s + r.arr, 0) / n,
      accounts:     repBookData.reduce((s, r) => s + r.accounts, 0) / n,
      employees:    repBookData.reduce((s, r) => s + r.employees, 0) / n,
      open_tickets: repBookData.reduce((s, r) => s + r.open_tickets, 0) / n,
    }
  }, [repBookData])

  // Active equity rules by metric
  const arrRule       = equityRules.find(r => r.active && r.metric === 'arr')
  const accountsRule  = equityRules.find(r => r.active && r.metric === 'account_count')
  const employeesRule = equityRules.find(r => r.active && r.metric === 'employee_count')
  const customRule    = equityRules.find(r => r.active && r.metric === 'custom')

  // If the sorted column's rule gets toggled off, fall back to name sort
  const effectiveSortCol = (
    (sortCol === 'arr'       && !arrRule) ||
    (sortCol === 'accounts'  && !accountsRule) ||
    (sortCol === 'employees' && !employeesRule) ||
    (sortCol === 'custom'    && !customRule)
  ) ? 'name' : sortCol

  // Per-rep deviation + flag status
  const repMatrix = useMemo(() => {
    return repBookData.map(rep => {
      const arrDev         = means.arr > 0          ? ((rep.arr - means.arr) / means.arr) * 100                         : 0
      const accountsDev    = means.accounts > 0     ? ((rep.accounts - means.accounts) / means.accounts) * 100          : 0
      const employeesDev   = means.employees > 0    ? ((rep.employees - means.employees) / means.employees) * 100       : 0
      const openTicketsDev = means.open_tickets > 0 ? ((rep.open_tickets - means.open_tickets) / means.open_tickets) * 100 : 0

      const isArrFlagged         = arrRule       ? Math.abs(arrDev)         > arrRule.tolerance       : false
      const isAccountsFlagged    = accountsRule  ? Math.abs(accountsDev)    > accountsRule.tolerance  : false
      const isEmployeesFlagged   = employeesRule ? Math.abs(employeesDev)   > employeesRule.tolerance : false
      const isOpenTicketsFlagged = customRule    ? Math.abs(openTicketsDev) > customRule.tolerance    : false
      const hasFlag = isArrFlagged || isAccountsFlagged || isEmployeesFlagged || isOpenTicketsFlagged

      return {
        ...rep,
        arrDev:         Math.round(arrDev),
        accountsDev:    Math.round(accountsDev),
        employeesDev:   Math.round(employeesDev),
        openTicketsDev: Math.round(openTicketsDev),
        isArrFlagged, isAccountsFlagged, isEmployeesFlagged, isOpenTicketsFlagged, hasFlag,
      }
    })
  }, [repBookData, means, arrRule, accountsRule, employeesRule, customRule])

  const totalFlagged = repMatrix.filter(r => r.hasFlag).length

  // Build ordered list of active metric columns — drives both header and data cells
  type MetricColDef = {
    key: string
    label: string
    tolerance: number
    getValue:  (r: typeof repMatrix[0]) => number
    getDev:    (r: typeof repMatrix[0]) => number
    isFlagged: (r: typeof repMatrix[0]) => boolean
    format:    (v: number) => string
    meanVal:   () => number
  }
  const activeMetricCols = useMemo((): MetricColDef[] => {
    const cols: MetricColDef[] = []
    if (arrRule) cols.push({
      key: 'arr', label: 'ARR', tolerance: arrRule.tolerance,
      getValue:  r => r.arr,          getDev:    r => r.arrDev,         isFlagged: r => r.isArrFlagged,
      format:    v => formatBookARR(v), meanVal: () => means.arr,
    })
    if (accountsRule) cols.push({
      key: 'accounts', label: 'Accounts', tolerance: accountsRule.tolerance,
      getValue:  r => r.accounts,     getDev:    r => r.accountsDev,    isFlagged: r => r.isAccountsFlagged,
      format:    v => String(v),        meanVal: () => means.accounts,
    })
    if (employeesRule) cols.push({
      key: 'employees', label: 'Employees', tolerance: employeesRule.tolerance,
      getValue:  r => r.employees,    getDev:    r => r.employeesDev,   isFlagged: r => r.isEmployeesFlagged,
      format:    v => v.toLocaleString(), meanVal: () => means.employees,
    })
    if (customRule) {
      const rawName = customRule.customFieldName ?? 'custom'
      const label   = rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const unit    = customRule.customFieldUnit
      cols.push({
        key: 'custom', label, tolerance: customRule.tolerance,
        getValue:  r => r.open_tickets,       getDev:    r => r.openTicketsDev,  isFlagged: r => r.isOpenTicketsFlagged,
        format:    v => unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString(),
        meanVal: () => means.open_tickets,
      })
    }
    return cols
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrRule, accountsRule, employeesRule, customRule, means])

  const displayReps = useMemo(() => {
    const filtered = showFlaggedOnly ? repMatrix.filter(r => r.hasFlag) : repMatrix
    const col = effectiveSortCol
    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (col === 'name')      return dir * a.name.localeCompare(b.name)
      if (col === 'accounts')  return dir * (a.accounts - b.accounts)
      if (col === 'employees') return dir * (a.employees - b.employees)
      if (col === 'custom')    return dir * (a.open_tickets - b.open_tickets)
      return dir * (a.arr - b.arr)
    })
  }, [repMatrix, showFlaggedOnly, effectiveSortCol, sortDir])

  // Equity rules: compute out-of-range count using real data
  const getRuleOutOfRange = (rule: EquityRule) => {
    const vals = repBookData.map(rep => {
      if (rule.metric === 'arr')            return rep.arr
      if (rule.metric === 'account_count')  return rep.accounts
      if (rule.metric === 'employee_count') return rep.employees
      if (rule.metric === 'custom')         return rep.open_tickets
      return 0
    })
    const m = vals.length > 0 ? vals.reduce((a, b) => a + b) / vals.length : 0
    return vals.filter(v => {
      const tol = rule.tolerance / 100
      return v > m * (1 + tol) || v < m * (1 - tol)
    }).length
  }

  const metricIcon = (metric: EquityMetric) => {
    if (metric === 'arr')            return BarChart3
    if (metric === 'account_count')  return Users
    if (metric === 'employee_count') return User
    return Tag
  }

  // Cell color: in range → green, above mean → amber/red, below → sky blue
  const devColor = (dev: number, flagged: boolean) => {
    if (!flagged) return 'text-emerald-700 bg-emerald-50'
    if (dev > 0)  return Math.abs(dev) > 40 ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'
    return 'text-sky-700 bg-sky-50'
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Section A: Equity Rules ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Equity Rules</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hard and soft constraints to keep rep books balanced.
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={onAddEquityRule}>
            <Plus className="w-3.5 h-3.5" />
            Add Equity Rule
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {equityRules.map(rule => {
            const MetricIcon  = metricIcon(rule.metric)
            const ruleOOR     = getRuleOutOfRange(rule)
            const weightColor =
              rule.weight >= 80 ? 'bg-emerald-100 text-emerald-700'
              : rule.weight >= 50 ? 'bg-amber-100 text-amber-700'
              : 'bg-stone-100 text-stone-500'
            return (
              <div
                key={rule.id}
                className={cn(
                  'bg-white rounded-xl border p-4 flex flex-col gap-3 transition-opacity',
                  rule.mustFollow ? 'border-l-4 border-l-rose-400 border-stone-200' : 'border-stone-200',
                  !rule.active && 'opacity-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <MetricIcon className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-800">{rule.name}</span>
                      {rule.mustFollow && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                          <Lock className="w-2.5 h-2.5" />Must Follow
                        </span>
                      )}
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', weightColor)}>
                        W:{rule.weight}
                      </span>
                      {rule.metric === 'custom' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Custom: {rule.customFieldName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rule.description}</p>
                  </div>
                  <Switch
                    checked={rule.active}
                    onCheckedChange={() => {
                      setEquityRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))
                      toast.success(rule.active ? 'Equity rule disabled' : 'Equity rule enabled')
                    }}
                    className="shrink-0 mt-0.5"
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500 pt-2 border-t border-stone-100 flex-wrap">
                  <span>
                    Tolerance: within <span className="font-semibold text-stone-700">±{rule.tolerance}%</span> of team mean
                  </span>
                  {rule.active && (
                    ruleOOR > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        {ruleOOR} rep{ruleOOR > 1 ? 's' : ''} out of range
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />All balanced
                      </span>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section B: Multi-metric equity matrix ───────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Book Equity Analysis</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All {repBookData.length} active reps — deviation from team mean, flagged by active equity rules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalFlagged > 0 && (
              <button
                onClick={() => setShowFlaggedOnly(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                  showFlaggedOnly
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                )}
              >
                <ShieldAlert className="w-3 h-3" />
                {showFlaggedOnly ? 'Show all' : `${totalFlagged} flagged`}
              </button>
            )}
          </div>
        </div>

        {activeMetricCols.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl border border-stone-200 bg-white">
            <Scale className="w-6 h-6 text-stone-300" />
            <p className="text-sm font-medium text-stone-400">No active equity rules</p>
            <p className="text-xs text-stone-400">Enable a rule above to see the book distribution analysis.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {(() => {
              // 180px per metric col — enough for label + deviation pill without overlap
              const colTemplate = `minmax(160px, 1fr) ${activeMetricCols.map(() => '180px').join(' ')} 40px`

              return (
                <>
                  {/* Header */}
                  <div
                    className="grid bg-stone-50 border-b border-stone-200 px-5"
                    style={{ gridTemplateColumns: colTemplate }}
                  >
                    {/* Rep / name sort */}
                    <button
                      onClick={() => handleColSort('name')}
                      className={cn(
                        'flex items-center gap-1.5 py-3 text-[11px] font-semibold text-left transition-colors hover:text-stone-900',
                        effectiveSortCol === 'name' ? 'text-stone-900' : 'text-stone-400'
                      )}
                    >
                      Rep
                      {effectiveSortCol === 'name' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                    </button>

                    {/* One header per active metric */}
                    {activeMetricCols.map(col => (
                      <button
                        key={col.key}
                        onClick={() => handleColSort(col.key)}
                        className={cn(
                          'flex flex-col items-end justify-center gap-1 py-3 pr-4 transition-colors hover:text-stone-900 group',
                          effectiveSortCol === col.key ? 'text-stone-900' : 'text-stone-400'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {effectiveSortCol === col.key && (
                            sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                          )}
                          <span className="text-[11px] font-semibold">{col.label}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-500 group-hover:bg-stone-300 transition-colors font-semibold">
                          ±{col.tolerance}% tolerance
                        </span>
                      </button>
                    ))}

                    <span />
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-stone-100">
                    {displayReps.map(rep => {
                      const repHasFlag = activeMetricCols.some(col => col.isFlagged(rep))
                      return (
                        <div
                          key={rep.repId}
                          className={cn(
                            'grid items-center px-5 py-3 transition-colors',
                            repHasFlag ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-stone-50/60'
                          )}
                          style={{ gridTemplateColumns: colTemplate }}
                        >
                          {/* Rep info */}
                          <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <AvatarInitials
                              name={rep.name}
                              colorClass={AVATAR_COLORS[rep.repId] ?? 'bg-stone-100 text-stone-600'}
                              size="sm"
                            />
                            <span className="text-xs font-medium text-stone-800 truncate">{rep.name}</span>
                          </div>

                          {/* Data cells */}
                          {activeMetricCols.map(col => {
                            const val     = col.getValue(rep)
                            const dev     = col.getDev(rep)
                            const flagged = col.isFlagged(rep)
                            return (
                              <div
                                key={col.key}
                                className={cn(
                                  'flex items-center justify-end gap-2 pr-4',
                                  effectiveSortCol === col.key && 'bg-stone-50/80'
                                )}
                              >
                                <span className="text-[13px] font-semibold text-stone-800 tabular-nums font-mono">
                                  {col.format(val)}
                                </span>
                                <span className={cn(
                                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums whitespace-nowrap',
                                  devColor(dev, flagged)
                                )}>
                                  {dev > 0 ? '+' : ''}{dev}%
                                </span>
                              </div>
                            )
                          })}

                          {/* Status icon */}
                          <div className="flex justify-center">
                            {repHasFlag ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 cursor-default shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[220px]">
                                  <p className="text-xs leading-relaxed">
                                    {activeMetricCols
                                      .filter(col => col.isFlagged(rep))
                                      .map(col => `${col.label}: ${col.getDev(rep) > 0 ? '+' : ''}${col.getDev(rep)}% (limit ±${col.tolerance}%)`)
                                      .join('\n')}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer: team means */}
                  <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center gap-6 flex-wrap text-xs text-stone-500">
                    <span className="font-medium text-stone-400 uppercase tracking-wide text-[10px]">Team means</span>
                    {activeMetricCols.map(col => (
                      <span key={col.key} className="flex items-center gap-1.5">
                        <span className="text-stone-400">{col.label}:</span>
                        <span className="font-semibold text-stone-700">{col.format(Math.round(col.meanVal()))}</span>
                      </span>
                    ))}
                    <span className="ml-auto flex items-center gap-1.5">
                      {totalFlagged > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <ShieldAlert className="w-3 h-3" />
                          {totalFlagged} rep{totalFlagged > 1 ? 's' : ''} out of range
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />All reps balanced
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RulesPage() {
  const { isTrialMode, enterDemoMode } = useTrialMode()

  // Lifted state — shared across tabs
  const [rules, setRules]               = useState<Rule[]>(DEMO_RULES)
  const [equityRules, setEquityRules]   = useState<EquityRule[]>(DEMO_EQUITY_RULES)
  const [newRuleOpen, setNewRuleOpen]   = useState(false)
  const [addEquityOpen, setAddEquityOpen] = useState(false)

  const activeCount = rules.filter(r => r.active).length

  const handleNewRule = (rule: Rule) => {
    setRules(prev => {
      const withNew = [...prev, { ...rule, priority: prev.length + 1 }]
      return withNew
    })
  }

  const handleNewEquityRule = (rule: EquityRule) => {
    setEquityRules(prev => [...prev, rule])
  }

  if (isTrialMode) {
    return <TrialPageEmpty icon={Users} title="Assignment Rules" description="Configure routing rules to automatically assign accounts to the right reps during transitions." ctaLabel="Go to Integrations" ctaHref="/integrations" onExploreDemo={enterDemoMode} />
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Sheets */}
        <NewRuleSheet
          open={newRuleOpen}
          onClose={() => setNewRuleOpen(false)}
          onSave={handleNewRule}
        />
        <AddEquityRuleSheet
          open={addEquityOpen}
          onClose={() => setAddEquityOpen(false)}
          onSave={handleNewEquityRule}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Assignment Rules Engine
            </h1>
            <p className="text-sm text-muted-foreground">
              First-match-wins routing logic for account transitions
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1.5 text-xs py-1 px-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-subtle" />
              {activeCount} rules active
            </Badge>
            <Button
              className="press-scale gap-2 h-9"
              onClick={() => setNewRuleOpen(true)}
            >
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="bg-transparent border-b border-stone-200 rounded-none w-full justify-start h-auto p-0 gap-0">
            {[
              { value: 'rules',     label: 'Rules',            icon: SlidersHorizontal },
              { value: 'templates', label: 'Templates',        icon: Layers },
              { value: 'simulator', label: 'Simulator',        icon: Play },
              { value: 'history',   label: 'History',          icon: History },
              { value: 'book',      label: 'Book of Business', icon: BarChart3 },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium text-stone-500 rounded-none border-b-2 border-transparent',
                  'data-[state=active]:text-stone-900 data-[state=active]:border-stone-800',
                  'hover:text-stone-700 transition-colors duration-150',
                  'bg-transparent shadow-none'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {value === 'rules' && (
                  <span className="ml-0.5 font-mono text-[10px] bg-stone-100 text-stone-500 rounded px-1 py-0.5">
                    {rules.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="rules" className="mt-0">
              <RulesTab rules={rules} setRules={setRules} />
            </TabsContent>
            <TabsContent value="templates" className="mt-0">
              <TemplatesTab />
            </TabsContent>
            <TabsContent value="simulator" className="mt-0">
              <SimulatorTab />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <HistoryTab />
            </TabsContent>
            <TabsContent value="book" className="mt-0">
              <BookOfBusinessTab
                equityRules={equityRules}
                setEquityRules={setEquityRules}
                onAddEquityRule={() => setAddEquityOpen(true)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

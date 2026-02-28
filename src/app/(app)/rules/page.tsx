'use client'

import { useState, useCallback } from 'react'
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
import { cn } from '@/lib/utils'
import { demoTeamMembers } from '@/lib/demo-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConditionField = 'segment' | 'industry' | 'geography' | 'arr' | 'health_score'
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
}

const FIELD_COLORS: Record<ConditionField, string> = {
  segment: 'border-violet-400 bg-violet-50 text-violet-700',
  industry: 'border-sky-400 bg-sky-50 text-sky-700',
  geography: 'border-amber-400 bg-amber-50 text-amber-700',
  arr: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  health_score: 'border-rose-400 bg-rose-50 text-rose-700',
}

const FIELD_LEFT_BORDER: Record<ConditionField, string> = {
  segment: 'border-l-violet-400',
  industry: 'border-l-sky-400',
  geography: 'border-l-amber-400',
  arr: 'border-l-emerald-400',
  health_score: 'border-l-rose-400',
}

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
// Demo Rules Data
// ---------------------------------------------------------------------------

const buildId = (prefix: string, n: number) => `${prefix}-${n}`

const DEMO_RULES: Rule[] = [
  {
    id: 'rule-1',
    name: 'Enterprise High-Value Routing',
    priority: 1,
    active: true,
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
    conditionGroup: {
      id: 'cg-2',
      logic: 'AND',
      conditions: [
        { id: 'c-2-1', field: 'segment', operator: 'equals', value: 'fins' },
      ],
    },
    action: { type: 'round_robin', userIds: ['user-4', 'user-6'], label: 'Round-robin: David Kim, James O\'Brien' },
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
  'user-1': 'bg-violet-100 text-violet-700',
  'user-2': 'bg-sky-100 text-sky-700',
  'user-3': 'bg-emerald-100 text-emerald-700',
  'user-4': 'bg-amber-100 text-amber-700',
  'user-5': 'bg-rose-100 text-rose-700',
  'user-6': 'bg-cyan-100 text-cyan-700',
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

// ---------------------------------------------------------------------------
// Condition display
// ---------------------------------------------------------------------------

function ConditionBadge({ condition }: { condition: Condition }) {
  const fieldColor = FIELD_COLORS[condition.field]
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

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-l-2 font-medium',
        fieldColor
      )}
    >
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
  const memberNames = action.userIds
    .map((id) => demoTeamMembers.find((m) => m.id === id)?.full_name ?? id)

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

  return (
    <div
      className={cn(
        'group bg-white rounded-xl border transition-all duration-200',
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
        <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-xs text-sky-700">
            Rules are evaluated <strong>top-to-bottom</strong>. The first matching rule wins and
            determines the assignment. Accounts that match no rule are routed to the catch-all
            fallback.
          </p>
          {/* Diagram */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Account arrives', color: 'bg-stone-700 text-white' },
              null,
              { label: 'Rule 1', color: 'bg-stone-100 text-stone-600', sub: 'no match' },
              null,
              { label: 'Rule 2', color: 'bg-emerald-600 text-white', sub: 'MATCH!' },
              null,
              { label: 'Assignment', color: 'bg-emerald-100 text-emerald-800' },
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
// TAB 1 — Rules
// ---------------------------------------------------------------------------

function RulesTab() {
  const [rules, setRules] = useState<Rule[]>(DEMO_RULES)

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
  {
    id: 't1',
    icon: Globe,
    title: 'Territory-Based Routing',
    description: 'Route accounts automatically based on geography, region, or territory assignments.',
    badge: 'Popular',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  {
    id: 't2',
    icon: Layers,
    title: 'Segment Tiering',
    description: 'Split accounts across Enterprise, Corporate, and Commercial teams by segment.',
    badge: 'Recommended',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 't3',
    icon: BarChart3,
    title: 'Capacity Balancing',
    description: 'Distribute accounts evenly based on each rep\'s current capacity and workload.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't4',
    icon: Target,
    title: 'Specialty Matching',
    description: 'Match account industry or vertical to the rep with the most relevant expertise.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't5',
    icon: Heart,
    title: 'Health-Based Escalation',
    description: 'Automatically escalate at-risk accounts to managers or senior reps.',
    badge: null,
    badgeColor: '',
  },
  {
    id: 't6',
    icon: Shuffle,
    title: 'Round-Robin Default',
    description: 'Simple, even distribution across all available reps with no conditions.',
    badge: null,
    badgeColor: '',
  },
]

function TemplatesTab() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-800">Pre-built Templates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Start from a proven pattern and customize to fit your team.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon
          return (
            <div
              key={t.id}
              className="group bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-3 card-hover"
            >
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
        })}
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
  else return false

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
// Page
// ---------------------------------------------------------------------------

export default function RulesPage() {
  const [newRuleClick, setNewRuleClick] = useState(false)
  const activeCount = DEMO_RULES.filter((r) => r.active).length

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
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
              onClick={() => toast('New rule editor coming soon', { description: 'Rule builder will open here' })}
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
              { value: 'rules', label: 'Rules', icon: SlidersHorizontal },
              { value: 'templates', label: 'Templates', icon: Layers },
              { value: 'simulator', label: 'Simulator', icon: Play },
              { value: 'history', label: 'History', icon: History },
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
                    {DEMO_RULES.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="rules" className="mt-0">
              <RulesTab />
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
          </div>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}

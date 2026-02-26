'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Trash2,
  GripVertical,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  UserCheck,
  RefreshCw,
  BarChart2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RuleCondition {
  field: string
  operator: string
  value: string
  action?: { type: string; target_ids?: string[] }
}

interface Rule {
  id: string
  name: string
  rules: RuleCondition[]
  is_active: boolean
  priority: number
}

const FIELDS = [
  { value: 'segment', label: 'Segment' },
  { value: 'industry', label: 'Industry' },
  { value: 'geography', label: 'Geography' },
  { value: 'arr', label: 'ARR' },
  { value: 'health_score', label: 'Health Score' },
]

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
]

const CONDITION_FIELD_COLORS: Record<string, string> = {
  segment: 'bg-violet-50 text-violet-700 border-violet-200',
  industry: 'bg-sky-50 text-sky-700 border-sky-200',
  geography: 'bg-amber-50 text-amber-700 border-amber-200',
  arr: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  health_score: 'bg-rose-50 text-rose-700 border-rose-200',
}

const ACTION_TYPES = [
  {
    value: 'assign_specific',
    label: 'Assign to specific rep',
    icon: UserCheck,
    description: 'Route to a named team member',
  },
  {
    value: 'round_robin',
    label: 'Round-robin in pool',
    icon: RefreshCw,
    description: 'Distribute evenly across a group',
  },
  {
    value: 'least_loaded',
    label: 'Least loaded',
    icon: BarChart2,
    description: 'Assign to rep with fewest open accounts',
  },
]

// Demo seed data
const DEMO_RULES: Rule[] = [
  {
    id: 'rule-1',
    name: 'Enterprise accounts to senior reps',
    rules: [
      { field: 'segment', operator: 'equals', value: 'Enterprise' },
      { field: 'arr', operator: 'greater_than', value: '100000' },
    ],
    is_active: true,
    priority: 0,
  },
  {
    id: 'rule-2',
    name: 'APAC geography routing',
    rules: [{ field: 'geography', operator: 'equals', value: 'APAC' }],
    is_active: true,
    priority: 1,
  },
  {
    id: 'rule-3',
    name: 'Low health score escalation',
    rules: [{ field: 'health_score', operator: 'less_than', value: '40' }],
    is_active: false,
    priority: 2,
  },
]

export function RulesManager({
  rules: initialRules,
  teamMembers,
}: {
  rules: Rule[]
  teamMembers: { id: string; full_name: string }[]
}) {
  const seedRules = initialRules.length > 0 ? initialRules : DEMO_RULES
  const [rules, setRules] = useState<Rule[]>(seedRules)
  const [creating, setCreating] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newConditions, setNewConditions] = useState<RuleCondition[]>([
    { field: 'segment', operator: 'equals', value: '' },
  ])
  const [selectedActionType, setSelectedActionType] = useState<string>('round_robin')

  function toggleRule(ruleId: string, isActive: boolean) {
    setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, is_active: isActive } : r)))
    toast.success(isActive ? 'Rule activated' : 'Rule deactivated')
  }

  function deleteRule(ruleId: string) {
    const rule = rules.find(r => r.id === ruleId)
    setRules(prev => prev.filter(r => r.id !== ruleId))
    toast.success(`Rule "${rule?.name}" deleted`)
  }

  function movePriority(ruleId: string, direction: 'up' | 'down') {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === ruleId)
      if (direction === 'up' && idx === 0) return prev
      if (direction === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next.map((r, i) => ({ ...r, priority: i }))
    })
    toast.success('Priority updated')
  }

  function saveNewRule() {
    if (!newRuleName.trim()) {
      toast.error('Rule name is required')
      return
    }
    const filledConditions = newConditions.filter(c => c.value.trim() !== '')
    if (filledConditions.length === 0) {
      toast.error('At least one condition with a value is required')
      return
    }

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      rules: filledConditions,
      is_active: true,
      priority: rules.length,
    }

    setRules(prev => [...prev, newRule])
    setCreating(false)
    setNewRuleName('')
    setNewConditions([{ field: 'segment', operator: 'equals', value: '' }])
    setSelectedActionType('round_robin')
    toast.success('Rule created')
  }

  function addCondition() {
    setNewConditions(prev => [...prev, { field: 'segment', operator: 'equals', value: '' }])
  }

  function updateCondition(index: number, updates: Partial<RuleCondition>) {
    setNewConditions(prev => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)))
  }

  function removeCondition(index: number) {
    if (newConditions.length > 1) {
      setNewConditions(prev => prev.filter((_, i) => i !== index))
    }
  }

  function cancelCreate() {
    setCreating(false)
    setNewRuleName('')
    setNewConditions([{ field: 'segment', operator: 'equals', value: '' }])
    setSelectedActionType('round_robin')
  }

  const selectedAction = ACTION_TYPES.find(a => a.value === selectedActionType)

  return (
    <div className="space-y-3">
      {rules.length === 0 && !creating ? (
        <Card className="card-hover">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">No assignment rules configured yet</p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {rules.map((rule, index) => (
            <Card key={rule.id} className="card-hover">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {/* Drag handle */}
                  <button
                    className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label="Drag to reorder"
                    tabIndex={-1}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  {/* Rule body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Active dot indicator */}
                      <span
                        className={cn(
                          'inline-block h-1.5 w-1.5 rounded-full flex-shrink-0',
                          rule.is_active ? 'bg-emerald-500' : 'bg-stone-300'
                        )}
                      />
                      <p
                        className={cn(
                          'text-[13px] font-semibold leading-tight truncate',
                          !rule.is_active && 'text-muted-foreground'
                        )}
                      >
                        {rule.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 font-mono ml-auto flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Condition pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(rule.rules as RuleCondition[]).map((c, i) => {
                        const fieldLabel = FIELDS.find(f => f.value === c.field)?.label ?? c.field
                        const opLabel = OPERATORS.find(o => o.value === c.operator)?.label ?? c.operator
                        const colorClass =
                          CONDITION_FIELD_COLORS[c.field] ?? 'bg-stone-50 text-stone-600 border-stone-200'
                        return (
                          <span
                            key={i}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                              colorClass
                            )}
                          >
                            <span className="opacity-70">{fieldLabel}</span>
                            <span className="font-mono opacity-50">{opLabel}</span>
                            <span>{String(c.value)}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={v => toggleRule(rule.id, v)}
                      aria-label={`Toggle rule ${rule.name}`}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          aria-label="Rule actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => movePriority(rule.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="mr-2 h-3.5 w-3.5" />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => movePriority(rule.id, 'down')}
                          disabled={index === rules.length - 1}
                        >
                          <ArrowDown className="mr-2 h-3.5 w-3.5" />
                          Move down
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteRule(rule.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete rule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Create new rule form */}
      {creating ? (
        <Card className="border-dashed">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">New Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {/* Rule name */}
            <div className="space-y-1.5">
              <Label htmlFor="ruleName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Rule Name
              </Label>
              <Input
                id="ruleName"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
                placeholder="e.g. Enterprise accounts to senior reps"
                className="text-sm"
                autoFocus
              />
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Conditions
              </Label>
              <div className="space-y-2">
                {newConditions.map((condition, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={v => updateCondition(i, { field: v })}
                    >
                      <SelectTrigger className="w-[130px] text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={v => updateCondition(i, { operator: v })}
                    >
                      <SelectTrigger className="w-[110px] text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={condition.value}
                      onChange={e => updateCondition(i, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1 text-xs h-8"
                    />
                    {newConditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => removeCondition(i)}
                        aria-label="Remove condition"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={addCondition} className="h-7 text-xs px-2">
                <Plus className="mr-1.5 h-3 w-3" /> Add Condition
              </Button>
            </div>

            {/* Action selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assignment Action
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {ACTION_TYPES.map(action => {
                  const Icon = action.icon
                  const isSelected = selectedActionType === action.value
                  return (
                    <button
                      key={action.value}
                      onClick={() => setSelectedActionType(action.value)}
                      className={cn(
                        'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md',
                          isSelected ? 'bg-primary/10' : 'bg-muted'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      <div>
                        <p
                          className={cn(
                            'text-[11px] font-semibold leading-tight',
                            isSelected ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {action.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedAction && (
                <p className="text-[11px] text-muted-foreground">
                  Action:{' '}
                  <span className="font-medium text-foreground">{selectedAction.label}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={cancelCreate}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveNewRule}>
                Save Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        rules.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Add Rule
          </Button>
        )
      )}
    </div>
  )
}

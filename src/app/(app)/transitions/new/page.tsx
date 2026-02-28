'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Search,
  Calendar,
  FileText,
} from 'lucide-react'
import { formatCurrency, getHealthBg, getSegmentColor, formatSegment } from '@/lib/utils'
import { toast } from 'sonner'
import { demoTeamMembers, demoAccounts } from '@/lib/demo-data'
import { RecommendationCards } from '@/components/assignment/recommendation-cards'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 'select_rep' | 'select_accounts' | 'review_assignments' | 'configure'

interface AiRec {
  userId: string
  userName: string
  score: number
  specialtyMatch: boolean
}

interface AccountRec {
  accountId: string
  accountName: string
  recs: AiRec[]
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------
const STEPS: { key: Step; label: string; description: string }[] = [
  { key: 'select_rep',          label: 'Departing AM',    description: 'Select the account manager' },
  { key: 'select_accounts',     label: 'Select Accounts', description: 'Choose accounts to transition' },
  { key: 'review_assignments',  label: 'AI Assignments',  description: 'Review recommendations' },
  { key: 'configure',           label: 'Configure',       description: 'Set details & create' },
]

const STEP_ORDER: Step[] = ['select_rep', 'select_accounts', 'review_assignments', 'configure']

// ---------------------------------------------------------------------------
// Deterministic mock AI scoring
// For a given account + candidate rep, produce a score 60–95 based on
// whether the rep's specialties overlap with the account's segment.
// ---------------------------------------------------------------------------
function mockScore(accountSegment: string, repSpecialties: string[], repIndex: number, accountIndex: number): number {
  const segmentKey = accountSegment.toLowerCase()
  const hasMatch = repSpecialties.some(s => s.toLowerCase().includes(segmentKey) || segmentKey.includes(s.toLowerCase()))
  // Base score seeded from indices to be deterministic
  const base = ((repIndex * 13 + accountIndex * 7) % 20) + (hasMatch ? 72 : 55)
  return Math.min(95, Math.max(60, base))
}

function buildRecommendations(
  selectedAccountIds: Set<string>,
  departingRepId: string,
): AccountRec[] {
  const selectedAccountsList = demoAccounts.filter(a => selectedAccountIds.has(a.id))
  const candidates = demoTeamMembers.filter(m => m.id !== departingRepId && m.capacity > 0)

  return selectedAccountsList.map((account, aIdx) => {
    const scored = candidates.map((rep, rIdx) => ({
      userId: rep.id,
      userName: rep.full_name,
      score: mockScore(account.segment, rep.specialties ?? [], rIdx, aIdx),
      specialtyMatch: (rep.specialties ?? []).some(s =>
        s.toLowerCase().includes(account.segment.toLowerCase()) ||
        account.segment.toLowerCase().includes(s.toLowerCase())
      ),
    }))

    // Sort descending, take top 3
    const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3)

    return {
      accountId: account.id,
      accountName: account.name,
      recs: top3,
    }
  })
}

// ---------------------------------------------------------------------------
// Stepper component
// ---------------------------------------------------------------------------
function Stepper({ currentStep }: { currentStep: Step }) {
  const currentIdx = STEP_ORDER.indexOf(currentStep)

  return (
    <div className="flex items-center w-full">
      {STEPS.map((s, i) => {
        const isCompleted = i < currentIdx
        const isActive = i === currentIdx

        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            {/* Step bubble + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 border-2',
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-border text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              </div>
              <div className="text-center">
                <p
                  className={[
                    'text-[11px] font-semibold leading-tight',
                    isActive ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {s.label}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 mt-[-18px]">
                <div
                  className={[
                    'h-[2px] w-full rounded-full transition-all duration-300',
                    i < currentIdx ? 'bg-emerald-400' : 'bg-border',
                  ].join(' ')}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------
function ScoreBar({ score }: { score: number }) {
  const pct = score
  const color =
    score >= 85 ? 'bg-emerald-500' : score >= 72 ? 'bg-amber-400' : 'bg-orange-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-foreground w-6 text-right">{score}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function NewTransitionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep]                           = useState<Step>('select_rep')
  const [submitting, setSubmitting]               = useState(false)
  const [selectedRepId, setSelectedRepId]         = useState<string>('')
  const [accountSearch, setAccountSearch]         = useState<string>('')
  const [selectedAccounts, setSelectedAccounts]   = useState<Set<string>>(new Set())
  const [recommendations, setRecommendations]     = useState<AccountRec[]>([])
  const [assignments, setAssignments]             = useState<Map<string, string>>(new Map())
  const [reason, setReason]                       = useState<string>('rep_departure')
  const [priority, setPriority]                   = useState<string>('high')
  const [dueDate, setDueDate]                     = useState<string>('')
  const [notes, setNotes]                         = useState<string>('')

  // ---------------------------------------------------------------------------
  // Pre-select accounts from ?accounts= query param
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const accountsParam = searchParams.get('accounts')
    if (!accountsParam) return

    const ids = accountsParam.split(',').filter(Boolean)
    if (ids.length === 0) return

    // Build pre-selected set
    const validIds = new Set(ids.filter(id => demoAccounts.some(a => a.id === id)))
    if (validIds.size === 0) return

    setSelectedAccounts(validIds)

    // Try to auto-detect the departing rep from the first account
    const firstAccount = demoAccounts.find(a => validIds.has(a.id))
    if (firstAccount?.current_owner_id) {
      setSelectedRepId(firstAccount.current_owner_id)
      // If there's a rep, auto-advance to step 2
      setStep('select_accounts')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const selectedRep = useMemo(
    () => demoTeamMembers.find(m => m.id === selectedRepId) ?? null,
    [selectedRepId],
  )

  const repAccounts = useMemo(
    () =>
      selectedRepId
        ? demoAccounts
            .filter(a => a.current_owner_id === selectedRepId)
            .sort((a, b) => b.arr - a.arr)
        : [],
    [selectedRepId],
  )

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.toLowerCase()
    if (!q) return repAccounts
    return repAccounts.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.segment.toLowerCase().includes(q) ||
        (a.industry ?? '').toLowerCase().includes(q),
    )
  }, [repAccounts, accountSearch])

  const repTotalArr = useMemo(
    () => repAccounts.reduce((s, a) => s + a.arr, 0),
    [repAccounts],
  )

  const selectedArr = useMemo(
    () =>
      demoAccounts
        .filter(a => selectedAccounts.has(a.id))
        .reduce((s, a) => s + a.arr, 0),
    [selectedAccounts],
  )

  const allFilteredSelected =
    filteredAccounts.length > 0 &&
    filteredAccounts.every(a => selectedAccounts.has(a.id))

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleRepChange(repId: string) {
    setSelectedRepId(repId)
    setSelectedAccounts(new Set())
    setAccountSearch('')
  }

  function toggleAccount(id: string, checked: boolean) {
    setSelectedAccounts(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedAccounts(prev => {
        const next = new Set(prev)
        filteredAccounts.forEach(a => next.add(a.id))
        return next
      })
    } else {
      setSelectedAccounts(prev => {
        const next = new Set(prev)
        filteredAccounts.forEach(a => next.delete(a.id))
        return next
      })
    }
  }

  function handleGetRecommendations() {
    const recs = buildRecommendations(selectedAccounts, selectedRepId)
    setRecommendations(recs)

    // Auto-assign top rec per account
    const auto = new Map<string, string>()
    recs.forEach(r => {
      if (r.recs.length > 0) auto.set(r.accountId, r.recs[0].userId)
    })
    setAssignments(auto)
    setStep('review_assignments')
  }

  function setAssignment(accountId: string, userId: string) {
    setAssignments(prev => {
      const next = new Map(prev)
      next.set(accountId, userId)
      return next
    })
  }

  function handleCreate() {
    setSubmitting(true)
    // Simulate async operation
    setTimeout(() => {
      setSubmitting(false)
      toast.success(
        `${assignments.size} transition${assignments.size !== 1 ? 's' : ''} created successfully`,
        {
          description: `${formatCurrency(selectedArr)} ARR queued for handoff from ${selectedRep?.full_name}.`,
          duration: 4000,
        },
      )
      router.push('/transitions')
    }, 900)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Transition</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Set up account handoffs with AI-powered assignment recommendations.
        </p>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} />

      {/* ------------------------------------------------------------------ */}
      {/* STEP 1 — Select Departing AM                                        */}
      {/* ------------------------------------------------------------------ */}
      {step === 'select_rep' && (
        <Card className="card-hover">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Select Departing AM</CardTitle>
                <CardDescription className="text-[12px]">
                  Choose the account manager whose accounts need to be reassigned.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Account Manager
              </Label>
              <Select value={selectedRepId} onValueChange={handleRepChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a team member..." />
                </SelectTrigger>
                <SelectContent>
                  {demoTeamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-medium">{m.full_name}</span>
                      <span className="ml-2 text-muted-foreground text-[12px]">{m.email}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rep stats card */}
            {selectedRep && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Current Portfolio
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-lg bg-background border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium">Accounts</p>
                      <p className="text-lg font-bold tabular-nums leading-tight">{repAccounts.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium">Total ARR</p>
                      <p className="text-lg font-bold tabular-nums leading-tight">
                        {formatCurrency(repTotalArr)}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedRep.specialties && selectedRep.specialties.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Specialties:</span>
                    {selectedRep.specialties.map(s => (
                      <Badge key={s} variant="secondary" className="text-[11px] px-2 py-0">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => setStep('select_accounts')}
                disabled={!selectedRepId || repAccounts.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2 — Select Accounts                                            */}
      {/* ------------------------------------------------------------------ */}
      {step === 'select_accounts' && (
        <Card className="card-hover">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Select Accounts to Transition</CardTitle>
                <CardDescription className="text-[12px]">
                  {repAccounts.length} accounts owned by{' '}
                  <span className="font-medium text-foreground">{selectedRep?.full_name}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, segment, or industry..."
                className="pl-9 h-9 text-[12px]"
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
              />
            </div>

            {/* Select all row */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={checked => toggleSelectAll(!!checked)}
                />
                <span className="text-[12px] font-medium">
                  {allFilteredSelected ? 'Deselect all' : 'Select all'}
                  {filteredAccounts.length !== repAccounts.length && (
                    <span className="text-muted-foreground ml-1">({filteredAccounts.length} shown)</span>
                  )}
                </span>
              </label>
              {selectedAccounts.size > 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {selectedAccounts.size} selected · {formatCurrency(selectedArr)}
                </span>
              )}
            </div>

            {/* Account list */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {filteredAccounts.length === 0 && (
                <p className="text-[12px] text-muted-foreground text-center py-8">
                  No accounts match your search.
                </p>
              )}
              {filteredAccounts.map(account => (
                <label
                  key={account.id}
                  className={[
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors duration-100',
                    selectedAccounts.has(account.id)
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'hover:bg-accent/40',
                  ].join(' ')}
                >
                  <Checkbox
                    checked={selectedAccounts.has(account.id)}
                    onCheckedChange={checked => toggleAccount(account.id, !!checked)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{account.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {account.industry}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border ${getSegmentColor(account.segment)}`}
                      variant="outline"
                    >
                      {formatSegment(account.segment)}
                    </Badge>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 border ${getHealthBg(account.health_score)}`}
                      variant="outline"
                    >
                      {account.health_score}
                    </Badge>
                    <span className="text-[12px] font-semibold tabular-nums w-20 text-right">
                      {formatCurrency(account.arr)}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setStep('select_rep')} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button
                onClick={handleGetRecommendations}
                disabled={selectedAccounts.size === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Get AI Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 3 — Review Assignments                                         */}
      {/* ------------------------------------------------------------------ */}
      {step === 'review_assignments' && (
        <div className="space-y-4">
          {/* AI banner */}
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-emerald-800">AI Recommended</p>
              <p className="text-[11px] text-emerald-700">
                Scored {recommendations.length} account
                {recommendations.length !== 1 ? 's' : ''} against {demoTeamMembers.filter(m => m.id !== selectedRepId && m.capacity > 0).length} eligible reps.
                Override any assignment using the dropdowns below.
              </p>
            </div>
          </div>

          {/* Assignment cards */}
          <div className="space-y-3">
            {recommendations.map(rec => {
              const account = demoAccounts.find(a => a.id === rec.accountId)
              return (
                <RecommendationCards
                  key={rec.accountId}
                  accountId={rec.accountId}
                  accountName={rec.accountName}
                  accountSegment={account?.segment || 'enterprise'}
                  accountIndustry={account?.industry || 'Technology'}
                  accountArr={account?.arr || 0}
                  recommendations={rec.recs}
                  currentAssignment={assignments.get(rec.accountId) || null}
                  onAssign={(userId) => setAssignment(rec.accountId, userId)}
                />
              )
            })}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setStep('select_accounts')} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              onClick={() => setStep('configure')}
              disabled={assignments.size < recommendations.length}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 4 — Configure & Create                                         */}
      {/* ------------------------------------------------------------------ */}
      {step === 'configure' && (
        <div className="space-y-4">
          {/* Summary card */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-[12px] font-semibold text-emerald-800">Transition Summary</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{selectedAccounts.size}</p>
                  <p className="text-[11px] text-muted-foreground">Accounts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(selectedArr)}</p>
                  <p className="text-[11px] text-muted-foreground">Total ARR</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{assignments.size}</p>
                  <p className="text-[11px] text-muted-foreground">Transitions</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-700">
                <Users className="h-3.5 w-3.5 shrink-0" />
                From <span className="font-semibold">{selectedRep?.full_name}</span>
                &nbsp;→&nbsp;
                {Array.from(new Set(Array.from(assignments.values())))
                  .map(id => demoTeamMembers.find(m => m.id === id)?.full_name)
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </CardContent>
          </Card>

          {/* Config form */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Transition Details</CardTitle>
                  <CardDescription className="text-[12px]">
                    Configure priority, reason, and timeline for the handoffs.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Reason */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Reason
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-9 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rep_departure">Rep Departure</SelectItem>
                      <SelectItem value="territory_change">Territory Change</SelectItem>
                      <SelectItem value="rebalance">Portfolio Rebalance</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Priority
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <span className="font-medium text-red-600">Critical</span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="font-medium text-orange-600">High</span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span className="font-medium text-amber-600">Medium</span>
                      </SelectItem>
                      <SelectItem value="low">
                        <span className="font-medium text-emerald-600">Low</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                  <span className="text-muted-foreground normal-case tracking-normal font-normal">(optional)</span>
                </Label>
                <Input
                  type="date"
                  className="h-9 text-[12px]"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Notes
                  <span className="ml-1 text-muted-foreground normal-case tracking-normal font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Add any context or instructions for the receiving rep..."
                  className="text-[12px] resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('review_assignments')}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create {assignments.size} Transition{assignments.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

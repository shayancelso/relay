'use client'

// Onboarding Wizard — /onboarding
// First-time setup wizard for new organizations.
// 5 steps: Welcome → Import Accounts → Invite Team → Configure Rules → Ready!
//
// All local state, no backend calls.
// On final step, redirects to /dashboard.

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building2,
  Upload,
  Users,
  Sliders,
  PartyPopper,
  Plus,
  X,
  Download,
  ChevronRight,
  Check,
  Zap,
  ArrowLeft,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: 'Welcome', icon: Building2 },
  { id: 2, label: 'Import', icon: Upload },
  { id: 3, label: 'Invite Team', icon: Users },
  { id: 4, label: 'Rules', icon: Sliders },
  { id: 5, label: 'Ready!', icon: PartyPopper },
] as const

type Role = 'Admin' | 'Manager' | 'Rep'

interface InviteRow {
  id: string
  email: string
  role: Role
  capacity: number
}

interface Rule {
  id: string
  title: string
  description: string
  enabled: boolean
  badge: string
}

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

const DEFAULT_INVITES: InviteRow[] = [
  { id: 'inv-1', email: 'sarah.chen@company.com', role: 'Admin', capacity: 0 },
  { id: 'inv-2', email: 'marcus.j@company.com', role: 'Manager', capacity: 50 },
]

const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule-capacity',
    title: 'Balance by Capacity',
    description:
      'Automatically route accounts to the rep with the most available capacity. Prevents overloading and ensures even distribution.',
    enabled: true,
    badge: 'Recommended',
  },
  {
    id: 'rule-segment',
    title: 'Match by Segment Specialty',
    description:
      'Assign accounts to reps whose specialties align with the account segment — Enterprise, FINS, Commercial, etc.',
    enabled: true,
    badge: 'Popular',
  },
  {
    id: 'rule-geo',
    title: 'Geographic Proximity',
    description:
      'Prefer reps in the same country or region as the account. Reduces time zone friction for high-touch accounts.',
    enabled: false,
    badge: 'Optional',
  },
]

// ---------------------------------------------------------------------------
// Stepper component
// ---------------------------------------------------------------------------

function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Onboarding steps" className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const isCompleted = current > step.id
        const isActive = current === step.id
        const isLast = idx === STEPS.length - 1
        const StepIcon = step.icon

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shrink-0',
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                    : isActive
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm shadow-emerald-200'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium hidden sm:block whitespace-nowrap transition-colors',
                  isActive ? 'text-emerald-700' : isCompleted ? 'text-stone-500' : 'text-stone-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 w-10 md:w-16 mx-1 mb-5 rounded-full transition-all duration-500',
                  current > step.id ? 'bg-emerald-400' : 'bg-stone-200'
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function StepWelcome({
  orgName,
  setOrgName,
  onNext,
}: {
  orgName: string
  setOrgName: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 fade-in-up">
      {/* Logo mark */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
        <Zap className="w-8 h-8 text-white" />
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Welcome to Relay
        </h1>
        <p className="mt-2 text-stone-500 text-base max-w-sm mx-auto leading-relaxed">
          Let&rsquo;s set up your workspace in a few minutes. No credit card required.
        </p>
      </div>

      <Card className="w-full max-w-sm border-stone-200 shadow-sm">
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="org-name" className="text-stone-700 font-medium text-sm">
              Your organization name
            </Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Financial Group"
              className="h-10 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && orgName.trim() && onNext()}
              autoFocus
            />
            <p className="text-xs text-stone-400">
              This is how your workspace will appear to your team.
            </p>
          </div>

          <Button
            onClick={onNext}
            disabled={!orgName.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-semibold"
          >
            Get Started
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-stone-400">
        Already have an account?{' '}
        <a href="/dashboard" className="text-emerald-600 hover:underline font-medium">
          Sign in
        </a>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Import Accounts
// ---------------------------------------------------------------------------

function StepImport({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setFileName(file.name)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Import Accounts</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Upload your existing accounts via CSV, or connect your CRM to sync automatically.
        </p>
      </div>

      {/* CSV upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer group',
          dragging
            ? 'border-emerald-400 bg-emerald-50'
            : fileName
            ? 'border-emerald-300 bg-emerald-50/60'
            : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100/60'
        )}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV file"
        />

        {fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-stone-800">{fileName}</p>
            <p className="text-xs text-emerald-600 font-medium">Ready to import</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-stone-200 group-hover:bg-stone-300 flex items-center justify-center transition-colors">
              <Upload className="w-5 h-5 text-stone-500" />
            </div>
            <p className="text-sm font-semibold text-stone-700">
              Drag &amp; drop your CSV here
            </p>
            <p className="text-xs text-stone-400">or click to browse — .csv files only</p>
          </div>
        )}
      </div>

      {/* Sample download */}
      <div className="flex items-center justify-between px-1">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-emerald-600 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download sample CSV
        </a>
        <Badge variant="secondary" className="text-xs text-stone-500">
          Up to 10,000 accounts
        </Badge>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* CRM connect */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Connect your CRM
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Salesforce', color: 'bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700', initial: 'SF' },
            { name: 'HubSpot', color: 'bg-orange-50 border-orange-200 hover:border-orange-300 text-orange-700', initial: 'HS' },
          ].map((crm) => (
            <button
              key={crm.name}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 card-hover',
                crm.color
              )}
              onClick={(e) => e.preventDefault()}
            >
              <div className="w-7 h-7 rounded-md bg-white/80 border border-current/20 flex items-center justify-center text-xs font-bold shrink-0">
                {crm.initial}
              </div>
              {crm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onSkip}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Skip for now
        </button>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Invite Team
// ---------------------------------------------------------------------------

const ROLES: Role[] = ['Admin', 'Manager', 'Rep']

function InviteRowItem({
  row,
  onChange,
  onRemove,
  canRemove,
}: {
  row: InviteRow
  onChange: (id: string, field: keyof InviteRow, value: string | number) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  return (
    <div className="flex items-center gap-2 group">
      <Input
        type="email"
        value={row.email}
        onChange={(e) => onChange(row.id, 'email', e.target.value)}
        placeholder="colleague@company.com"
        className="flex-1 h-9 text-sm"
        aria-label="Team member email"
      />

      {/* Role selector */}
      <div className="flex rounded-lg border border-stone-200 overflow-hidden shrink-0 h-9">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => onChange(row.id, 'role', r)}
            className={cn(
              'px-2.5 text-xs font-medium transition-colors whitespace-nowrap',
              row.role === r
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Capacity — only for Rep */}
      {row.role === 'Rep' && (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={row.capacity}
            onChange={(e) => onChange(row.id, 'capacity', Number(e.target.value))}
            className="w-16 h-9 text-sm text-center"
            min={0}
            max={1000}
            aria-label="Capacity"
          />
          <span className="text-xs text-stone-400 whitespace-nowrap">accts</span>
        </div>
      )}

      {/* Remove */}
      {canRemove && (
        <button
          onClick={() => onRemove(row.id)}
          className="w-8 h-8 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove invite"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function StepInvite({
  onNext,
}: {
  onNext: () => void
}) {
  const [rows, setRows] = useState<InviteRow[]>(DEFAULT_INVITES)

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `inv-${Date.now()}`, email: '', role: 'Rep', capacity: 400 },
    ])
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updateRow = (id: string, field: keyof InviteRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const filledCount = rows.filter((r) => r.email.trim()).length

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Invite Your Team</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Add team members and set their roles. Reps can be given a capacity limit.
        </p>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Column headers */}
          <div className="flex items-center gap-2 px-0">
            <span className="flex-1 text-xs font-medium text-stone-400 uppercase tracking-wide">Email</span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wide w-[112px]">Role</span>
            <span className="w-8" />
          </div>

          {rows.map((row) => (
            <InviteRowItem
              key={row.id}
              row={row}
              onChange={updateRow}
              onRemove={removeRow}
              canRemove={rows.length > 1}
            />
          ))}

          {/* Add another */}
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another
          </button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-stone-400">
          {filledCount > 0
            ? `${filledCount} invitation${filledCount === 1 ? '' : 's'} ready to send`
            : 'No invites added yet'}
        </p>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Configure Rules
// ---------------------------------------------------------------------------

function RuleCard({
  rule,
  onToggle,
}: {
  rule: Rule
  onToggle: (id: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(rule.id)}
      className={cn(
        'w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-150 card-hover',
        rule.enabled
          ? 'border-emerald-300 bg-emerald-50/70 shadow-sm'
          : 'border-stone-200 bg-white hover:border-stone-300'
      )}
      aria-pressed={rule.enabled}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
          rule.enabled
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-stone-300 bg-white'
        )}
      >
        {rule.enabled && <Check className="w-3 h-3 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-900">{rule.title}</span>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5',
              rule.badge === 'Recommended' && 'bg-emerald-100 text-emerald-700',
              rule.badge === 'Popular' && 'bg-sky-100 text-sky-700',
              rule.badge === 'Optional' && 'bg-stone-100 text-stone-500'
            )}
          >
            {rule.badge}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">{rule.description}</p>
      </div>
    </button>
  )
}

function StepRules({ onNext }: { onNext: () => void }) {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES)

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Configure Rules</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Choose how Relay automatically assigns accounts to your team. You can adjust these anytime.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-stone-400">
          {enabledCount} rule{enabledCount !== 1 ? 's' : ''} enabled
        </p>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Finish Setup
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Ready!
// ---------------------------------------------------------------------------

function ConfettiDots() {
  // Deterministic positions to avoid hydration mismatch
  const dots = [
    { x: 15, y: 20, color: 'bg-emerald-400', size: 'w-2.5 h-2.5', delay: '0ms' },
    { x: 80, y: 15, color: 'bg-sky-400', size: 'w-2 h-2', delay: '150ms' },
    { x: 90, y: 70, color: 'bg-amber-400', size: 'w-3 h-3', delay: '300ms' },
    { x: 10, y: 75, color: 'bg-rose-400', size: 'w-2 h-2', delay: '200ms' },
    { x: 50, y: 5, color: 'bg-violet-400', size: 'w-2.5 h-2.5', delay: '100ms' },
    { x: 25, y: 88, color: 'bg-emerald-300', size: 'w-1.5 h-1.5', delay: '400ms' },
    { x: 75, y: 88, color: 'bg-orange-400', size: 'w-2 h-2', delay: '250ms' },
    { x: 5, y: 45, color: 'bg-pink-400', size: 'w-1.5 h-1.5', delay: '350ms' },
    { x: 95, y: 40, color: 'bg-cyan-400', size: 'w-2.5 h-2.5', delay: '50ms' },
    { x: 60, y: 95, color: 'bg-yellow-400', size: 'w-2 h-2', delay: '450ms' },
    { x: 40, y: 92, color: 'bg-indigo-400', size: 'w-1.5 h-1.5', delay: '180ms' },
    { x: 20, y: 50, color: 'bg-teal-400', size: 'w-2 h-2', delay: '320ms' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" aria-hidden>
      {dots.map((dot, i) => (
        <div
          key={i}
          className={cn(dot.color, dot.size, 'absolute rounded-full animate-bounce opacity-75')}
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            animationDelay: dot.delay,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  )
}

function StepReady({
  orgName,
  onFinish,
}: {
  orgName: string
  onFinish: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 fade-in-up">
      {/* Celebration card */}
      <div className="relative w-32 h-32">
        <ConfettiDots />
        <div className="absolute inset-4 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
          Your workspace is ready!
        </h2>
        <p className="mt-2 text-stone-500 text-base max-w-sm mx-auto leading-relaxed">
          {orgName ? (
            <>
              <span className="font-medium text-stone-700">{orgName}</span> is all set.{' '}
            </>
          ) : null}
          Relay is configured and your team will receive their invitations shortly.
        </p>
      </div>

      {/* Summary bullets */}
      <div className="flex flex-col gap-2 items-start w-full max-w-xs">
        {[
          'Workspace created',
          'Team invites queued',
          'Assignment rules active',
          'Ready for first transition',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-stone-600">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            {item}
          </div>
        ))}
      </div>

      <Button
        onClick={onFinish}
        size="lg"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 shadow-sm shadow-emerald-200"
      >
        Go to Dashboard
        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
      </Button>

      <p className="text-xs text-stone-400">
        You can always update these settings from the{' '}
        <a href="/settings" className="text-emerald-600 hover:underline font-medium">
          Settings
        </a>{' '}
        page.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Onboarding Wizard
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')

  const goNext = () => setStep((s) => Math.min(s + 1, 5))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))
  const handleFinish = () => router.push('/dashboard')

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepWelcome orgName={orgName} setOrgName={setOrgName} onNext={goNext} />
        )
      case 2:
        return <StepImport onNext={goNext} onSkip={goNext} />
      case 3:
        return <StepInvite onNext={goNext} />
      case 4:
        return <StepRules onNext={goNext} />
      case 5:
        return <StepReady orgName={orgName} onFinish={handleFinish} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-tight">Relay</span>
          </div>
          <span className="text-xs text-stone-400 font-medium">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-6">
        <div className="w-full max-w-2xl">
          {/* Stepper */}
          <Stepper current={step} />

          {/* Step content card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 min-h-[400px] flex flex-col">
            {renderStep()}
          </div>

          {/* Back button (not on step 1 or step 5) */}
          {step > 1 && step < 5 && (
            <div className="mt-4 flex justify-start">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

'use client'

// Free Trial Onboarding — /onboarding
// 7-step real-data signup flow triggered from "Start Free Trial" on the landing page.
// Steps: About You → Your CRM → Connect Your Data → Your Team → Map Fields → Configure Rules → You're in!
//
// All local state, no backend calls (backend wiring is a future task — see plan).
// On finish: saves to localStorage('relay-trial-data'), redirects to /dashboard.
// Escape hatch on step 3: "Explore with sample data" sets relay-demo-mode and skips to dashboard.

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronRight,
  ArrowLeft,
  PartyPopper,
  Check,
  Upload,
  Loader2,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CRM = 'salesforce' | 'hubspot' | 'other'
type TeamRole = 'Admin' | 'Manager' | 'Rep'
type CoreFieldType = 'text' | 'number' | 'date' | 'category'
type CustomFieldType = 'text' | 'number' | 'date' | 'boolean'

interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
}

interface FieldMapping {
  relayName: string
  customerName: string
}

interface CustomField {
  id: string
  crmName: string
  type: CustomFieldType
}

interface RuleConfig {
  id: string
  enabled: boolean
  params: Record<string, number | string>
}

interface OnboardingData {
  // Step 1
  fullName: string
  workEmail: string
  jobTitle: string
  companyName: string
  companySize: string
  // Step 2
  crm: CRM | ''
  // Step 3
  crmConnected: boolean
  csvFileName: string | null
  // Step 4
  team: TeamMember[]
  // Step 5
  fieldMappings: FieldMapping[]
  customFields: CustomField[]
  // Step 6
  rules: RuleConfig[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORE_FIELDS: { relayName: string; defaultCrmName: string; type: CoreFieldType }[] = [
  { relayName: 'Account Name', defaultCrmName: 'Account Name', type: 'text' },
  { relayName: 'Account Owner', defaultCrmName: 'Account Owner', type: 'text' },
  { relayName: 'Annual Revenue (ARR)', defaultCrmName: 'ARR', type: 'number' },
  { relayName: 'Health Score', defaultCrmName: 'Health Score', type: 'number' },
  { relayName: 'Contract Renewal Date', defaultCrmName: 'Renewal Date', type: 'date' },
  { relayName: 'Account Segment / Tier', defaultCrmName: 'Account Tier', type: 'category' },
  { relayName: 'Industry', defaultCrmName: 'Industry', type: 'text' },
  { relayName: 'Geography / Region', defaultCrmName: 'Region', type: 'text' },
  { relayName: 'CSM Name', defaultCrmName: 'CSM Name', type: 'text' },
]

const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = CORE_FIELDS.map((f) => ({
  relayName: f.relayName,
  customerName: f.defaultCrmName,
}))

const INITIAL_DATA: OnboardingData = {
  fullName: '',
  workEmail: '',
  jobTitle: '',
  companyName: '',
  companySize: '',
  crm: '',
  crmConnected: false,
  csvFileName: null,
  team: [{ id: 'member-1', name: '', email: '', role: 'Rep' }],
  fieldMappings: DEFAULT_FIELD_MAPPINGS,
  customFields: [],
  rules: [],
}

const TOTAL_STEPS = 7
const STEP_LABELS = ['About you', 'Your CRM', 'Connect data', 'Your team', 'Map fields', 'Rules', "You're in!"]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultArrCap(team: TeamMember[]): number {
  const count = team.filter((m) => m.name.trim() || m.email.trim()).length
  if (count <= 5) return 8
  if (count <= 15) return 4
  if (count <= 50) return 2
  return 1.5
}

function getDefaultRules(team: TeamMember[]): RuleConfig[] {
  return [
    { id: 'arr_cap', enabled: true, params: { cap: getDefaultArrCap(team) } },
    { id: 'health_dist', enabled: true, params: { pct: 30, threshold: 50 } },
    { id: 'renewal_urgency', enabled: true, params: { days: 90 } },
    { id: 'segment_match', enabled: true, params: {} },
    { id: 'geo_proximity', enabled: false, params: {} },
  ]
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function FieldTypeBadge({ type }: { type: CoreFieldType }) {
  const config: Record<CoreFieldType, { label: string; className: string }> = {
    text: { label: 'Text', className: 'bg-stone-100 text-stone-500' },
    number: { label: 'Number', className: 'bg-blue-100 text-blue-600' },
    date: { label: 'Date', className: 'bg-violet-100 text-violet-600' },
    category: { label: 'Category', className: 'bg-amber-100 text-amber-600' },
  }
  const { label, className } = config[type]
  return (
    <span className={cn('shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold', className)}>
      {label}
    </span>
  )
}

function RuleBadge({ variant }: { variant: 'recommended' | 'popular' | 'optional' }) {
  const config = {
    recommended: 'bg-emerald-100 text-emerald-700',
    popular: 'bg-sky-100 text-sky-700',
    optional: 'bg-stone-100 text-stone-500',
  }
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        config[variant]
      )}
    >
      {variant}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div className="h-0.5 w-full bg-stone-200 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — About You
// ---------------------------------------------------------------------------

function StepAboutYou({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const getErrors = () => ({
    fullName: !data.fullName.trim() ? 'Full name is required' : '',
    workEmail: !data.workEmail.trim()
      ? 'Work email is required'
      : !data.workEmail.includes('@')
      ? 'Please enter a valid email address'
      : '',
    companyName: !data.companyName.trim() ? 'Company name is required' : '',
  })

  const errors = getErrors()
  const canProceed = !errors.fullName && !errors.workEmail && !errors.companyName

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = () => {
    setTouched({ fullName: true, workEmail: true, companyName: true })
    if (canProceed) onNext()
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">About you</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Tell us a bit about yourself to personalize your Relay workspace.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-stone-700 font-medium text-sm">
              Full name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              onBlur={() => handleBlur('fullName')}
              placeholder="Alex Johnson"
              className={cn('h-10 text-sm', touched.fullName && errors.fullName ? 'border-rose-400 focus-visible:ring-rose-400/20' : '')}
              autoFocus
            />
            {touched.fullName && errors.fullName && (
              <p className="text-xs text-rose-500 mt-0.5">{errors.fullName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workEmail" className="text-stone-700 font-medium text-sm">
              Work email <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="workEmail"
              type="email"
              value={data.workEmail}
              onChange={(e) => onChange({ workEmail: e.target.value })}
              onBlur={() => handleBlur('workEmail')}
              placeholder="alex@company.com"
              className={cn('h-10 text-sm', touched.workEmail && errors.workEmail ? 'border-rose-400 focus-visible:ring-rose-400/20' : '')}
            />
            {touched.workEmail && errors.workEmail && (
              <p className="text-xs text-rose-500 mt-0.5">{errors.workEmail}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-stone-700 font-medium text-sm">
              Company name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
              onBlur={() => handleBlur('companyName')}
              placeholder="Acme Financial Group"
              className={cn('h-10 text-sm', touched.companyName && errors.companyName ? 'border-rose-400 focus-visible:ring-rose-400/20' : '')}
            />
            {touched.companyName && errors.companyName && (
              <p className="text-xs text-rose-500 mt-0.5">{errors.companyName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle" className="text-stone-700 font-medium text-sm">
              Job title
            </Label>
            <Input
              id="jobTitle"
              value={data.jobTitle}
              onChange={(e) => onChange({ jobTitle: e.target.value })}
              placeholder="VP of Customer Success"
              className="h-10 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companySize" className="text-stone-700 font-medium text-sm">
            Company size
          </Label>
          <Select value={data.companySize} onValueChange={(v) => onChange({ companySize: v })}>
            <SelectTrigger id="companySize" className="h-10 text-sm">
              <SelectValue placeholder="How many employees?" />
            </SelectTrigger>
            <SelectContent>
              {['1–10', '11–50', '51–200', '201–1,000', '1,000+'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={touched.fullName !== undefined && touched.workEmail !== undefined && touched.companyName !== undefined && !canProceed}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Your CRM
// ---------------------------------------------------------------------------

const CRM_OPTIONS: { id: CRM; label: string; description: string; color: string }[] = [
  {
    id: 'salesforce',
    label: 'Salesforce',
    description: 'Connect via OAuth. Requires admin access.',
    color: 'border-blue-200 hover:border-blue-400 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50',
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    description: 'Connect via OAuth. Works with any HubSpot plan.',
    color: 'border-orange-200 hover:border-orange-400 data-[selected=true]:border-orange-500 data-[selected=true]:bg-orange-50',
  },
  {
    id: 'other',
    label: 'Other / None',
    description: 'Upload a CSV export from your CRM or spreadsheet.',
    color: 'border-stone-200 hover:border-stone-400 data-[selected=true]:border-emerald-500 data-[selected=true]:bg-emerald-50',
  },
]

function StepYourCRM({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Which CRM do you use?</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Relay will pull your accounts, reps, and renewal dates directly from your CRM.
        </p>
      </div>

      <div className="space-y-3">
        {CRM_OPTIONS.map((crm) => (
          <button
            key={crm.id}
            data-selected={data.crm === crm.id}
            onClick={() => onChange({ crm: crm.id, crmConnected: false })}
            className={cn(
              'w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150',
              crm.color
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                data.crm === crm.id
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-stone-300 bg-white'
              )}
            >
              {data.crm === crm.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900">{crm.label}</p>
              <p className="text-xs text-stone-500 mt-0.5">{crm.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <Button
          onClick={onNext}
          disabled={!data.crm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Connect Your Data
// ---------------------------------------------------------------------------

function CRMConnectPanel({
  crm,
  connected,
  onConnect,
}: {
  crm: 'salesforce' | 'hubspot'
  connected: boolean
  onConnect: () => void
}) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    // Simulate OAuth handshake UI (real OAuth wired later)
    setTimeout(() => {
      setConnecting(false)
      onConnect()
    }, 1800)
  }

  const isSalesforce = crm === 'salesforce'
  const label = isSalesforce ? 'Salesforce' : 'HubSpot'
  const accentClass = isSalesforce
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-orange-500 hover:bg-orange-600'

  if (connected) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-emerald-300 bg-emerald-50">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">{label} connection queued</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            We&apos;ll complete the sync once your account is active.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="px-5 py-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
        <p className="text-sm font-semibold text-stone-800">What you&apos;ll need</p>
        <ul className="space-y-1.5">
          {[
            `Your ${label} login credentials`,
            'Admin or API access permissions',
            'About 2 minutes',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-stone-600">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-400 pt-1">
          Not sure you have access?{' '}
          <span className="text-stone-500 font-medium">Ask your CRM admin — this takes 2 minutes.</span>
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={connecting}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-semibold text-sm transition-all',
          accentClass,
          connecting && 'opacity-70 cursor-not-allowed'
        )}
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting to {label}…
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            Connect {label}
          </>
        )}
      </button>
    </div>
  )
}

function CSVUploadPanel({
  fileName,
  onFileSelect,
}: {
  fileName: string | null
  onFileSelect: (name: string) => void
}) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.csv')) onFileSelect(file.name)
    },
    [onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file.name)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
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
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV"
        />
        {fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-stone-800">{fileName}</p>
            <p className="text-xs text-emerald-600 font-medium">Ready to import</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center">
              <Upload className="w-5 h-5 text-stone-500" />
            </div>
            <p className="text-sm font-semibold text-stone-700">Drop your CSV here</p>
            <p className="text-xs text-stone-400">or click to browse — .csv files only</p>
          </div>
        )}
      </div>

      {/* Expected fields */}
      <div className="px-4 py-3 rounded-xl bg-stone-50 border border-stone-200">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          Expected columns
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['Account Name', 'ARR', 'Owner Email', 'Renewal Date', 'Segment', 'Health Score'].map(
            (col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-xs text-stone-600 font-medium"
              >
                {col}
              </span>
            )
          )}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Only Account Name is required. Missing columns will use defaults.
        </p>
      </div>
    </div>
  )
}

function StepConnectData({
  data,
  onChange,
  onNext,
  onBack,
  onSkipToDemo,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  onSkipToDemo: () => void
}) {
  const crm = data.crm as CRM

  const canProceed =
    crm === 'other'
      ? true // CSV is optional — they can proceed without uploading
      : data.crmConnected

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Connect your data</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          {crm === 'other'
            ? 'Upload a CSV export of your accounts to get started.'
            : `Connect your ${crm === 'salesforce' ? 'Salesforce' : 'HubSpot'} account so Relay can sync your accounts and reps.`}
        </p>
      </div>

      {(crm === 'salesforce' || crm === 'hubspot') && (
        <CRMConnectPanel
          crm={crm}
          connected={data.crmConnected}
          onConnect={() => onChange({ crmConnected: true })}
        />
      )}

      {crm === 'other' && (
        <CSVUploadPanel
          fileName={data.csvFileName}
          onFileSelect={(name) => onChange({ csvFileName: name })}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
        >
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Escape hatch */}
      <p className="text-center text-xs text-stone-400 pt-1">
        Not ready yet?{' '}
        <button
          onClick={onSkipToDemo}
          className="text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors font-medium"
        >
          Explore with sample data instead
        </button>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — Your Team
// ---------------------------------------------------------------------------

const TEAM_ROLES: TeamRole[] = ['Admin', 'Manager', 'Rep']

function TeamRow({
  member,
  onChange,
  onRemove,
  canRemove,
}: {
  member: TeamMember
  onChange: (id: string, field: keyof TeamMember, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  return (
    <div className="flex items-center gap-2 group">
      <Input
        value={member.name}
        onChange={(e) => onChange(member.id, 'name', e.target.value)}
        placeholder="Full name"
        className="flex-1 h-9 text-sm"
        aria-label="Name"
      />
      <Input
        type="email"
        value={member.email}
        onChange={(e) => onChange(member.id, 'email', e.target.value)}
        placeholder="email@company.com"
        className="flex-1 h-9 text-sm"
        aria-label="Email"
      />
      {/* Role toggle */}
      <div className="flex rounded-lg border border-stone-200 overflow-hidden shrink-0 h-9">
        {TEAM_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => onChange(member.id, 'role', r)}
            className={cn(
              'px-2.5 text-xs font-medium transition-colors whitespace-nowrap',
              member.role === r
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(member.id)}
          className="w-8 h-8 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function StepYourTeam({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const addRow = () => {
    if (data.team.length >= 10) return
    onChange({
      team: [...data.team, { id: `member-${Date.now()}`, name: '', email: '', role: 'Rep' }],
    })
  }

  const removeRow = (id: string) => {
    onChange({ team: data.team.filter((m) => m.id !== id) })
  }

  const updateRow = (id: string, field: keyof TeamMember, value: string) => {
    onChange({
      team: data.team.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    })
  }

  const filledCount = data.team.filter((m) => m.name.trim() || m.email.trim()).length

  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Add your team</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Add the CSMs and AMs who will use Relay. They&apos;ll receive an invite once your account is active.
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-1">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Name</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Email</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide w-[112px]">Role</span>
          <span className="w-8" />
        </div>

        {data.team.map((member) => (
          <TeamRow
            key={member.id}
            member={member}
            onChange={updateRow}
            onRemove={removeRow}
            canRemove={data.team.length > 1}
          />
        ))}

        {data.team.length < 10 && (
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={onNext}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {filledCount > 0 ? `Add ${filledCount} teammate${filledCount === 1 ? '' : 's'}` : 'Continue'}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Map Your Fields (expanded)
// ---------------------------------------------------------------------------

function StepMapFields({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const updateMapping = (index: number, value: string) => {
    const updated = data.fieldMappings.map((m, i) =>
      i === index ? { ...m, customerName: value } : m
    )
    onChange({ fieldMappings: updated })
  }

  const addCustomField = () => {
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      crmName: '',
      type: 'text',
    }
    onChange({ customFields: [...data.customFields, newField] })
  }

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    onChange({
      customFields: data.customFields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })
  }

  const removeCustomField = (id: string) => {
    onChange({ customFields: data.customFields.filter((f) => f.id !== id) })
  }

  return (
    <div className="space-y-7 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Map your fields</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Tell us what your CRM calls these key fields. We&apos;ve pre-filled smart defaults — adjust anything that differs.
        </p>
      </div>

      {/* Section A: Core fields */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 px-1">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Relay calls it</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Your CRM calls it</span>
        </div>

        {CORE_FIELDS.map((field, i) => (
          <div key={field.relayName} className="grid grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-stone-50 border border-stone-200 min-w-0">
              <span className="text-sm text-stone-600 font-medium truncate flex-1 min-w-0">
                {field.relayName}
              </span>
              <FieldTypeBadge type={field.type} />
            </div>
            <Input
              value={data.fieldMappings[i]?.customerName ?? field.defaultCrmName}
              onChange={(e) => updateMapping(i, e.target.value)}
              className="h-10 text-sm"
              placeholder={field.defaultCrmName}
            />
          </div>
        ))}
      </div>

      {/* Section B: Custom fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-700">Custom fields from your CRM</span>
          <button
            onClick={addCustomField}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add field
          </button>
        </div>

        {data.customFields.length === 0 ? (
          <p className="text-xs text-stone-400 py-1">
            No custom fields yet. Add any fields from your CRM that aren&apos;t covered above.
          </p>
        ) : (
          <div className="space-y-2">
            {data.customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2 group">
                <Input
                  value={field.crmName}
                  onChange={(e) => updateCustomField(field.id, { crmName: e.target.value })}
                  placeholder="e.g. Territory, Product Line, Churn Probability"
                  className="flex-1 h-9 text-sm"
                />
                <Select
                  value={field.type}
                  onValueChange={(v) => updateCustomField(field.id, { type: v as CustomFieldType })}
                >
                  <SelectTrigger className="h-9 w-[110px] text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Yes / No</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeCustomField(field.id)}
                  className="w-8 h-8 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  aria-label="Remove field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {data.customFields.length > 0 && (
          <p className="text-xs text-stone-400">
            Custom fields will be available as routing conditions on the next step.
          </p>
        )}
      </div>

      <p className="text-xs text-stone-400">
        You can update these anytime in Settings → Integrations.
      </p>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={onNext}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Save & Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6 — Configure Rules (new)
// ---------------------------------------------------------------------------

const RULE_META: Record<string, { name: string; badge: 'recommended' | 'popular' | 'optional' }> = {
  arr_cap: { name: 'Book of Business Cap', badge: 'recommended' },
  health_dist: { name: 'Health Score Distribution', badge: 'recommended' },
  renewal_urgency: { name: 'Renewal Urgency Routing', badge: 'recommended' },
  segment_match: { name: 'Segment Matching', badge: 'popular' },
  geo_proximity: { name: 'Geographic Proximity', badge: 'optional' },
}

function RuleDescription({
  rule,
  enabled,
  onUpdate,
}: {
  rule: RuleConfig
  enabled: boolean
  onUpdate: (key: string, value: number | string) => void
}) {
  const inputCls =
    'h-8 w-[4.5rem] text-sm text-center rounded-md border border-stone-300 px-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white'

  if (rule.id === 'arr_cap') {
    if (!enabled) {
      return (
        <p className="text-sm text-stone-500">
          Cap each rep&apos;s total book of business at{' '}
          <span className="font-medium">${rule.params.cap}M</span> ARR.
        </p>
      )
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-sm text-stone-600">
        <span>Cap each rep&apos;s total book of business at</span>
        <span className="inline-flex items-center gap-0.5">
          <span className="text-stone-500 font-medium">$</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={rule.params.cap as number}
            onChange={(e) => onUpdate('cap', parseFloat(e.target.value) || 0.5)}
            className={inputCls}
          />
          <span className="text-stone-500 font-medium">M</span>
        </span>
        <span>ARR.</span>
      </div>
    )
  }

  if (rule.id === 'health_dist') {
    if (!enabled) {
      return (
        <p className="text-sm text-stone-500">
          No rep carries more than{' '}
          <span className="font-medium">{rule.params.pct}%</span> of accounts with Health Score
          below <span className="font-medium">{rule.params.threshold}</span>.
        </p>
      )
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-sm text-stone-600">
        <span>Spread high-risk accounts evenly — no rep carries more than</span>
        <span className="inline-flex items-center gap-0.5">
          <input
            type="number"
            min={1}
            max={100}
            value={rule.params.pct as number}
            onChange={(e) => onUpdate('pct', parseInt(e.target.value) || 1)}
            className={inputCls}
          />
          <span className="text-stone-500 font-medium">%</span>
        </span>
        <span>of accounts with Health Score below</span>
        <input
          type="number"
          min={0}
          max={100}
          value={rule.params.threshold as number}
          onChange={(e) => onUpdate('threshold', parseInt(e.target.value) || 0)}
          className={inputCls}
        />
        <span>.</span>
      </div>
    )
  }

  if (rule.id === 'renewal_urgency') {
    if (!enabled) {
      return (
        <p className="text-sm text-stone-500">
          Accounts renewing within{' '}
          <span className="font-medium">{rule.params.days} days</span> are assigned to the rep with
          the most available capacity.
        </p>
      )
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap text-sm text-stone-600">
        <span>Accounts renewing within</span>
        <input
          type="number"
          min={1}
          value={rule.params.days as number}
          onChange={(e) => onUpdate('days', parseInt(e.target.value) || 1)}
          className={inputCls}
        />
        <span>days are assigned to the rep with the most available capacity.</span>
      </div>
    )
  }

  if (rule.id === 'segment_match') {
    return (
      <p className={cn('text-sm', enabled ? 'text-stone-600' : 'text-stone-500')}>
        Enterprise accounts are routed to reps with Enterprise specialization. Mid-market to
        mid-market reps.
      </p>
    )
  }

  if (rule.id === 'geo_proximity') {
    return (
      <p className={cn('text-sm', enabled ? 'text-stone-600' : 'text-stone-500')}>
        Prefer reps in the same country or region as the account to reduce time-zone friction.
      </p>
    )
  }

  return null
}

function StepConfigureRules({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggleRule = (id: string) => {
    onChange({
      rules: data.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })
  }

  const updateParam = (id: string, key: string, value: number | string) => {
    onChange({
      rules: data.rules.map((r) =>
        r.id === id ? { ...r, params: { ...r.params, [key]: value } } : r
      ),
    })
  }

  const namedCustomFields = data.customFields.filter((f) => f.crmName.trim())

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Configure rules</h2>
        <p className="mt-1.5 text-stone-500 text-sm leading-relaxed">
          Smart routing rules based on your team and data. Toggle off anything you don&apos;t need — you can always add more later.
        </p>
      </div>

      {/* Suggested rule cards */}
      <div className="space-y-3">
        {data.rules.map((rule) => {
          const meta = RULE_META[rule.id]
          if (!meta) return null
          return (
            <div
              key={rule.id}
              className={cn(
                'border-2 rounded-xl p-4 transition-all duration-200',
                rule.enabled ? 'border-emerald-300 bg-emerald-50/60' : 'border-stone-200 bg-white'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Custom checkbox */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    rule.enabled
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-stone-300 bg-white hover:border-stone-400'
                  )}
                  aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  {rule.enabled && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-stone-800">{meta.name}</span>
                    <RuleBadge variant={meta.badge} />
                  </div>
                  <RuleDescription
                    rule={rule}
                    enabled={rule.enabled}
                    onUpdate={(key, val) => updateParam(rule.id, key, val)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom field rules — only shown if user added custom fields in step 5 */}
      {namedCustomFields.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            Rules from your custom fields
          </p>
          {namedCustomFields.map((field) => (
            <div
              key={field.id}
              className="border-2 border-dashed border-stone-200 rounded-xl p-4 opacity-70"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border-2 border-stone-200 bg-stone-50 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-stone-700">
                      Route by {field.crmName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-500">
                      Available in Rules
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">
                    Head to the Rules page after setup to define routing logic for this field.{' '}
                    <a href="/rules" className="text-emerald-600 hover:underline font-medium">
                      Configure after setup →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <Button
          onClick={onNext}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Save & Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 7 — You're in!
// ---------------------------------------------------------------------------

function StepYoureIn({
  data,
  onFinish,
}: {
  data: OnboardingData
  onFinish: () => void
}) {
  const filledTeam = data.team.filter((m) => m.name.trim() || m.email.trim()).length
  const crmLabel =
    data.crm === 'salesforce' ? 'Salesforce' : data.crm === 'hubspot' ? 'HubSpot' : null
  const customFieldCount = data.customFields.filter((f) => f.crmName.trim()).length
  const enabledRuleCount = data.rules.filter((r) => r.enabled).length

  const summaryItems = [
    {
      label: crmLabel
        ? `${crmLabel} connection queued`
        : data.csvFileName
        ? 'Accounts CSV uploaded'
        : 'Data connection pending',
      show: true,
    },
    {
      label:
        filledTeam > 0
          ? `${filledTeam} teammate${filledTeam === 1 ? '' : 's'} added`
          : 'Team invites skipped',
      show: true,
    },
    {
      label:
        customFieldCount > 0
          ? `${CORE_FIELDS.length} core fields mapped + ${customFieldCount} custom`
          : `${CORE_FIELDS.length} core fields mapped`,
      show: true,
    },
    {
      label:
        enabledRuleCount > 0
          ? `${enabledRuleCount} routing rule${enabledRuleCount === 1 ? '' : 's'} configured`
          : 'Routing rules skipped',
      show: true,
    },
  ]

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 fade-in-up">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
        <PartyPopper className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
          {data.companyName ? `You're all set, ${data.companyName}!` : "You're all set!"}
        </h2>
        <p className="mt-2 text-stone-500 text-base max-w-sm mx-auto leading-relaxed">
          Your workspace is configured. Head to your dashboard — we&apos;ll show you what Relay looks like with your data as it syncs.
        </p>
      </div>

      <div className="flex flex-col gap-2 items-start w-full max-w-xs">
        {summaryItems.filter((i) => i.show).map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm text-stone-600">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            {item.label}
          </div>
        ))}
      </div>

      <Button
        onClick={onFinish}
        size="lg"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 shadow-sm shadow-emerald-200"
      >
        Go to Dashboard
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>

      <p className="text-xs text-stone-400">No credit card required. Cancel anytime.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const ONBOARDING_STEP_KEY = 'relay-onboarding-step'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const hydrated = useRef(false)

  // Restore step from localStorage on mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const saved = localStorage.getItem(ONBOARDING_STEP_KEY)
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS) {
          setStep(parsed)
        }
      }
    } catch {
      // localStorage unavailable — continue with default
    }
  }, [])

  // Persist step to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, String(step))
    } catch {
      // ignore
    }
  }, [step])

  const update = (updates: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...updates }))

  const goNext = () => {
    const nextStep = Math.min(step + 1, TOTAL_STEPS)
    // Lazy-init rules with team-size-aware defaults when first arriving at step 6
    if (nextStep === 6 && data.rules.length === 0) {
      setData((prev) => ({
        ...prev,
        rules: getDefaultRules(prev.team),
      }))
    }
    setStep(nextStep)
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  // Escape hatch: skip to demo dashboard
  const handleSkipToDemo = () => {
    localStorage.setItem('relay-demo-mode', 'true')
    if (!localStorage.getItem('relay-demo-role')) {
      localStorage.setItem('relay-demo-role', 'revops_admin')
    }
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    router.push('/dashboard')
  }

  // Full onboarding complete
  const handleFinish = () => {
    localStorage.setItem('relay-trial-data', JSON.stringify(data))
    localStorage.removeItem('relay-demo-mode')
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    if (!localStorage.getItem('relay-demo-role')) {
      localStorage.setItem('relay-demo-role', 'revops_admin')
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors duration-150 group"
              aria-label="Back to Relay home"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Back to Relay
            </Link>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <Image src="/relay-icon.png" alt="Relay" width={28} height={28} />
              <span className="font-semibold text-stone-900 text-sm tracking-tight">Relay</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step dots — desktop */}
            <div className="hidden sm:flex items-center gap-1">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i + 1 < step
                        ? 'w-4 bg-emerald-400'
                        : i + 1 === step
                        ? 'w-6 bg-emerald-600'
                        : 'w-1.5 bg-stone-300'
                    )}
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-stone-400 font-medium tabular-nums">
              {step}/{TOTAL_STEPS}
            </span>
          </div>
        </div>
        <ProgressBar step={step} />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Step label */}
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5 text-center">
            {STEP_LABELS[step - 1]}
          </p>

          {/* Content card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-8">
            {step === 1 && <StepAboutYou data={data} onChange={update} onNext={goNext} />}
            {step === 2 && (
              <StepYourCRM data={data} onChange={update} onNext={goNext} onBack={goBack} />
            )}
            {step === 3 && (
              <StepConnectData
                data={data}
                onChange={update}
                onNext={goNext}
                onBack={goBack}
                onSkipToDemo={handleSkipToDemo}
              />
            )}
            {step === 4 && (
              <StepYourTeam data={data} onChange={update} onNext={goNext} onBack={goBack} />
            )}
            {step === 5 && (
              <StepMapFields data={data} onChange={update} onNext={goNext} onBack={goBack} />
            )}
            {step === 6 && (
              <StepConfigureRules data={data} onChange={update} onNext={goNext} onBack={goBack} />
            )}
            {step === 7 && <StepYoureIn data={data} onFinish={handleFinish} />}
          </div>
        </div>
      </main>
    </div>
  )
}

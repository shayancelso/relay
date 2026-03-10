'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock, CheckCircle2, Mail, FileText, Calendar, Users,
  ChevronRight, Zap, Shield, Globe, Building2,
  Target, Plus, Sparkles, Copy, Pencil, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaybookStep {
  id: string
  title: string
  description: string
  owner: 'outgoing_am' | 'incoming_am' | 'manager' | 'system'
  duration: string
  type: 'manual' | 'automated' | 'ai_generated'
  icon: typeof Mail
  script?: string
  talkingPoints?: string[]
  questionsToAsk?: string[]
  infoToCapture?: string[]
}

interface Playbook {
  id: string
  name: string
  segment: string
  description: string
  totalDays: number
  steps: PlaybookStep[]
  sla: string
  automations: number
  icon: typeof Building2
  color: string
  usageCount: number
  completionRate: number
}

// ─── Dynamic fields registry ──────────────────────────────────────────────────

const DYNAMIC_FIELDS: Record<string, { label: string; example: string }> = {
  account_name:    { label: 'Account Name',      example: 'Wealthsimple' },
  primary_contact: { label: 'Primary Contact',   example: 'John Smith' },
  incoming_rep:    { label: 'Incoming Rep',       example: 'Marcus Webb' },
  outgoing_rep:    { label: 'Outgoing Rep',       example: 'Sarah Chen' },
  arr:             { label: 'ARR',                example: '$125,000' },
  health_score:    { label: 'Health Score',       example: '72' },
  tenure:          { label: 'Customer Tenure',    example: '3 years' },
  num_seats:       { label: 'Active Seats',       example: '450' },
  segment:         { label: 'Segment',            example: 'Enterprise' },
  renewal_date:    { label: 'Renewal Date',       example: 'March 15, 2026' },
  open_tickets:    { label: 'Open Tickets',       example: '2' },
  company_name:    { label: 'Company',            example: 'Wealthsimple' },
  use_case:        { label: 'Primary Use Case',   example: 'Wealth management automation' },
  exec_sponsor:    { label: 'Executive Sponsor',  example: 'Jane Doe' },
  known_risks:     { label: 'Known Risks',        example: 'Low adoption in Q4' },
  customer_since:  { label: 'Customer Since',     example: 'Feb 2021' },
}

// ─── Helper: render text with {{field}} tokens as blue chips ─────────────────

function renderWithFields(text: string, chipSize: 'sm' | 'xs' = 'sm') {
  const parts = text.split(/(\{\{[a-z_]+\}\})/g)
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([a-z_]+)\}\}$/)
    if (match) {
      const field = DYNAMIC_FIELDS[match[1]]
      return (
        <span
          key={i}
          className={cn(
            'inline-flex items-center rounded bg-blue-50 border border-blue-200 text-blue-700 font-medium mx-0.5 whitespace-normal',
            chipSize === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-1 py-0 text-[10px]'
          )}
        >
          {field?.label ?? match[1]}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ─── DynamicScript component ──────────────────────────────────────────────────

function DynamicScript({ text }: { text: string }) {
  return (
    <div className="text-[12px] leading-relaxed text-foreground/90 whitespace-pre-line">
      {renderWithFields(text)}
    </div>
  )
}

// ─── DynamicFieldsLegend ──────────────────────────────────────────────────────

function DynamicFieldsLegend({ script }: { script: string }) {
  const [expanded, setExpanded] = useState(false)
  const tokens = [...new Set([...script.matchAll(/\{\{([a-z_]+)\}\}/g)].map(m => m[1]))]
  if (tokens.length === 0) return null

  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
        {tokens.length} dynamic field{tokens.length !== 1 ? 's' : ''} in this script
      </button>
      {expanded && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tokens.map(token => {
            const field = DYNAMIC_FIELDS[token]
            if (!field) return null
            return (
              <div
                key={token}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5"
              >
                <span className="font-mono text-[9px] text-blue-600">{`{{${token}}}`}</span>
                <span className="text-[9px] text-muted-foreground/50">→</span>
                <span className="text-[10px] font-medium">{field.label}</span>
                <span className="text-[9px] text-muted-foreground/50">e.g. {field.example}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── StepTabs component ───────────────────────────────────────────────────────

interface StepTabsProps {
  step: PlaybookStep
  isEditing: boolean
  onStartEdit: () => void
  onDoneEdit: () => void
  editedScript: string | undefined
  onScriptChange: (value: string) => void
}

function StepTabs({ step, isEditing, onStartEdit, onDoneEdit, editedScript, onScriptChange }: StepTabsProps) {
  const tabs: { id: string; label: string }[] = []
  if (step.script) tabs.push({ id: 'script', label: 'Script' })
  if (step.talkingPoints?.length) tabs.push({ id: 'talking', label: 'Talking Points' })
  if (step.questionsToAsk?.length) tabs.push({ id: 'questions', label: 'Questions to Ask' })
  if (step.infoToCapture?.length) tabs.push({ id: 'info', label: 'Info to Capture' })

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'script')
  const currentScript = editedScript ?? step.script ?? ''

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 overflow-hidden mt-2 mb-3">
      {/* Tab nav */}
      <div className="flex border-b border-border/60 bg-card">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id) }}
            className={cn(
              'px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 max-w-3xl" onClick={e => e.stopPropagation()}>

        {/* Script tab */}
        {activeTab === 'script' && step.script && (
          isEditing ? (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground/60">
                Use {`{{field_name}}`} to insert account data automatically. e.g. {`{{account_name}}`}, {`{{incoming_rep}}`}, {`{{health_score}}`}
              </p>
              <textarea
                value={currentScript}
                onChange={e => onScriptChange(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[12px] font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <button
                onClick={onDoneEdit}
                className="rounded-lg bg-foreground text-background px-3 py-1.5 text-[11px] font-medium hover:opacity-80 transition-opacity"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div>
              <DynamicScript text={currentScript} />
              <DynamicFieldsLegend script={currentScript} />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onStartEdit}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit script
                </button>
              </div>
            </div>
          )
        )}

        {/* Talking points tab */}
        {activeTab === 'talking' && step.talkingPoints && (
          <ul className="space-y-2.5">
            {step.talkingPoints.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">•</span>
                <span>{renderWithFields(point, 'xs')}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Questions tab */}
        {activeTab === 'questions' && step.questionsToAsk && (
          <ul className="space-y-3">
            {step.questionsToAsk.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[10px] font-semibold text-primary/50 mt-0.5 shrink-0 tabular-nums">Q{i + 1}</span>
                <span className="text-[12px] leading-relaxed text-foreground/90">{q}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Info to capture tab */}
        {activeTab === 'info' && step.infoToCapture && (
          <ul className="space-y-2.5">
            {step.infoToCapture.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
                <div className="h-4 w-4 rounded border-2 border-border/60 shrink-0 mt-0.5" />
                <span>{renderWithFields(item, 'xs')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Playbook data ────────────────────────────────────────────────────────────

const playbooks: Playbook[] = [
  // ── 1. Enterprise Handoff ────────────────────────────────────────────────
  {
    id: 'pb-1',
    name: 'Enterprise Handoff',
    segment: 'Enterprise',
    description: 'Comprehensive 30-day playbook for high-touch enterprise accounts with multiple stakeholders and complex requirements.',
    totalDays: 30,
    sla: '30 days',
    automations: 4,
    icon: Building2,
    color: 'amber',
    usageCount: 47,
    completionRate: 82,
    steps: [
      {
        id: 's1', title: 'Internal Briefing', owner: 'outgoing_am', duration: 'Day 1', type: 'manual', icon: FileText,
        description: 'Outgoing AM creates a detailed handoff document covering account history, key relationships, open items, and landmines.',
        infoToCapture: [
          'Account name, primary contact, and all key stakeholders',
          'Customer tenure: {{tenure}} — started {{customer_since}}',
          'ARR: {{arr}} — renewal date: {{renewal_date}}',
          'Primary use case: {{use_case}}',
          'Active users: {{num_seats}} seats',
          'Current health score: {{health_score}}/100 — and which direction it is trending',
          'Open support tickets: {{open_tickets}} — list each one by name and status',
          'Known risks or red flags: {{known_risks}}',
          'Recent escalations or near-churn moments in the last 12 months',
          'Any promises or commitments made to the customer that have not yet been delivered',
          'What the customer values most about the relationship',
          'Who the internal champions are — and who the potential detractors are',
        ],
      },
      {
        id: 's2', title: 'AI Brief Generation', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles,
        description: 'System auto-generates a structured handoff brief from CRM data, support history, and account notes.',
      },
      {
        id: 's3', title: 'Manager Review & Approval', owner: 'manager', duration: 'Day 1–2', type: 'manual', icon: Shield,
        description: 'AM Leadership reviews the brief and assignment, approves or suggests changes.',
      },
      {
        id: 's4', title: 'Internal Handoff Meeting', owner: 'incoming_am', duration: 'Day 2–3', type: 'manual', icon: Users,
        description: 'Outgoing and incoming AM meet for a live walkthrough of the account, relationships, and strategy.',
        script: `INTERNAL HANDOFF WALKTHROUGH
Incoming rep: {{incoming_rep}} taking over {{account_name}}

ACCOUNT SNAPSHOT
• Customer since: {{tenure}} | ARR: {{arr}} | Segment: {{segment}}
• Health: {{health_score}}/100 | Seats: {{num_seats}} active
• Renewal: {{renewal_date}} | Open tickets: {{open_tickets}}

PRIMARY USE CASE
{{use_case}}

KEY CONTACTS
• Primary champion: {{primary_contact}}
• Executive sponsor: {{exec_sponsor}}

KNOWN RISKS
{{known_risks}}`,
        talkingPoints: [
          'Walk through the complete account history — wins, escalations, near-churn moments',
          'Explain {{primary_contact}}\'s communication style and what they value most about the relationship',
          'Cover every open ticket by name and its current status',
          'Share any promises or commitments made that have not shipped yet',
          'Discuss the renewal strategy and any pricing sensitivity',
          'Share your personal relationship notes — the things that are not in the CRM',
          'Flag any political dynamics or stakeholder sensitivities to be aware of',
        ],
        questionsToAsk: [
          'What\'s the #1 thing I need to know about this account that isn\'t written anywhere?',
          'What would make this customer feel the transition went badly?',
          'Are there any promises in flight I need to be aware of?',
          'Who is the most important person to get on-side first?',
          'What\'s the honest renewal risk level right now?',
        ],
      },
      {
        id: 's5', title: 'Warm Intro Email', owner: 'system', duration: 'Day 3', type: 'ai_generated', icon: Mail,
        description: 'AI-generated personalized email from outgoing AM introducing the new AM to all key stakeholders.',
      },
      {
        id: 's6', title: 'Introduction Call', owner: 'incoming_am', duration: 'Day 3–7', type: 'manual', icon: Calendar,
        description: 'New AM schedules and conducts intro call with primary champion. Focus on continuity and listening.',
        script: `Hi {{primary_contact}}, this is {{incoming_rep}} from {{company_name}}.

As you may have heard, {{outgoing_rep}} has moved into a new role on our team, and I'll be your new Account Manager going forward. I've already spent dedicated time with {{outgoing_rep}} doing a full handover — {{account_name}} has been with us for {{tenure}} and I want to make sure this transition is completely seamless for you.

I've reviewed your account in detail: your health score, open support items, use case, and upcoming renewal. I'm fully up to speed.

I'd love to use today's call to introduce myself properly, answer any questions you have about the change, and most importantly — hear from you what's most important right now.

[Best practice: listen more than you talk on this first call. Your goal is trust, not information delivery.]`,
        talkingPoints: [
          'Introduce yourself warmly — be a human first, not a business contact',
          'Address the transition proactively and confidently — don\'t be apologetic about it',
          'Reference their tenure: "I know you\'ve been with us for {{tenure}}..."',
          'Mention you\'ve reviewed the account: open tickets, use case, renewal date',
          'Ask about their primary goal for the next quarter — don\'t assume you know',
          'Ask: "Is there anything {{outgoing_rep}} was working on that I should pick up immediately?"',
          'Confirm your availability and preferred communication style',
          'End with specific next steps — a date and agenda for your follow-up',
          'Do NOT try to upsell, change anything, or introduce new ideas on this first call',
        ],
        questionsToAsk: [
          'What\'s most important to your team right now?',
          'How has the relationship with us been going from your perspective?',
          'Are there any open items I should know about right away?',
          'What would make this transition feel completely seamless for you?',
          'What does a great Account Manager relationship look like for your team?',
          'Is there anything you wish we did differently?',
        ],
      },
      {
        id: 's7', title: 'Stakeholder Mapping', owner: 'incoming_am', duration: 'Day 7–14', type: 'manual', icon: Users,
        description: 'New AM meets all key stakeholders individually. Update org chart and relationship notes.',
        infoToCapture: [
          'Primary champion: name, title, communication style, what they value most',
          'Executive sponsor: name, level of engagement, strategic priorities',
          'Day-to-day users — who actually uses the product and how actively',
          'Finance or procurement contact for renewals and contracts',
          'Internal detractors — who might push back at renewal or escalate',
          'Org chart — who reports to whom, any recent changes',
          'Each stakeholder\'s current sentiment about the transition',
        ],
        questionsToAsk: [
          'What does your team use our product for day-to-day?',
          'Who else on your team should I build a relationship with?',
          'Is there anyone I should prioritize meeting in the first 30 days?',
          'Has anything changed internally since you first signed with us?',
        ],
      },
      {
        id: 's8', title: 'Follow-up Check-in', owner: 'system', duration: 'Day 14', type: 'automated', icon: Mail,
        description: 'Automated follow-up email to customer checking on the transition experience.',
      },
      {
        id: 's9', title: 'First QBR', owner: 'incoming_am', duration: 'Day 21–28', type: 'manual', icon: Target,
        description: 'Conduct first quarterly business review under new ownership. Establish forward-looking goals.',
        talkingPoints: [
          'Open by acknowledging this is your first QBR together — set a collaborative tone',
          'Review the account\'s performance since the transition: health score {{health_score}}/100, usage, key outcomes',
          'Align on the customer\'s strategic priorities for the next quarter',
          'Address any outstanding items from the transition period',
          'Present your forward-looking plan for the account',
          'Discuss the upcoming renewal and confirm mutual expectations',
          'Ask: "What would make the next 12 months feel like a huge success for your team?"',
        ],
      },
      {
        id: 's10', title: 'Transition Complete', owner: 'system', duration: 'Day 30', type: 'automated', icon: CheckCircle2,
        description: 'Mark transition as complete. System sends CSAT survey and logs final activity.',
      },
    ],
  },

  // ── 2. Corporate Standard ────────────────────────────────────────────────
  {
    id: 'pb-2',
    name: 'Corporate Standard',
    segment: 'Corporate',
    description: 'Efficient 14-day playbook for mid-market accounts. Balanced between thoroughness and speed.',
    totalDays: 14,
    sla: '14 days',
    automations: 3,
    icon: Target,
    color: 'violet',
    usageCount: 89,
    completionRate: 91,
    steps: [
      {
        id: 's1', title: 'AI Brief Generation', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles,
        description: 'Auto-generate handoff brief from account data.',
      },
      {
        id: 's2', title: 'Brief Review', owner: 'incoming_am', duration: 'Day 1', type: 'manual', icon: FileText,
        description: 'New AM reviews and edits the generated brief before any customer contact.',
        infoToCapture: [
          'Verify health score is accurate: {{health_score}}/100',
          'Confirm primary contact details: {{primary_contact}}',
          'Check all open tickets are correctly listed: {{open_tickets}}',
          'Confirm renewal date: {{renewal_date}}',
          'Review ARR and ensure it matches the current contract: {{arr}}',
          'Confirm active seat count: {{num_seats}} seats',
          'Note the primary use case for reference in the intro call: {{use_case}}',
          'Flag any gaps in the brief that need clarification from the outgoing AM',
        ],
      },
      {
        id: 's3', title: 'Warm Intro Email', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Mail,
        description: 'Send personalized introduction email to primary contact.',
      },
      {
        id: 's4', title: 'Introduction Call', owner: 'incoming_am', duration: 'Day 2–5', type: 'manual', icon: Calendar,
        description: 'Schedule and conduct intro call within first week.',
        script: `Hi {{primary_contact}}, this is {{incoming_rep}} from {{company_name}}.

I'm your new Account Manager — {{outgoing_rep}} has moved to a new role on our team, and I'm picking up your account. I've done a full handover and reviewed {{account_name}}'s setup in detail, so I'm already up to speed.

Your renewal is coming up on {{renewal_date}} and I want to make sure we're in a great place heading into that conversation. Can we take a few minutes to get acquainted and confirm there's nothing immediate I should be prioritising for you?`,
        talkingPoints: [
          'Keep it efficient — Corporate accounts value their time',
          'Lead with preparation: "I\'ve reviewed your account and spoken with {{outgoing_rep}}"',
          'Reference their segment — position yourself as an expert for {{segment}} companies',
          'Ask about any immediate priorities or concerns before introducing yourself fully',
          'Reference the renewal timeline: {{renewal_date}} is coming up',
          'Set a clear follow-up cadence that matches their preference',
        ],
        questionsToAsk: [
          'Any immediate issues or concerns I should prioritise?',
          'How often do you like to connect with your Account Manager?',
          'What\'s your top priority for the next quarter?',
          'Is the renewal tracking on track from your perspective?',
        ],
      },
      {
        id: 's5', title: 'Open Items Review', owner: 'incoming_am', duration: 'Day 5–10', type: 'manual', icon: CheckCircle2,
        description: 'Review and address all open items from previous AM.',
        infoToCapture: [
          'List every open support ticket and its current status',
          'Any feature requests or product feedback submitted',
          'Pending contract or commercial discussions',
          'Outstanding action items promised by the outgoing AM',
          'Any escalations that were in progress',
        ],
      },
      {
        id: 's6', title: 'Satisfaction Check', owner: 'system', duration: 'Day 14', type: 'automated', icon: Mail,
        description: 'Automated email to verify smooth transition.',
      },
    ],
  },

  // ── 3. Commercial Quick ──────────────────────────────────────────────────
  {
    id: 'pb-3',
    name: 'Commercial Quick',
    segment: 'Commercial',
    description: 'Streamlined 7-day playbook for SMB accounts. Maximize automation, minimize manual touchpoints.',
    totalDays: 7,
    sla: '7 days',
    automations: 4,
    icon: Zap,
    color: 'sky',
    usageCount: 156,
    completionRate: 95,
    steps: [
      {
        id: 's1', title: 'Auto Brief + Email', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles,
        description: 'System generates brief and sends intro email simultaneously.',
      },
      {
        id: 's2', title: 'Quick Intro Call', owner: 'incoming_am', duration: 'Day 1–3', type: 'manual', icon: Calendar,
        description: '15-minute introduction call with primary contact.',
        script: `Hi {{primary_contact}}, this is {{incoming_rep}} — your new Account Manager at {{company_name}}.

Quick introduction: {{outgoing_rep}} has moved to a new role and I'm picking up your account. I've reviewed your setup — {{num_seats}} active seats, health score {{health_score}}/100, and renewal coming up {{renewal_date}}.

Just wanted to make a quick connection, confirm everything is running smoothly, and make sure you have my contact details if anything comes up.

Is there anything I should know about right now?`,
        talkingPoints: [
          'Keep it to 15 minutes — Commercial accounts value efficiency above all',
          'Lead with the facts you know: seats, health score, renewal date — show you\'re prepared',
          'Ask the one key question: "Is there anything I should know about right now?"',
          'Confirm their preferred communication channel (email vs phone)',
          'Send a follow-up email immediately after with your contact info',
        ],
        questionsToAsk: [
          'Is there anything I should know about right now?',
          'What\'s the best way to reach you going forward?',
          'Is the account running smoothly day-to-day?',
        ],
      },
      {
        id: 's3', title: 'Open Items Handoff', owner: 'incoming_am', duration: 'Day 3–5', type: 'manual', icon: FileText,
        description: 'Review any open tickets or pending items.',
        infoToCapture: [
          'All open support tickets: {{open_tickets}} currently open',
          'Any pending product feature requests',
          'Upcoming renewal: {{renewal_date}} — any pricing discussions in progress?',
          'Outstanding action items from {{outgoing_rep}}',
        ],
      },
      {
        id: 's4', title: 'Auto-Complete', owner: 'system', duration: 'Day 7', type: 'automated', icon: CheckCircle2,
        description: 'System marks complete after meeting confirmation.',
      },
    ],
  },

  // ── 4. FINS Compliance ───────────────────────────────────────────────────
  {
    id: 'pb-4',
    name: 'FINS Compliance',
    segment: 'FINS',
    description: 'Regulated-industry playbook with compliance checkpoints for finance and real estate accounts.',
    totalDays: 21,
    sla: '21 days',
    automations: 2,
    icon: Shield,
    color: 'emerald',
    usageCount: 34,
    completionRate: 88,
    steps: [
      {
        id: 's1', title: 'Compliance Review', owner: 'manager', duration: 'Day 1', type: 'manual', icon: Shield,
        description: 'Review account for regulatory requirements and data handling obligations.',
        infoToCapture: [
          'Regulatory framework applicable to {{account_name}} (e.g. SEC, FINRA, FCA)',
          'Data residency and sovereignty requirements',
          'Approved communication channels and documented customer consent',
          'Any audit log requirements in the contract',
          'Outstanding compliance reviews or certifications',
          'Upcoming regulatory deadlines that overlap with the transition window',
        ],
      },
      {
        id: 's2', title: 'AI Brief + Compliance Addendum', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles,
        description: 'Generate brief with compliance-specific sections on data handling and regulatory requirements.',
      },
      {
        id: 's3', title: 'Internal Handoff', owner: 'outgoing_am', duration: 'Day 2–3', type: 'manual', icon: Users,
        description: 'Outgoing and incoming AM conduct detailed walkthrough with compliance officer present.',
        talkingPoints: [
          'Confirm all data handling obligations for {{account_name}}',
          'Review all regulatory commitments documented in the contract',
          'Walk through the account\'s full compliance profile: industry, data types, jurisdictions',
          'Confirm the incoming AM has completed the required compliance training',
          'Document the handoff formally — compliance officer must sign off',
          'Identify any upcoming regulatory deadlines that require immediate attention',
          'Review the approved communication channels — not all channels may be permitted',
        ],
        infoToCapture: [
          'Regulatory framework applicable to {{account_name}}',
          'Data residency requirements and where data must be stored',
          'Approved communication channels with this customer',
          'Any pending compliance reviews or third-party audits',
          'Full list of stakeholders with compliance responsibilities',
        ],
      },
      {
        id: 's4', title: 'Regulated Intro Email', owner: 'system', duration: 'Day 3', type: 'ai_generated', icon: Mail,
        description: 'Compliance-reviewed introduction email with required disclosures.',
      },
      {
        id: 's5', title: 'Stakeholder Meetings', owner: 'incoming_am', duration: 'Day 3–14', type: 'manual', icon: Calendar,
        description: 'Meet all stakeholders including compliance and legal contacts.',
        questionsToAsk: [
          'Are there any regulatory changes on your side that affect how we work together?',
          'Who are your compliance and legal contacts I should have a relationship with?',
          'Are there any reporting requirements or audit requests coming up?',
          'Do you have any concerns about the data handling during this transition?',
          'Is there anything in our current contract you\'d like to revisit at renewal?',
        ],
      },
      {
        id: 's6', title: 'Compliance Sign-off', owner: 'manager', duration: 'Day 14–18', type: 'manual', icon: CheckCircle2,
        description: 'Internal compliance team confirms handoff meets regulatory requirements.',
        infoToCapture: [
          'All compliance checkpoints have been completed and documented',
          'Incoming AM has been formally approved by compliance team',
          'Customer has acknowledged the rep change in writing (if required)',
          'Transition documentation has been archived per retention policy',
          'Sign-off date and name of compliance officer recorded',
        ],
      },
      {
        id: 's7', title: 'Transition Complete', owner: 'system', duration: 'Day 21', type: 'automated', icon: CheckCircle2,
        description: 'Mark complete with compliance attestation.',
      },
    ],
  },

  // ── 5. International Transfer ────────────────────────────────────────────
  {
    id: 'pb-5',
    name: 'International Transfer',
    segment: 'International',
    description: 'Cross-border playbook accounting for timezone differences and regional business practices.',
    totalDays: 21,
    sla: '21 days',
    automations: 3,
    icon: Globe,
    color: 'rose',
    usageCount: 23,
    completionRate: 85,
    steps: [
      {
        id: 's1', title: 'Regional Brief', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles,
        description: 'Generate brief with regional context, timezone notes, and cultural considerations.',
      },
      {
        id: 's2', title: 'Timezone-Aware Scheduling', owner: 'system', duration: 'Day 1', type: 'automated', icon: Clock,
        description: 'System proposes meeting times accounting for both AM and customer timezones.',
      },
      {
        id: 's3', title: 'Localised Intro Email', owner: 'system', duration: 'Day 2', type: 'ai_generated', icon: Mail,
        description: 'AI-generated intro in appropriate language and tone for the region.',
      },
      {
        id: 's4', title: 'Video Introduction', owner: 'incoming_am', duration: 'Day 2–5', type: 'manual', icon: Calendar,
        description: 'Async video intro for timezone-challenged accounts. Record and send before attempting a live call.',
        script: `Hello {{primary_contact}}, this is {{incoming_rep}} from {{company_name}}.

I'm recording this short introduction because I know our timezones make it difficult to connect live right away — but I wanted to introduce myself properly rather than just sending an email.

I'm your new Account Manager. {{outgoing_rep}} has moved to a new role, and I've done a thorough handover to make sure nothing falls through the cracks for {{account_name}}.

I've reviewed your full account history and I'm completely up to speed on your setup, priorities, and upcoming renewal on {{renewal_date}}.

I'd love to find a time to connect live when it's convenient for you. I'll include a scheduling link in my follow-up email so you can pick a time that works in your timezone.

Looking forward to working with you.`,
        talkingPoints: [
          'Record in a quiet, well-lit space — this video represents the company',
          'Keep it under 2 minutes — international contacts appreciate brevity',
          'Use their name in the opening line',
          'Reference {{outgoing_rep}} by name so there\'s no confusion about the change',
          'Be warm but professional — research cultural norms for the customer\'s region',
          'End with a clear call to action: scheduling link or email reply',
          'Send the video via email with a brief written summary — not everyone will watch',
          'Follow up if you haven\'t heard back within 3 business days (accounting for timezone)',
        ],
      },
      {
        id: 's5', title: 'Regional Compliance Check', owner: 'manager', duration: 'Day 5–10', type: 'manual', icon: Shield,
        description: 'Verify data residency and regional compliance requirements.',
        infoToCapture: [
          'Data residency requirements — which country or region must data be stored in?',
          'GDPR or local data protection requirements applicable to {{account_name}}',
          'Any local language requirements for communications',
          'Regional business norms for account management cadence',
          'Public holidays and blackout periods to respect in the customer\'s region',
          'Currency and billing requirements for the region',
        ],
      },
      {
        id: 's6', title: 'Transition Complete', owner: 'system', duration: 'Day 21', type: 'automated', icon: CheckCircle2,
        description: 'Mark complete after customer confirmation.',
      },
    ],
  },
]

// ─── Label maps ───────────────────────────────────────────────────────────────

const ownerLabels: Record<string, { label: string; color: string }> = {
  outgoing_am: { label: 'Outgoing AM', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  incoming_am: { label: 'Incoming AM', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  manager:     { label: 'Manager',     color: 'text-violet-600 bg-violet-50 border-violet-200' },
  system:      { label: 'Automated',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
}

const typeLabels: Record<string, { label: string; color: string }> = {
  manual:       { label: 'Manual', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  automated:    { label: 'Auto',   color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ai_generated: { label: 'AI',     color: 'bg-violet-50 text-violet-600 border-violet-200' },
}

const colorMap: Record<string, string> = {
  amber:   'bg-amber-50 text-amber-600 border-amber-200',
  violet:  'bg-violet-50 text-violet-600 border-violet-200',
  sky:     'bg-sky-50 text-sky-600 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rose:    'bg-rose-50 text-rose-600 border-rose-200',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaybooksPage() {
  const [expandedId, setExpandedId] = useState<string | null>('pb-1')
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editedScripts, setEditedScripts] = useState<Record<string, string>>({})
  const { isTrialMode, enterDemoMode } = useTrialMode()

  const selectPlaybook = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setExpandedStep(null)
    setEditingStep(null)
  }

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId)
    setEditingStep(null)
  }

  if (isTrialMode) {
    return <TrialPageEmpty icon={BookOpen} title="Playbooks" description="Build handoff guides and playbooks for your team." ctaLabel="Create Playbook" ctaHref="/playbooks" onExploreDemo={enterDemoMode} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Playbooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Standardized transition workflows by segment</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Create Playbook
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 md:grid-cols-5">
        {playbooks.map(pb => (
          <Card
            key={pb.id}
            className={cn('card-hover cursor-pointer transition-all', expandedId === pb.id && 'ring-2 ring-primary/20')}
            onClick={() => selectPlaybook(pb.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', colorMap[pb.color])}>
                  <pb.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-tight">{pb.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pb.segment}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{pb.steps.length} steps · {pb.totalDays}d</span>
                <span className="font-medium text-emerald-600">{pb.completionRate}%</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pb.completionRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Used {pb.usageCount} times</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expanded playbook detail */}
      {expandedId && (() => {
        const pb = playbooks.find(p => p.id === expandedId)!
        return (
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', colorMap[pb.color])}>
                    <pb.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{pb.name}</CardTitle>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{pb.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{pb.sla} SLA</Badge>
                  <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 border-violet-200">
                    {pb.automations} automations
                  </Badge>
                  <button className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors">
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div>
                {pb.steps.map((step, i) => {
                  const isExpanded = expandedStep === step.id
                  const owner = ownerLabels[step.owner]
                  const type = typeLabels[step.type]
                  const hasTabs = !!(
                    step.script || step.talkingPoints?.length ||
                    step.questionsToAsk?.length || step.infoToCapture?.length
                  )

                  return (
                    <div key={step.id} className="flex gap-4">
                      {/* Timeline column */}
                      <div className="flex flex-col items-center w-6 shrink-0">
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold border-2 z-10 bg-card shrink-0',
                          i === pb.steps.length - 1 ? 'border-emerald-500 text-emerald-600' : 'border-border text-muted-foreground'
                        )}>
                          {i === pb.steps.length - 1 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : i + 1}
                        </div>
                        {i < pb.steps.length - 1 && (
                          <div className="w-px flex-1 bg-border/60 my-0.5" />
                        )}
                      </div>

                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        {/* Step header row */}
                        <div
                          onClick={() => hasTabs ? toggleStep(step.id) : undefined}
                          className={cn(
                            'rounded-lg px-3 py-2.5 -mt-0.5 transition-colors',
                            hasTabs ? 'cursor-pointer hover:bg-muted/40' : ''
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <step.icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                <span className="text-[13px] font-medium">{step.title}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                                {step.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                              <Badge variant="outline" className={cn('text-[9px]', type.color)}>{type.label}</Badge>
                              <Badge variant="outline" className={cn('text-[9px]', owner.color)}>{owner.label}</Badge>
                              <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" /> {step.duration}
                              </span>
                              {hasTabs && (
                                <ChevronRight className={cn(
                                  'h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200',
                                  isExpanded && 'rotate-90'
                                )} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Step expansion panel */}
                        {isExpanded && hasTabs && (
                          <div className="px-3">
                            <StepTabs
                              step={step}
                              isEditing={editingStep === step.id}
                              onStartEdit={() => setEditingStep(step.id)}
                              onDoneEdit={() => setEditingStep(null)}
                              editedScript={editedScripts[step.id]}
                              onScriptChange={(val) => setEditedScripts(prev => ({ ...prev, [step.id]: val }))}
                            />
                          </div>
                        )}

                        {/* Spacing */}
                        <div className={i < pb.steps.length - 1 ? 'h-1' : ''} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen, Clock, CheckCircle2, Mail, FileText, Calendar, Users,
  ArrowRight, ChevronDown, ChevronRight, Zap, Shield, Globe, Building2,
  Target, Plus, Sparkles, Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaybookStep {
  id: string
  title: string
  description: string
  owner: 'outgoing_am' | 'incoming_am' | 'manager' | 'system'
  duration: string
  type: 'manual' | 'automated' | 'ai_generated'
  icon: typeof Mail
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

const playbooks: Playbook[] = [
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
      { id: 's1', title: 'Internal Briefing', description: 'Outgoing AM creates a detailed handoff document covering account history, key relationships, open items, and landmines.', owner: 'outgoing_am', duration: 'Day 1', type: 'manual', icon: FileText },
      { id: 's2', title: 'AI Brief Generation', description: 'System auto-generates a structured handoff brief from CRM data, support history, and account notes.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles },
      { id: 's3', title: 'Manager Review & Approval', description: 'AM Leadership reviews the brief and assignment, approves or suggests changes.', owner: 'manager', duration: 'Day 1-2', type: 'manual', icon: Shield },
      { id: 's4', title: 'Internal Handoff Meeting', description: 'Outgoing and incoming AM meet for a live walkthrough of the account, relationships, and strategy.', owner: 'incoming_am', duration: 'Day 2-3', type: 'manual', icon: Users },
      { id: 's5', title: 'Warm Intro Email', description: 'AI-generated personalized email from outgoing AM introducing the new AM to all key stakeholders.', owner: 'system', duration: 'Day 3', type: 'ai_generated', icon: Mail },
      { id: 's6', title: 'Introduction Call', description: 'New AM schedules and conducts intro call with primary champion. Focus on continuity and listening.', owner: 'incoming_am', duration: 'Day 3-7', type: 'manual', icon: Calendar },
      { id: 's7', title: 'Stakeholder Mapping', description: 'New AM meets all key stakeholders individually. Update org chart and relationship notes.', owner: 'incoming_am', duration: 'Day 7-14', type: 'manual', icon: Users },
      { id: 's8', title: 'Follow-up Check-in', description: 'Automated follow-up email to customer checking on the transition experience.', owner: 'system', duration: 'Day 14', type: 'automated', icon: Mail },
      { id: 's9', title: 'First QBR', description: 'Conduct first quarterly business review under new ownership. Establish forward-looking goals.', owner: 'incoming_am', duration: 'Day 21-28', type: 'manual', icon: Target },
      { id: 's10', title: 'Transition Complete', description: 'Mark transition as complete. System sends CSAT survey and logs final activity.', owner: 'system', duration: 'Day 30', type: 'automated', icon: CheckCircle2 },
    ],
  },
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
      { id: 's1', title: 'AI Brief Generation', description: 'Auto-generate handoff brief from account data.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles },
      { id: 's2', title: 'Brief Review', description: 'New AM reviews and edits the generated brief.', owner: 'incoming_am', duration: 'Day 1', type: 'manual', icon: FileText },
      { id: 's3', title: 'Warm Intro Email', description: 'Send personalized introduction email to primary contact.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Mail },
      { id: 's4', title: 'Introduction Call', description: 'Schedule and conduct intro call within first week.', owner: 'incoming_am', duration: 'Day 2-5', type: 'manual', icon: Calendar },
      { id: 's5', title: 'Open Items Review', description: 'Review and address all open items from previous AM.', owner: 'incoming_am', duration: 'Day 5-10', type: 'manual', icon: CheckCircle2 },
      { id: 's6', title: 'Satisfaction Check', description: 'Automated email to verify smooth transition.', owner: 'system', duration: 'Day 14', type: 'automated', icon: Mail },
    ],
  },
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
      { id: 's1', title: 'Auto Brief + Email', description: 'System generates brief and sends intro email simultaneously.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles },
      { id: 's2', title: 'Quick Intro Call', description: '15-minute introduction call with primary contact.', owner: 'incoming_am', duration: 'Day 1-3', type: 'manual', icon: Calendar },
      { id: 's3', title: 'Open Items Handoff', description: 'Review any open tickets or pending items.', owner: 'incoming_am', duration: 'Day 3-5', type: 'manual', icon: FileText },
      { id: 's4', title: 'Auto-Complete', description: 'System marks complete after meeting confirmation.', owner: 'system', duration: 'Day 7', type: 'automated', icon: CheckCircle2 },
    ],
  },
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
      { id: 's1', title: 'Compliance Review', description: 'Review account for regulatory requirements and data handling obligations.', owner: 'manager', duration: 'Day 1', type: 'manual', icon: Shield },
      { id: 's2', title: 'AI Brief + Compliance Addendum', description: 'Generate brief with compliance-specific sections on data handling and regulatory requirements.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles },
      { id: 's3', title: 'Internal Handoff', description: 'Outgoing and incoming AM conduct detailed walkthrough with compliance officer present.', owner: 'outgoing_am', duration: 'Day 2-3', type: 'manual', icon: Users },
      { id: 's4', title: 'Regulated Intro Email', description: 'Compliance-reviewed introduction email with required disclosures.', owner: 'system', duration: 'Day 3', type: 'ai_generated', icon: Mail },
      { id: 's5', title: 'Stakeholder Meetings', description: 'Meet all stakeholders including compliance and legal contacts.', owner: 'incoming_am', duration: 'Day 3-14', type: 'manual', icon: Calendar },
      { id: 's6', title: 'Compliance Sign-off', description: 'Internal compliance team confirms handoff meets regulatory requirements.', owner: 'manager', duration: 'Day 14-18', type: 'manual', icon: CheckCircle2 },
      { id: 's7', title: 'Transition Complete', description: 'Mark complete with compliance attestation.', owner: 'system', duration: 'Day 21', type: 'automated', icon: CheckCircle2 },
    ],
  },
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
      { id: 's1', title: 'Regional Brief', description: 'Generate brief with regional context, timezone notes, and cultural considerations.', owner: 'system', duration: 'Day 1', type: 'ai_generated', icon: Sparkles },
      { id: 's2', title: 'Timezone-Aware Scheduling', description: 'System proposes meeting times accounting for both AM and customer timezones.', owner: 'system', duration: 'Day 1', type: 'automated', icon: Clock },
      { id: 's3', title: 'Localized Intro Email', description: 'AI-generated intro in appropriate language and tone for the region.', owner: 'system', duration: 'Day 2', type: 'ai_generated', icon: Mail },
      { id: 's4', title: 'Video Introduction', description: 'Async video intro for timezone-challenged accounts.', owner: 'incoming_am', duration: 'Day 2-5', type: 'manual', icon: Calendar },
      { id: 's5', title: 'Regional Compliance Check', description: 'Verify data residency and regional compliance requirements.', owner: 'manager', duration: 'Day 5-10', type: 'manual', icon: Shield },
      { id: 's6', title: 'Transition Complete', description: 'Mark complete after customer confirmation.', owner: 'system', duration: 'Day 21', type: 'automated', icon: CheckCircle2 },
    ],
  },
]

const ownerLabels: Record<string, { label: string; color: string }> = {
  outgoing_am: { label: 'Outgoing AM', color: 'text-orange-600 bg-orange-50' },
  incoming_am: { label: 'Incoming AM', color: 'text-blue-600 bg-blue-50' },
  manager: { label: 'Manager', color: 'text-violet-600 bg-violet-50' },
  system: { label: 'Automated', color: 'text-emerald-600 bg-emerald-50' },
}

const typeLabels: Record<string, { label: string; color: string }> = {
  manual: { label: 'Manual', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  automated: { label: 'Auto', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ai_generated: { label: 'AI', color: 'bg-violet-50 text-violet-600 border-violet-200' },
}

const colorMap: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  sky: 'bg-sky-50 text-sky-600 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
}

export default function PlaybooksPage() {
  const [expandedId, setExpandedId] = useState<string | null>('pb-1')

  return (
    <div className="space-y-6">
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

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-5">
        {playbooks.map(pb => (
          <Card
            key={pb.id}
            className={cn('card-hover cursor-pointer transition-all', expandedId === pb.id && 'ring-2 ring-primary/20')}
            onClick={() => setExpandedId(expandedId === pb.id ? null : pb.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colorMap[pb.color])}>
                  <pb.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold">{pb.name}</p>
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

      {/* Expanded Playbook Detail */}
      {expandedId && (() => {
        const pb = playbooks.find(p => p.id === expandedId)!
        return (
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorMap[pb.color])}>
                    <pb.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{pb.name}</CardTitle>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{pb.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{pb.sla} SLA</Badge>
                  <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-600 border-violet-200">{pb.automations} automations</Badge>
                  <button className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors">
                    <Copy className="h-3 w-3" /> Duplicate
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Steps Timeline */}
              <div className="space-y-0">
                {pb.steps.map((step, i) => {
                  const owner = ownerLabels[step.owner]
                  const type = typeLabels[step.type]
                  return (
                    <div key={step.id} className="flex gap-4 group">
                      {/* Timeline */}
                      <div className="flex flex-col items-center w-6 shrink-0">
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold border-2 z-10 bg-card',
                          i === pb.steps.length - 1 ? 'border-emerald-500 text-emerald-600' : 'border-border text-muted-foreground'
                        )}>
                          {i === pb.steps.length - 1 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : i + 1}
                        </div>
                        {i < pb.steps.length - 1 && <div className="w-px flex-1 bg-border/60 my-0.5" />}
                      </div>
                      {/* Content */}
                      <div className={cn('flex-1 pb-5 rounded-lg p-3 -mt-0.5 row-hover', i < pb.steps.length - 1 ? '' : 'pb-1')}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <step.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                              <span className="text-[13px] font-medium">{step.title}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-2xl">{step.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <Badge variant="outline" className={cn('text-[9px]', type.color)}>{type.label}</Badge>
                            <Badge variant="outline" className={cn('text-[9px]', owner.color)}>{owner.label}</Badge>
                            <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {step.duration}
                            </span>
                          </div>
                        </div>
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

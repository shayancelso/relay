'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Mail, Clock, GitBranch, Calendar, ClipboardList,
  Zap, BarChart3, ArrowRight, Users, RefreshCw, Sparkles,
  Play, Pause, FileText, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkflowCategory = 'outreach' | 'onboarding' | 'renewal' | 'reactivation'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: WorkflowCategory
  stepCount: number
  estimatedDays: number
  usageCount: number
  icon: typeof Mail
}

interface CustomWorkflow {
  id: string
  name: string
  status: 'active' | 'draft' | 'paused'
  template: string
  runs: number
  completionRate: number
  lastEdited: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<WorkflowCategory, { bg: string; text: string; dot: string }> = {
  outreach:     { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',    dot: 'bg-blue-500' },
  onboarding:   { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  renewal:      { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700',  dot: 'bg-violet-500' },
  reactivation: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',   dot: 'bg-amber-500' },
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'new-account-outreach',
    name: 'New Account Outreach',
    description: 'Automated intro sequence for newly assigned accounts with smart follow-ups based on engagement signals.',
    category: 'outreach',
    stepCount: 8,
    estimatedDays: 10,
    usageCount: 142,
    icon: Mail,
  },
  {
    id: 'post-handoff-checkin',
    name: 'Post-Handoff Check-in',
    description: 'Timed follow-up sequence after account transition to ensure smooth onboarding and flag issues early.',
    category: 'onboarding',
    stepCount: 6,
    estimatedDays: 14,
    usageCount: 98,
    icon: Users,
  },
  {
    id: 'renewal-prep-sequence',
    name: 'Renewal Prep Sequence',
    description: 'Proactive renewal workflow with QBR scheduling, health checks, and escalation paths for at-risk accounts.',
    category: 'renewal',
    stepCount: 7,
    estimatedDays: 30,
    usageCount: 76,
    icon: RefreshCw,
  },
  {
    id: 'stalled-account-reactivation',
    name: 'Stalled Account Reactivation',
    description: 'Re-engagement sequence for accounts with declining health scores or low activity signals.',
    category: 'reactivation',
    stepCount: 6,
    estimatedDays: 14,
    usageCount: 54,
    icon: Zap,
  },
  {
    id: 'enterprise-high-touch',
    name: 'Enterprise High-Touch',
    description: 'Premium multi-touch sequence with research tasks, AI-personalized outreach, and executive meeting booking.',
    category: 'outreach',
    stepCount: 10,
    estimatedDays: 21,
    usageCount: 38,
    icon: Sparkles,
  },
  {
    id: 'quick-commercial-handoff',
    name: 'Quick Commercial Handoff',
    description: 'Streamlined auto-intro workflow for commercial segment with fast follow-up and conditional branching.',
    category: 'outreach',
    stepCount: 5,
    estimatedDays: 7,
    usageCount: 210,
    icon: ArrowRight,
  },
]

const TEMPLATE_NAMES: Record<string, string> = {
  'new-account-outreach': 'New Account Outreach',
  'post-handoff-checkin': 'Post-Handoff Check-in',
  'renewal-prep-sequence': 'Renewal Prep Sequence',
  'stalled-account-reactivation': 'Stalled Account Reactivation',
  'enterprise-high-touch': 'Enterprise High-Touch',
  'quick-commercial-handoff': 'Quick Commercial Handoff',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const STATS = [
  { label: 'Active Workflows', value: '12', icon: Play, color: 'text-emerald-600' },
  { label: 'Total Runs', value: '1,247', icon: BarChart3, color: 'text-blue-600' },
  { label: 'Avg Completion', value: '73%', icon: ClipboardList, color: 'text-violet-600' },
  { label: 'Emails Sent', value: '3,891', icon: Mail, color: 'text-amber-600' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  draft:  { bg: 'bg-zinc-100 border-zinc-200',      text: 'text-zinc-600' },
  paused: { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [tab, setTab] = useState<'templates' | 'my'>('templates')
  const router = useRouter()
  const [savedWorkflows, setSavedWorkflows] = useState<CustomWorkflow[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const { isTrialMode, enterDemoMode } = useTrialMode()

  useEffect(() => {
    if (tab === 'my') {
      setLoadingWorkflows(true)
      fetch('/api/workflows')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSavedWorkflows(
              data.map((w: Record<string, unknown>) => ({
                id: w.id as string,
                name: w.name as string,
                status: ((w.status as string) || 'draft') as CustomWorkflow['status'],
                template: TEMPLATE_NAMES[(w.template_id as string) || ''] || 'Custom',
                runs: 0,
                completionRate: 0,
                lastEdited: timeAgo(w.updated_at as string),
              }))
            )
          }
        })
        .catch(() => {})
        .finally(() => setLoadingWorkflows(false))
    }
  }, [tab])

  if (isTrialMode) {
    return <TrialPageEmpty icon={GitBranch} title="Workflows" description="Create automated outreach sequences for your accounts." ctaLabel="Create Workflow" ctaHref="/workflows/new" onExploreDemo={enterDemoMode} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design automated outreach sequences with visual drag-and-drop flows.
          </p>
        </div>
        <button
          onClick={() => router.push('/workflows/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg bg-muted/50 p-2', stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {[
          { key: 'templates' as const, label: 'Templates', count: TEMPLATES.length },
          { key: 'my' as const, label: 'My Workflows', count: savedWorkflows.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground/60">{t.count}</span>
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => {
            const cat = CATEGORY_COLORS[template.category]
            return (
              <Card
                key={template.id}
                className="group border hover:border-foreground/20 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/workflows/${template.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <template.icon className="h-5 w-5 text-foreground/70" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-semibold capitalize border', cat.bg, cat.text)}
                    >
                      {template.category}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-foreground transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {template.stepCount} steps
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.estimatedDays}d
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {template.usageCount} uses
                    </span>
                  </div>

                  <button className="w-full rounded-lg border border-foreground/10 bg-muted/30 py-2 text-xs font-medium text-foreground/70 group-hover:bg-foreground group-hover:text-background transition-all">
                    Use Template
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* My Workflows Tab */}
      {tab === 'my' && (
        <div className="space-y-3">
          {loadingWorkflows ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : savedWorkflows.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No workflows yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Create one from a template or start from scratch
              </p>
            </div>
          ) : (
            savedWorkflows.map((wf) => {
              const st = STATUS_STYLES[wf.status] || STATUS_STYLES.draft
              return (
                <Card
                  key={wf.id}
                  className="group border hover:border-foreground/20 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/workflows/${wf.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      {wf.status === 'active' ? (
                        <Play className="h-4 w-4 text-emerald-600" />
                      ) : wf.status === 'paused' ? (
                        <Pause className="h-4 w-4 text-amber-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{wf.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold capitalize border shrink-0', st.bg, st.text)}
                        >
                          {wf.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Based on {wf.template} &middot; Edited {wf.lastEdited}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0" />
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

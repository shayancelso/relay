'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  FileText,
  Pencil,
  Save,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Database,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BriefSectionProps {
  transitionId: string
  brief: {
    id: string
    content: string
    status: string
    version: number
    ai_generated: boolean
    generated_at: string | null
  } | null
  account: any
  contacts: any[]
  fromOwner: any
  toOwner: any
  notes: string | null
}

// ---------------------------------------------------------------------------
// Data sources configuration
// ---------------------------------------------------------------------------

interface DataSource {
  id: string
  name: string
  color: string
  bgColor: string
  summary: string
  status: 'synced' | 'syncing'
  syncedAt: string
}

const DATA_SOURCES: DataSource[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    color: 'text-sky-700',
    bgColor: 'bg-sky-100',
    summary: 'Account record, 12 activities, 3 open opportunities ($420K pipeline)',
    status: 'synced',
    syncedAt: '2 min ago',
  },
  {
    id: 'gainsight',
    name: 'Gainsight',
    color: 'text-violet-700',
    bgColor: 'bg-violet-100',
    summary: 'Health score history, 2 risk alerts, last QBR notes',
    status: 'synced',
    syncedAt: '2 min ago',
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    summary: '8 open tickets, 142 historical tickets, avg response time',
    status: 'synced',
    syncedAt: '3 min ago',
  },
  {
    id: 'slack',
    name: 'Slack',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    summary: '47 mentions in #enterprise-accounts, last internal discussion 3 days ago',
    status: 'synced',
    syncedAt: '1 min ago',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    summary: 'Last customer email: 5 days ago, 23 email threads in past 90 days',
    status: 'synced',
    syncedAt: '4 min ago',
  },
]

// ---------------------------------------------------------------------------
// Mock AI brief generator — rich, source-attributed content
// ---------------------------------------------------------------------------

function getMockBrief(account: any, contacts: any[], fromOwner: any, toOwner: any): string {
  const name = account?.name || 'Account'
  const arr = account?.arr ? `$${(account.arr / 1000).toFixed(0)}K` : 'N/A'
  const health = account?.health_score || 82
  const segment = account?.segment || 'enterprise'
  const industry = account?.industry || 'Technology'
  const primaryContact = contacts.find((c: any) => c.is_primary)
  const renewal = account?.renewal_date || 'Q3 2026'
  const employees = account?.employee_count?.toLocaleString() || '2,400'

  return `# Handoff Brief: ${name}

## Executive Summary [via Salesforce · Gainsight · Zendesk]
${name} is a ${segment} account at ${arr} ARR in the ${industry} vertical, currently in the second year of their contract renewing ${renewal}. ${fromOwner?.full_name || 'The outgoing AM'} built a strong champion relationship over 14 months, closing two upsells totaling $140K in expansion revenue. Health score sits at ${health}/100 — broadly positive but with two active risk signals in Gainsight that ${toOwner?.full_name || 'the incoming AM'} must address within the first 30 days.

## Account Intelligence [via Salesforce]
- **ARR:** ${arr}
- **Contract Dates:** Mar 15, 2024 – ${renewal}
- **Segment:** ${segment.charAt(0).toUpperCase() + segment.slice(1)}
- **Industry:** ${industry}
- **Employee Count:** ${employees}
- **Primary Office:** San Francisco, CA (HQ) + Austin, TX (Engineering)
- **Open Pipeline:** $420K across 3 opportunities — seat expansion ($180K), Professional Services ($120K), Enterprise Add-on Package ($120K)
- **Last Activity:** Call on Feb 14, 2026 — ${fromOwner?.full_name || 'AM'} + ${primaryContact?.name || 'Champion'} discussed Q2 roadmap alignment

## Relationship Map [via Gainsight · Salesforce]
${primaryContact ? `- **${primaryContact.name}** (${primaryContact.title || 'Director of Operations'}) — Primary champion. Sentiment: Positive. Highly responsive, advocates internally, technically fluent. Prefers Slack for async; reserves email for formal decisions. Gave the product a 9/10 in last NPS pulse.` : '- Primary contact information pending from Salesforce'}
- **Sarah Chen** (VP of Operations) — Executive sponsor. Sentiment: Neutral-to-Positive. Attends QBRs, approves budget. Had concerns about pricing in Nov 2025 renewal discussion — resolved with multi-year discount. Do not surface price topics without ROI data in hand.
- **Marcus Webb** (IT Director) — Technical gatekeeper. Sentiment: Cautious. Focused on SOC 2 Type II compliance and API rate limits. Has an open support ticket (#4891) that is blocking an internal integration build — resolution is his top priority.
- **Priya Nair** (CFO) — Signs contracts. Sentiment: Unknown. Has not been engaged directly. ${fromOwner?.full_name || 'Previous AM'} recommends not involving her before Sarah Chen signals readiness.

## Risk Factors [via Gainsight · Zendesk]
⚠️ **Health Score Declining** — Dropped from 87 → ${health} over 60 days. Gainsight flagged two contributing signals: decreased weekly active users (down 18% MoM) and a spike in support volume in January.

⚠️ **Open Support Escalation** — Ticket #4891 (Marcus Webb, IT Director) has been open 22 days. Bulk export API returning timeout errors on datasets > 50K rows. Engineering ETA is next sprint (Mar 7). This is blocking their internal BI pipeline — Marcus is frustrated. Acknowledge this on your intro call.

⚠️ **Competitor Touchpoint** — Gainsight activity log shows ${name} attended a Gainsight Pulse competitor's webinar on Jan 29. ${primaryContact?.name || 'The champion'} proactively told ${fromOwner?.full_name || 'the previous AM'} they were "just curious" — but monitor closely. Their contract allows 90-day out clause after Year 2.

⚠️ **Single-Threaded Risk** — ${primaryContact?.name || 'Primary contact'} is effectively the sole internal champion. IT Director and VP-level contacts exist but are not product-fluent. If ${primaryContact?.name || 'champion'} churns, so might the account. Multi-threading is a first-30-days priority.

## Open Commitments [via Salesforce · Slack]
1. **Seat Expansion Proposal** — Sent Feb 1, 2026. $180K proposal for 25 additional seats for the Analytics team. Awaiting budget committee approval (next meeting Mar 5). ${primaryContact?.name || 'Champion'} is internal sponsor.
2. **Salesforce Integration Timeline** — Promised by ${fromOwner?.full_name || 'previous AM'} in the Jan QBR that engineering would deliver a native Salesforce connector by Q2 2026. Product confirmed Jun 30 delivery. Do not walk this back.
3. **Dedicated CSM Ask** — ${name} requested a dedicated CSM (currently pooled). ${fromOwner?.full_name || 'Previous AM'} said they would "escalate internally." No commitment made — but they expect an answer. Align with CS leadership before your intro call.
4. **Security Review Documentation** — Marcus Webb requested updated SOC 2 Type II report + penetration test summary. Compliance team has the docs — request and send within first week.

## Recommended First 30 Days
1. **Days 1–3 · Intro Call** — Schedule with ${primaryContact?.name || 'primary contact'} within 48 hours. Preferred slots: Tuesday or Thursday, 10–11am PT. Open with continuity ("I've reviewed the full account history"), acknowledge the open support ticket proactively, and confirm the seat expansion timeline. Do not pitch anything new.
2. **Days 1–5 · Resolve Blockers** — Get status from Engineering on ticket #4891, send SOC 2 docs to Marcus Webb, and confirm the Q2 Salesforce integration milestone internally.
3. **Days 7–14 · Stakeholder Tour** — Request 20-min intros with Sarah Chen (VP Ops) and Marcus Webb (IT) separately. Bring QBR summary and Q2 roadmap one-pager.
4. **Days 14–21 · Seat Expansion Follow-Up** — ${name}'s budget committee meets Mar 5. Follow up with ${primaryContact?.name || 'champion'} on Mar 6 with a "how did it go?" message. Have the MSA amendment ready.
5. **Days 21–30 · QBR Planning** — Propose Q1 2026 QBR for late March. Use it to reset the relationship, share health score recovery progress, and surface the Enterprise Add-on Package as a forward agenda item.

## Talking Points for First Call
- "I've spent time going through your account history, open tickets, and the work ${fromOwner?.full_name || 'your previous AM'} did — I want to make sure there's zero gap in momentum."
- "I know ticket #4891 with Marcus has been open longer than it should be — I've already flagged it internally and I'll have a status update for you by end of week."
- "The seat expansion proposal is on my radar — I'll make sure we're ready to move quickly once your budget committee meets."
- "I'd love to set up brief intros with Sarah and Marcus so they have a face to the name — happy to keep it to 20 minutes."
- Avoid: mentioning competitors, pricing, or the dedicated CSM ask until you have an internal answer ready.`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SourceIcon({ source }: { source: DataSource }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold select-none',
        source.bgColor,
        source.color,
      )}
    >
      {source.name[0]}
    </span>
  )
}

function SyncIndicator({ status }: { status: 'synced' | 'syncing' }) {
  if (status === 'syncing') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-500">
        <span className="h-2.5 w-2.5 rounded-full border border-amber-400 border-t-transparent animate-spin inline-block" />
        Syncing
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
      <Check className="h-2.5 w-2.5" />
      Synced
    </span>
  )
}

function DataSourcesPanel({ visible, sources, generating }: {
  visible: boolean
  sources: DataSource[]
  generating: boolean
}) {
  const [open, setOpen] = useState(true)

  if (!visible) return null

  const syncedCount = sources.filter(s => s.status === 'synced').length
  const totalPoints = 234

  return (
    <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-semibold text-foreground/80">Data Sources</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
            {syncedCount}/{sources.length} synced
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!generating && (
            <span className="text-[10px] text-muted-foreground/60">
              Brief generated from {sources.length} sources · {totalPoints} data points analyzed
            </span>
          )}
          {generating && (
            <span className="text-[10px] text-violet-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
              Pulling data...
            </span>
          )}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-border/40 divide-y divide-border/30">
          {sources.map((source, i) => (
            <div
              key={source.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{
                opacity: generating ? Math.max(0, 1 - (sources.length - 1 - i) * 0.18) : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <SourceIcon source={source} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground/80">{source.name}</span>
                  <SyncIndicator status={generating ? 'syncing' : source.status} />
                </div>
                <p className="text-[10px] text-muted-foreground/70 truncate">{source.summary}</p>
              </div>
              {!generating && (
                <span className="shrink-0 text-[9px] text-muted-foreground/40">
                  {source.syncedAt}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QualityScorePanel() {
  const metrics = [
    { label: 'Data Completeness', value: 95, color: 'bg-emerald-500' },
    { label: 'Recency', value: 88, color: 'bg-sky-500' },
    { label: 'Source Diversity', value: 94, color: 'bg-violet-500' },
  ]

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-gradient-to-br from-muted/20 to-muted/40 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-[11px] font-semibold text-foreground/80">Brief Quality Score</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tabular-nums text-foreground">92</span>
          <span className="text-[10px] text-muted-foreground/60 mb-0.5">/100</span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground/70">{m.label}</span>
              <span className="text-[10px] font-medium tabular-nums text-foreground/70">{m.value}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', m.color)}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
        <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
        This brief covers 94% of recommended handoff topics
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer — source badge aware
// ---------------------------------------------------------------------------

function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    // h1
    if (line.startsWith('# ')) {
      return (
        <h1 key={i} className="text-[15px] font-bold mt-4 mb-2 text-foreground">
          {line.slice(2)}
        </h1>
      )
    }

    // h2 — may contain [via ...] attribution
    if (line.startsWith('## ')) {
      const raw = line.slice(3)
      const viaMatch = raw.match(/^(.*?)\s*\[via ([^\]]+)\]$/)
      if (viaMatch) {
        return (
          <div key={i} className="flex items-center gap-2 mt-5 mb-1.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
              {viaMatch[1]}
            </h2>
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
              <Database className="h-2 w-2" />
              {viaMatch[2]}
            </span>
          </div>
        )
      }
      return (
        <h2 key={i} className="text-[11px] font-semibold mt-5 mb-1.5 text-foreground/80 uppercase tracking-wide">
          {raw}
        </h2>
      )
    }

    // Risk / warning lines
    if (line.startsWith('⚠️')) {
      const match = line.match(/⚠️ \*\*(.*?)\*\* — (.*)/)
      if (match) {
        return (
          <div key={i} className="rounded-lg bg-amber-50 border border-amber-200/60 p-3 my-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-amber-800">{match[1]}</span>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{match[2]}</p>
              </div>
            </div>
          </div>
        )
      }
      return (
        <div key={i} className="rounded-lg bg-amber-50 border border-amber-200/60 p-3 my-2 text-[11px] text-amber-800">
          {line}
        </div>
      )
    }

    // Bullet with bold key
    if (line.startsWith('- **')) {
      const match = line.match(/- \*\*(.*?)\*\* — (.*)/)
      if (match) {
        return (
          <div key={i} className="flex gap-2 py-0.5 pl-3 text-[11px]">
            <span className="font-semibold text-foreground/80 shrink-0">{match[1]}</span>
            <span className="text-muted-foreground">— {match[2]}</span>
          </div>
        )
      }
      const match2 = line.match(/- \*\*(.*?)\*\*(.*)/)
      if (match2) {
        return (
          <div key={i} className="flex gap-1 py-0.5 pl-3 text-[11px]">
            <span className="font-semibold text-foreground/80">{match2[1]}</span>
            <span className="text-muted-foreground">{match2[2]}</span>
          </div>
        )
      }
    }

    // Plain bullet
    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 py-0.5 pl-3 text-[11px]">
          <span className="text-muted-foreground/40 shrink-0">•</span>
          <span className="text-muted-foreground leading-relaxed">{line.slice(2)}</span>
        </div>
      )
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const numMatch = line.match(/^(\d+)\. (.*)/)
      if (numMatch) {
        // Day-range items have bold prefix
        const boldMatch = numMatch[2].match(/^\*\*(.*?)\*\* — (.*)/)
        if (boldMatch) {
          return (
            <div key={i} className="flex gap-2 py-0.5 pl-3 text-[11px]">
              <span className="text-muted-foreground/50 tabular-nums w-4 shrink-0">{numMatch[1]}.</span>
              <span className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground/75">{boldMatch[1]}</strong>
                {' — '}
                {boldMatch[2]}
              </span>
            </div>
          )
        }
        return (
          <div key={i} className="flex gap-2 py-0.5 pl-3 text-[11px]">
            <span className="text-muted-foreground/50 tabular-nums w-4 shrink-0">{numMatch[1]}.</span>
            <span className="text-muted-foreground leading-relaxed">{numMatch[2]}</span>
          </div>
        )
      }
    }

    // Empty line
    if (line.trim() === '') return <div key={i} className="h-1.5" />

    // Default paragraph
    return (
      <p key={i} className="text-[11px] text-muted-foreground leading-relaxed py-0.5">
        {line}
      </p>
    )
  })
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  generating: 'bg-violet-50 text-violet-600 border-violet-200',
  draft: 'bg-stone-100 text-stone-600 border-stone-200',
  reviewed: 'bg-blue-50 text-blue-600 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function BriefSection({
  transitionId,
  brief,
  account,
  contacts,
  fromOwner,
  toOwner,
  notes,
}: BriefSectionProps) {
  const [content, setContent] = useState(brief?.content || '')
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<string>(brief?.status || 'draft')
  const [version, setVersion] = useState(brief?.version || 1)
  const [showSources, setShowSources] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const streamRef = useRef<NodeJS.Timeout | null>(null)

  // Streaming generation
  function generateBrief() {
    setGenerating(true)
    setContent('')
    setStatus('generating')
    setShowSources(true)
    setShowQuality(false)

    const fullBrief = getMockBrief(account, contacts, fromOwner, toOwner)
    let idx = 0
    const chunkSize = 4

    streamRef.current = setInterval(() => {
      idx += chunkSize
      if (idx >= fullBrief.length) {
        setContent(fullBrief)
        setGenerating(false)
        setStatus('draft')
        setVersion(v => v + 1)
        setShowQuality(true)
        if (streamRef.current) clearInterval(streamRef.current)
      } else {
        setContent(fullBrief.slice(0, idx))
      }
    }, 10)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [])

  function copyToClipboard() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function approveBrief() {
    setStatus('approved')
  }

  const hasContent = generating || !!content

  return (
    <Card className="card-hover overflow-hidden">
      {/* Generation progress bar */}
      {generating && (
        <div className="h-0.5 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400"
            style={{
              width: content.length > 0 ? `${Math.min((content.length / 2800) * 100, 95)}%` : '5%',
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}

      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <FileText className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Handoff Brief</CardTitle>
              <p className="text-[10px] text-muted-foreground">v{version} · AI-generated</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-[9px] capitalize', STATUS_COLORS[status])}>
              {status}
            </Badge>

            {content && !generating && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setEditing(!editing)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                    editing
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground',
                  )}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {status !== 'approved' && (
                  <button
                    onClick={approveBrief}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Check className="h-3 w-3" /> Approve
                  </button>
                )}
              </>
            )}

            <button
              onClick={generateBrief}
              disabled={generating}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all',
                generating
                  ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {generating ? (
                <>
                  <div className="h-3 w-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  {content ? 'Regenerate' : 'Generate Brief'}
                </>
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent>
        {hasContent ? (
          <>
            {/* Data sources accordion */}
            <DataSourcesPanel
              visible={showSources}
              sources={DATA_SOURCES}
              generating={generating}
            />

            {/* Brief content */}
            {editing ? (
              <div className="space-y-3">
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={24}
                  className="font-mono text-[11px] leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-md border px-3 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setEditing(false); setStatus('reviewed') }}
                    className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                  >
                    <Save className="h-3 w-3" /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-5 max-h-[600px] overflow-y-auto">
                {renderMarkdown(content)}
                {generating && (
                  <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
                )}
              </div>
            )}

            {/* Quality score — only after generation is done */}
            {showQuality && !editing && <QualityScorePanel />}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
              <Sparkles className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No brief generated yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[300px]">
              Click &quot;Generate Brief&quot; to synthesize data from Salesforce, Gainsight, Zendesk, Slack, and Gmail into a comprehensive handoff document.
            </p>
            {/* Source pills preview */}
            <div className="flex items-center gap-1.5 mt-4 flex-wrap justify-center">
              {DATA_SOURCES.map(source => (
                <span
                  key={source.id}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium',
                    source.bgColor,
                    source.color,
                  )}
                >
                  <span className="font-bold">{source.name[0]}</span>
                  {source.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

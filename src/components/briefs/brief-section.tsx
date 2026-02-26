'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, FileText, Pencil, Save, Check, Copy, RotateCcw, Eye } from 'lucide-react'
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

// Mock AI-generated brief content
function getMockBrief(account: any, contacts: any[], fromOwner: any, toOwner: any): string {
  const name = account?.name || 'Account'
  const arr = account?.arr ? `$${(account.arr / 1000).toFixed(0)}K` : 'N/A'
  const health = account?.health_score || 'N/A'
  const segment = account?.segment || 'N/A'
  const industry = account?.industry || 'Technology'
  const primaryContact = contacts.find((c: any) => c.is_primary)

  return `# Handoff Brief: ${name}

## Account Overview
- **Company:** ${name}
- **ARR:** ${arr}
- **Segment:** ${segment.charAt(0).toUpperCase() + segment.slice(1)}
- **Industry:** ${industry}
- **Health Score:** ${health}/100
- **Renewal Date:** ${account?.renewal_date || 'Q3 2026'}
- **Employee Count:** ${account?.employee_count?.toLocaleString() || 'N/A'}

## Relationship Summary
${fromOwner?.full_name || 'Previous AM'} has managed this account for approximately 14 months. The relationship was established during their onboarding phase and has grown through two successful upsells. Communication cadence has been bi-weekly check-ins with quarterly business reviews.

The account was initially brought on through an inbound lead and has shown consistent growth in product adoption. Last QBR was positive with discussions about expanding to additional business units.

## Key Stakeholders
${primaryContact ? `- **${primaryContact.name}** (${primaryContact.title || 'Primary Contact'}) — Primary champion. Responsive, technically savvy, advocates internally for the product. Prefers Slack over email for quick questions.` : '- Primary contact information pending'}
- **VP of Operations** — Executive sponsor. Involved in renewals and strategic discussions. Met quarterly.
- **IT Director** — Technical decision maker. Concerned about security compliance and API integrations.

## Open Items
1. **Expansion Discussion** — ${name} expressed interest in adding 3 additional seats for their analytics team. Proposal was sent 2 weeks ago, awaiting budget approval.
2. **Integration Request** — They've requested a Salesforce integration timeline. Engineering team estimated Q2 delivery.
3. **Support Ticket #4521** — Ongoing issue with bulk export performance. Engineering is investigating, ETA next sprint.

## Risks & Landmines
⚠️ **Renewal Sensitivity** — The CFO has pushed back on pricing in the past. Any price increase should be positioned with clear ROI data.

⚠️ **Competitor Evaluation** — ${name} was approached by a competitor last quarter. ${primaryContact?.name || 'The champion'} shut it down but mentioned they need to see continued innovation.

⚠️ **Key Person Risk** — ${primaryContact?.name || 'Primary contact'} is the sole champion. If they leave, the account could be at risk. Consider multi-threading.

## Recommended First Actions
1. **Schedule intro call** within 48 hours — ${primaryContact?.name || 'Primary contact'} prefers Tuesday/Thursday mornings
2. **Review the pending proposal** for seat expansion and follow up
3. **Acknowledge the open support ticket** to show continuity
4. **Request access to their Slack channel** for real-time communication
5. **Review last 3 QBR decks** for strategic context

## Talking Points for First Meeting
- "I've been thoroughly briefed on your account and I'm excited to continue the momentum ${fromOwner?.full_name || 'your previous AM'} built."
- Reference the expansion discussion to show you're up to speed
- Ask about their Q2 priorities to establish forward-looking relationship
- Mention the integration timeline proactively — they'll appreciate the transparency`
}

export function BriefSection({ transitionId, brief, account, contacts, fromOwner, toOwner, notes }: BriefSectionProps) {
  const [content, setContent] = useState(brief?.content || '')
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<string>(brief?.status || 'draft')
  const [version, setVersion] = useState(brief?.version || 1)
  const streamRef = useRef<NodeJS.Timeout | null>(null)

  // Mock streaming generation
  function generateBrief() {
    setGenerating(true)
    setContent('')
    setStatus('generating')

    const fullBrief = getMockBrief(account, contacts, fromOwner, toOwner)
    let idx = 0
    const chunkSize = 3 // characters per tick

    streamRef.current = setInterval(() => {
      idx += chunkSize
      if (idx >= fullBrief.length) {
        setContent(fullBrief)
        setGenerating(false)
        setStatus('draft')
        setVersion(v => v + 1)
        if (streamRef.current) clearInterval(streamRef.current)
      } else {
        setContent(fullBrief.slice(0, idx))
      }
    }, 12)
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

  // Simple markdown-to-html for display
  function renderMarkdown(md: string) {
    return md.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h1>
      if (line.startsWith('## ')) return <h2 key={i} className="text-[14px] font-semibold mt-5 mb-1.5 text-foreground/90 uppercase tracking-wide">{line.slice(3)}</h2>
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\* — (.*)/)
        if (match) return <div key={i} className="flex gap-2 py-0.5 pl-3 text-[12px]"><span className="font-semibold shrink-0">{match[1]}</span><span className="text-muted-foreground">— {match[2]}</span></div>
        const match2 = line.match(/- \*\*(.*?)\*\*(.*)/)
        if (match2) return <div key={i} className="flex gap-1 py-0.5 pl-3 text-[12px]"><span className="font-semibold">{match2[1]}</span><span className="text-muted-foreground">{match2[2]}</span></div>
      }
      if (line.startsWith('- ')) return <div key={i} className="flex gap-2 py-0.5 pl-3 text-[12px]"><span className="text-muted-foreground/40">•</span><span className="text-muted-foreground">{line.slice(2)}</span></div>
      if (line.match(/^\d+\. /)) return <div key={i} className="flex gap-2 py-0.5 pl-3 text-[12px]"><span className="text-muted-foreground/50 tabular-nums w-4 shrink-0">{line.match(/^\d+/)![0]}.</span><span className="text-muted-foreground">{line.replace(/^\d+\. /, '')}</span></div>
      if (line.startsWith('⚠️')) return <div key={i} className="rounded-lg bg-amber-50 border border-amber-200/60 p-3 my-2 text-[12px] text-amber-800">{line}</div>
      if (line.trim() === '') return <div key={i} className="h-1.5" />
      return <p key={i} className="text-[12px] text-muted-foreground leading-relaxed py-0.5">{line}</p>
    })
  }

  const statusColors: Record<string, string> = {
    generating: 'bg-violet-50 text-violet-600 border-violet-200',
    draft: 'bg-stone-100 text-stone-600 border-stone-200',
    reviewed: 'bg-blue-50 text-blue-600 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  }

  return (
    <Card className="card-hover overflow-hidden">
      {/* Generation progress bar */}
      {generating && (
        <div className="h-0.5 w-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-emerald-500 to-violet-500 animate-pulse"
            style={{
              width: content.length > 0 ? `${Math.min((content.length / 2500) * 100, 95)}%` : '5%',
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}

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
            <Badge variant="outline" className={cn('text-[9px] capitalize', statusColors[status])}>
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
                      : 'text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground'
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
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
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

      <CardContent>
        {generating || content ? (
          editing ? (
            <div className="space-y-3">
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={24}
                className="font-mono text-[12px] leading-relaxed"
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
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
              <Sparkles className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No brief generated yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[280px]">
              Click &quot;Generate Brief&quot; to create an AI-powered handoff document with account context, stakeholders, and recommended actions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

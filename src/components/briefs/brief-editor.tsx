'use client'

// BriefEditor — Split-view AI brief editor
// Usage:
//   <BriefEditor content={brief.content} onSave={(c) => console.log(c)} onClose={() => {}} />

import { useState, useCallback } from 'react'
import {
  Sparkles,
  Check,
  RotateCcw,
  Pencil,
  X,
  Save,
  AlertTriangle,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BriefEditorProps {
  content: string
  onSave: (content: string) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Markdown renderer (same approach as brief-section)
// ---------------------------------------------------------------------------

function renderMarkdown(md: string) {
  return md.split('\n').map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={i} className="text-[15px] font-bold mt-4 mb-2 text-foreground">
          {line.slice(2)}
        </h1>
      )
    }

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

    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2 py-0.5 pl-3 text-[11px]">
          <span className="text-muted-foreground/40 shrink-0">•</span>
          <span className="text-muted-foreground leading-relaxed">{line.slice(2)}</span>
        </div>
      )
    }

    if (line.match(/^\d+\. /)) {
      const numMatch = line.match(/^(\d+)\. (.*)/)
      if (numMatch) {
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

    if (line.trim() === '') return <div key={i} className="h-1.5" />

    return (
      <p key={i} className="text-[11px] text-muted-foreground leading-relaxed py-0.5">
        {line}
      </p>
    )
  })
}

// ---------------------------------------------------------------------------
// Section type
// ---------------------------------------------------------------------------

interface BriefSection {
  heading: string
  body: string
  originalBody: string
  accepted: boolean
  edited: boolean
  regenerating: boolean
}

// ---------------------------------------------------------------------------
// Parse content into sections
// ---------------------------------------------------------------------------

function parseContentIntoSections(content: string): BriefSection[] {
  const lines = content.split('\n')
  const sections: BriefSection[] = []
  let currentHeading = ''
  let currentLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading || currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          body: currentLines.join('\n'),
          originalBody: currentLines.join('\n'),
          accepted: false,
          edited: false,
          regenerating: false,
        })
      }
      currentHeading = line
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  // Push last section
  if (currentHeading || currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      body: currentLines.join('\n'),
      originalBody: currentLines.join('\n'),
      accepted: false,
      edited: false,
      regenerating: false,
    })
  }

  return sections
}

// ---------------------------------------------------------------------------
// Reassemble sections into full content
// ---------------------------------------------------------------------------

function assembleSections(sections: BriefSection[]): string {
  return sections
    .map((s) => (s.heading ? `${s.heading}\n${s.body}` : s.body))
    .join('\n')
}

// ---------------------------------------------------------------------------
// Mock AI regeneration for a section
// ---------------------------------------------------------------------------

const REGEN_VARIANTS: Record<number, string> = {
  0: '(Updated via AI — refreshed with latest Gainsight data and recent activity signals.)',
  1: '(AI Regenerated — expanded relationship context from CRM notes and recent interactions.)',
  2: '(AI Regenerated — updated risk analysis with latest health score trends.)',
  3: '(AI Regenerated — refreshed commitments list based on recent Salesforce activity.)',
  4: '(AI Regenerated — revised 30-day plan with current priorities and blockers.)',
  5: '(AI Regenerated — updated talking points to reflect latest support ticket status.)',
}

function getMockRegenBody(index: number, originalBody: string): string {
  const note = REGEN_VARIANTS[index % Object.keys(REGEN_VARIANTS).length]
  return `${originalBody}\n\n${note}`
}

// ---------------------------------------------------------------------------
// SectionEditor
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  section: BriefSection
  index: number
  onBodyChange: (index: number, body: string) => void
  onRegenerate: (index: number) => void
  onAccept: (index: number) => void
  onRevert: (index: number) => void
}

function SectionEditor({
  section,
  index,
  onBodyChange,
  onRegenerate,
  onAccept,
  onRevert,
}: SectionEditorProps) {
  const headingLabel = section.heading.replace(/^##\s*/, '').replace(/\s*\[via[^\]]*\]/, '')

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        section.accepted
          ? 'border-emerald-200 bg-emerald-50/30'
          : section.edited
          ? 'border-amber-200 bg-amber-50/20'
          : 'border-border bg-card',
      )}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70 truncate">
            {headingLabel || `Section ${index + 1}`}
          </span>
          {section.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 shrink-0">
              <Check className="h-2 w-2" />
              Accepted
            </span>
          )}
          {section.edited && !section.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 shrink-0">
              <Pencil className="h-2 w-2" />
              Edited
            </span>
          )}
          {!section.edited && !section.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 shrink-0">
              <Sparkles className="h-2 w-2" />
              AI
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onRevert(index)}
            disabled={section.regenerating || (!section.edited && section.body === section.originalBody)}
            title="Revert to original AI text"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all',
              section.body !== section.originalBody || section.edited
                ? 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                : 'text-muted-foreground/30 cursor-not-allowed',
            )}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Revert
          </button>

          <button
            onClick={() => onAccept(index)}
            disabled={section.regenerating || section.accepted}
            title="Accept this section"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all',
              section.accepted
                ? 'bg-emerald-100 text-emerald-500 cursor-not-allowed'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
            )}
          >
            <Check className="h-2.5 w-2.5" />
            Accept
          </button>

          <button
            onClick={() => onRegenerate(index)}
            disabled={section.regenerating}
            title="Regenerate section with AI"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all',
              section.regenerating
                ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100',
            )}
          >
            {section.regenerating ? (
              <>
                <div className="h-2.5 w-2.5 rounded-full border border-violet-400 border-t-transparent animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="h-2.5 w-2.5" />
                Regenerate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="p-3">
        <textarea
          value={section.body}
          onChange={(e) => onBodyChange(index, e.target.value)}
          rows={Math.max(5, section.body.split('\n').length + 2)}
          disabled={section.regenerating}
          className={cn(
            'w-full resize-none rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] font-mono leading-relaxed text-foreground transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40',
            section.regenerating && 'opacity-60 cursor-not-allowed',
          )}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function BriefEditor({ content, onSave, onClose }: BriefEditorProps) {
  const [sections, setSections] = useState<BriefSection[]>(() =>
    parseContentIntoSections(content),
  )

  const acceptedCount = sections.filter((s) => s.accepted).length
  const editedCount = sections.filter((s) => s.edited && !s.accepted).length

  const handleBodyChange = useCallback((index: number, body: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, body, edited: body !== s.originalBody, accepted: false }
          : s,
      ),
    )
  }, [])

  const handleRegenerate = useCallback((index: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, regenerating: true, accepted: false } : s)),
    )

    setTimeout(() => {
      setSections((prev) =>
        prev.map((s, i) => {
          if (i !== index) return s
          const newBody = getMockRegenBody(index, s.originalBody)
          return {
            ...s,
            body: newBody,
            regenerating: false,
            edited: false,
          }
        }),
      )
      toast.success('Section regenerated by AI')
    }, 1500)
  }, [])

  const handleAccept = useCallback((index: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, accepted: true } : s)),
    )
  }, [])

  const handleRevert = useCallback((index: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, body: s.originalBody, edited: false, accepted: false }
          : s,
      ),
    )
    toast.success('Section reverted to AI original')
  }, [])

  function handleSave() {
    const assembled = assembleSections(sections)
    onSave(assembled)
    toast.success('Brief saved')
  }

  // Full document preview (left panel)
  const previewContent = assembleSections(sections)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Brief Editor</p>
            <p className="text-[10px] text-muted-foreground">
              {sections.length} sections
              {acceptedCount > 0 && ` · ${acceptedCount} accepted`}
              {editedCount > 0 && ` · ${editedCount} edited`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-colors"
            aria-label="Close editor"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel — rendered markdown preview */}
        <div className="flex-1 min-w-0 border-r border-border overflow-y-auto">
          <div className="px-1 py-1 border-b border-border/40 bg-muted/20 sticky top-0 z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
              Preview (Read-only)
            </p>
          </div>
          <div className="p-5">
            {renderMarkdown(previewContent)}
          </div>
        </div>

        {/* Right panel — section editors */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-1 py-1 border-b border-border/40 bg-muted/20 sticky top-0 z-10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
              Edit Sections
            </p>
          </div>
          <div className="p-4 space-y-3">
            {sections.map((section, i) => (
              <SectionEditor
                key={i}
                section={section}
                index={i}
                onBodyChange={handleBodyChange}
                onRegenerate={handleRegenerate}
                onAccept={handleAccept}
                onRevert={handleRevert}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          {acceptedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <Check className="h-2.5 w-2.5" />
              {acceptedCount}/{sections.length} sections accepted
            </span>
          )}
          {editedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <Pencil className="h-2.5 w-2.5" />
              {editedCount} manually edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3 w-3" />
            Save Brief
          </button>
        </div>
      </div>
    </div>
  )
}

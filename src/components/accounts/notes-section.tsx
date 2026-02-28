'use client'

// Usage:
//   import { NotesSection } from '@/components/accounts/notes-section'
//   <NotesSection accountId="account-1" accountName="Shopify Plus" />

import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MessageSquare, Send } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface NotesSectionProps {
  accountId: string
  accountName: string
}

interface Note {
  id: string
  authorName: string
  authorColor: string
  timestamp: string
  text: string
}

// ---------------------------------------------------------------------------
// Avatar color palette — cycled by author index
// ---------------------------------------------------------------------------
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ---------------------------------------------------------------------------
// Sample notes
// ---------------------------------------------------------------------------
const SAMPLE_NOTES: Note[] = [
  {
    id: 'note-1',
    authorName: 'Sarah Chen',
    authorColor: AVATAR_COLORS[0],
    timestamp: 'Feb 20, 2026 at 10:14 AM',
    text: 'Spoke with their CTO — they are evaluating expanding into two additional regions by Q3. Will need dedicated onboarding support. Flagging for the new AM to prioritize introductions early.',
  },
  {
    id: 'note-2',
    authorName: 'Marcus Johnson',
    authorColor: AVATAR_COLORS[1],
    timestamp: 'Feb 18, 2026 at 3:02 PM',
    text: 'Renewal is tracking well. Champion is David Lee — very responsive. Make sure to loop in their VP Finance before the QBR. They prefer async updates via Slack.',
  },
  {
    id: 'note-3',
    authorName: 'Elena Rodriguez',
    authorColor: AVATAR_COLORS[2],
    timestamp: 'Feb 14, 2026 at 9:47 AM',
    text: 'Health score dipped after the January outage. They submitted 3 support tickets. Relationship is stable but keep a close eye on NPS this quarter.',
  },
]

let noteCounter = SAMPLE_NOTES.length + 1

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NotesSection({ accountName }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleAddNote() {
    const text = draft.trim()
    if (!text) return

    setSubmitting(true)

    // Simulate a brief async save
    setTimeout(() => {
      const newNote: Note = {
        id: `note-${++noteCounter}`,
        authorName: 'You',
        authorColor: AVATAR_COLORS[(noteCounter - 1) % AVATAR_COLORS.length],
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        text,
      }

      setNotes(prev => [newNote, ...prev])
      setDraft('')
      setSubmitting(false)

      toast.success('Note added', {
        description: `Note saved to ${accountName}.`,
      })
    }, 300)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleAddNote()
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Compose area ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <textarea
          placeholder="Add a note about this account..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full resize-none rounded-t-xl border-0 bg-transparent px-4 pt-3.5 pb-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground/50">
            {draft.length > 0 ? (
              <span className="text-muted-foreground">Cmd+Enter to save</span>
            ) : (
              'Notes are internal only'
            )}
          </span>
          <button
            onClick={handleAddNote}
            disabled={!draft.trim() || submitting}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-all',
              draft.trim() && !submitting
                ? 'bg-foreground text-background hover:opacity-85'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {submitting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Add Note
          </button>
        </div>
      </div>

      {/* ── Notes list ───────────────────────────────────────────────── */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 h-9 w-9 text-muted-foreground/25" />
          <p className="text-[13px] font-medium text-muted-foreground">No notes yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground/60">
            Add a note above to start documenting key context for this account.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Author avatar */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                  note.authorColor,
                )}
              >
                {getInitials(note.authorName)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-foreground">
                    {note.authorName}
                  </span>
                  <span className="text-muted-foreground/30 text-[12px]">·</span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {note.timestamp}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

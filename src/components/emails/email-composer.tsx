'use client'

// EmailComposer — Full email composition interface
// Usage:
//   <EmailComposer contacts={contacts} account={account} fromOwner={from} toOwner={to}
//     onSave={(e) => console.log(e)} onClose={() => {}} />

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  X,
  Send,
  Eye,
  Pencil,
  Search,
  ChevronDown,
  Mail,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Contact {
  id: string
  name: string
  email: string | null
  title: string | null
  role: string
  is_primary: boolean
}

interface EmailComposerProps {
  contacts: Contact[]
  account: any
  fromOwner: any
  toOwner: any
  onSave: (email: { to: string; cc: string[]; subject: string; body: string }) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Template variants
// ---------------------------------------------------------------------------

type TemplateVariant = 'warm' | 'professional' | 'brief'

const TEMPLATE_LABELS: Record<TemplateVariant, string> = {
  warm: 'Warm & Personal',
  professional: 'Professional',
  brief: 'Brief & Direct',
}

function getMockSubject(toOwner: any, variant: TemplateVariant): string {
  const name = toOwner?.full_name ?? 'your new Account Manager'
  if (variant === 'warm') return `Say hello to ${name} — your new account manager`
  if (variant === 'professional') return `Introducing ${name} as your new Account Manager`
  return `Account manager change: Meet ${name}`
}

function getMockBody(
  account: any,
  contact: Contact | undefined,
  fromOwner: any,
  toOwner: any,
  variant: TemplateVariant,
): string {
  const contactFirst = contact?.name?.split(' ')[0] ?? 'there'
  const toFirst = toOwner?.full_name?.split(' ')[0] ?? 'they'
  const fromName = fromOwner?.full_name ?? 'Your Account Manager'
  const toName = toOwner?.full_name ?? 'your new Account Manager'
  const accountName = account?.name ?? 'your company'
  const toEmail = toOwner?.email ?? ''
  const calLink = toOwner?.calendar_link ? `\n\nBook time with ${toFirst}: ${toOwner.calendar_link}` : ''

  if (variant === 'warm') {
    return `Hi ${contactFirst},

I hope you're doing well! I'm reaching out with some exciting news — I'm transitioning to a new role, and I wanted to personally introduce you to ${toName}, who'll be taking over as your dedicated account manager.

${toFirst} is genuinely one of the best I've worked with. They have deep experience in ${account?.industry ?? 'your industry'} and have spent time getting fully up to speed on everything we've been working on together — the open tickets, the expansion conversations, your upcoming renewal. You'll be in great hands.

${toFirst} will be in touch this week to schedule an intro call. In the meantime, feel free to reach out directly at ${toEmail}.

It's been such a pleasure working with you and the ${accountName} team. Wishing you all the best going forward!${calLink}

Warmly,
${fromName}`
  }

  if (variant === 'professional') {
    return `Dear ${contactFirst},

I am writing to inform you of a change to your account management team at our organization. Effective immediately, ${toName} will serve as your primary Account Manager for ${accountName}.

I have provided ${toFirst} with a comprehensive briefing on your account, including current initiatives, open support items, and your renewal timeline. This transition has been carefully managed to ensure continuity of service.

${toFirst} will reach out shortly to schedule an introductory meeting. You may also contact them directly at ${toEmail}.

Thank you for your continued partnership. Please do not hesitate to reach out if you have any questions.${calLink}

Regards,
${fromName}`
  }

  // brief & direct
  return `Hi ${contactFirst},

Quick note — I'm moving to a new role. ${toName} is taking over your account.

${toFirst} is fully briefed on everything. No gaps, no disruption.

They'll reach out this week. You can also contact them directly at ${toEmail}.${calLink}

Thanks for a great partnership.
${fromName}`
}

// ---------------------------------------------------------------------------
// Contact picker dropdown
// ---------------------------------------------------------------------------

interface ContactPickerProps {
  contacts: Contact[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder: string
  label: string
}

function ContactPicker({ contacts, selectedIds, onToggle, placeholder, label }: ContactPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (c.title ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id))

  return (
    <div className="space-y-1.5" ref={ref}>
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-[12px] transition-colors',
            'hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20',
            open && 'border-primary/40 ring-2 ring-primary/20',
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1 min-w-0">
            {selectedContacts.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedContacts.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {c.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(c.id)
                    }}
                    className="hover:text-primary/70 ml-0.5"
                    aria-label={`Remove ${c.name}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts..."
                className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {/* List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-border/50">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-[11px] text-muted-foreground text-center">
                  No contacts found
                </p>
              ) : (
                filtered.map((c) => {
                  const selected = selectedIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onToggle(c.id)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60',
                        selected && 'bg-primary/5',
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-foreground truncate">
                            {c.name}
                          </span>
                          {c.is_primary && (
                            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>
                        {c.title && (
                          <p className="text-[10px] text-muted-foreground truncate">{c.title}</p>
                        )}
                        {c.email && (
                          <p className="text-[10px] text-muted-foreground/70 truncate">{c.email}</p>
                        )}
                      </div>
                      {/* Role badge */}
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground capitalize">
                        {c.role}
                      </span>
                      {/* Check */}
                      {selected && (
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                          <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 10">
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI field button
// ---------------------------------------------------------------------------

interface AIFieldButtonProps {
  onClick: () => void
  loading: boolean
  label?: string
}

function AIFieldButton({ onClick, loading, label = 'Generate' }: AIFieldButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all shrink-0',
        loading
          ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
          : 'bg-violet-50 text-violet-600 hover:bg-violet-100',
      )}
    >
      {loading ? (
        <div className="h-2.5 w-2.5 rounded-full border border-violet-400 border-t-transparent animate-spin" />
      ) : (
        <Sparkles className="h-2.5 w-2.5" />
      )}
      {loading ? 'Writing...' : label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function EmailComposer({
  contacts,
  account,
  fromOwner,
  toOwner,
  onSave,
  onClose,
}: EmailComposerProps) {
  const [toIds, setToIds] = useState<string[]>(() => {
    const primary = contacts.find((c) => c.is_primary && c.email)
    return primary ? [primary.id] : []
  })
  const [ccIds, setCcIds] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [variant, setVariant] = useState<TemplateVariant>('warm')
  const [preview, setPreview] = useState(false)
  const [generatingSubject, setGeneratingSubject] = useState(false)
  const [generatingBody, setGeneratingBody] = useState(false)
  const streamRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [])

  const toggleTo = useCallback((id: string) => {
    setToIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleCc = useCallback((id: string) => {
    setCcIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  function generateSubject() {
    setGeneratingSubject(true)
    setTimeout(() => {
      setSubject(getMockSubject(toOwner, variant))
      setGeneratingSubject(false)
    }, 800)
  }

  function generateBody() {
    if (streamRef.current) clearInterval(streamRef.current)
    setGeneratingBody(true)
    setBody('')

    const firstToContact = contacts.find((c) => toIds.includes(c.id))
    const fullBody = getMockBody(account, firstToContact, fromOwner, toOwner, variant)
    let idx = 0

    streamRef.current = setInterval(() => {
      idx += 5
      if (idx >= fullBody.length) {
        setBody(fullBody)
        setGeneratingBody(false)
        if (streamRef.current) clearInterval(streamRef.current)
      } else {
        setBody(fullBody.slice(0, idx))
      }
    }, 10)
  }

  function generateAll() {
    generateSubject()
    setTimeout(generateBody, 200)
  }

  function handleSave() {
    const toContacts = contacts.filter((c) => toIds.includes(c.id) && c.email)
    if (toContacts.length === 0) {
      toast.error('Please select at least one recipient with an email address')
      return
    }
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    if (!body.trim()) {
      toast.error('Body is required')
      return
    }

    const ccContacts = contacts.filter((c) => ccIds.includes(c.id) && c.email)
    onSave({
      to: toContacts[0].email!,
      cc: ccContacts.map((c) => c.email!),
      subject,
      body,
    })
    toast.success('Email saved as draft')
  }

  const toEmailStr = contacts
    .filter((c) => toIds.includes(c.id) && c.email)
    .map((c) => `${c.name} <${c.email}>`)
    .join(', ')

  const ccEmailStr = contacts
    .filter((c) => ccIds.includes(c.id) && c.email)
    .map((c) => `${c.name} <${c.email}>`)
    .join(', ')

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Compose Email</p>
            <p className="text-[10px] text-muted-foreground">
              AI-powered · {Object.keys(TEMPLATE_LABELS).length} template variants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
              preview
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/60',
            )}
          >
            {preview ? (
              <>
                <Pencil className="h-3 w-3" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> Preview
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground transition-colors"
            aria-label="Close composer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {preview ? (
        /* ----- Preview mode ----- */
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-2xl mx-auto rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Email header */}
            <div className="bg-muted/30 px-5 py-4 border-b border-border space-y-2">
              {toEmailStr && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-semibold text-muted-foreground w-8 shrink-0">To</span>
                  <span className="text-foreground">{toEmailStr}</span>
                </div>
              )}
              {ccEmailStr && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-semibold text-muted-foreground w-8 shrink-0">CC</span>
                  <span className="text-foreground">{ccEmailStr}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-semibold text-muted-foreground w-8 shrink-0">Re</span>
                <span className="text-foreground font-medium">{subject || '(no subject)'}</span>
              </div>
            </div>
            {/* Email body */}
            <div className="p-5">
              {body ? (
                <pre className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {body}
                </pre>
              ) : (
                <p className="text-[12px] text-muted-foreground italic">(no body)</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ----- Compose mode ----- */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template variant selector */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Template Style</Label>
            <div className="flex rounded-lg border border-border overflow-hidden divide-x divide-border">
              {(Object.keys(TEMPLATE_LABELS) as TemplateVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={cn(
                    'flex-1 py-1.5 text-[11px] font-medium transition-colors',
                    variant === v
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {TEMPLATE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* AI generate all button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={generateAll}
              disabled={generatingSubject || generatingBody}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all',
                generatingSubject || generatingBody
                  ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                  : 'bg-violet-600 text-white hover:bg-violet-700',
              )}
            >
              <Sparkles className="h-3 w-3" />
              Generate All with AI
            </button>
          </div>

          {/* To */}
          <ContactPicker
            contacts={contacts.filter((c) => !ccIds.includes(c.id))}
            selectedIds={toIds}
            onToggle={toggleTo}
            placeholder="Select recipients..."
            label="To"
          />

          {/* CC */}
          <ContactPicker
            contacts={contacts.filter((c) => !toIds.includes(c.id))}
            selectedIds={ccIds}
            onToggle={toggleCc}
            placeholder="Add CC recipients..."
            label="CC (optional)"
          />

          {/* Subject */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground">Subject</Label>
              <AIFieldButton
                onClick={generateSubject}
                loading={generatingSubject}
                label="Generate subject"
              />
            </div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-[12px]"
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground">Body</Label>
              <AIFieldButton
                onClick={generateBody}
                loading={generatingBody}
                label="Generate body"
              />
            </div>
            <div className="relative">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="text-[12px] leading-relaxed font-mono"
                placeholder="Write your email body..."
              />
              {generatingBody && (
                <span className="absolute bottom-3 right-3 inline-block w-1.5 h-4 bg-violet-500 animate-pulse rounded-sm" />
              )}
            </div>
          </div>

          {/* Generation progress bar */}
          {generatingBody && (
            <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500 animate-pulse transition-all duration-300"
                style={{
                  width: body.length > 0 ? `${Math.min((body.length / 800) * 100, 95)}%` : '5%',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {toIds.length > 0
            ? `Sending to ${toIds.length} recipient${toIds.length !== 1 ? 's' : ''}${ccIds.length > 0 ? ` + ${ccIds.length} CC` : ''}`
            : 'No recipients selected'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={generatingBody || generatingSubject}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            Save Draft
          </button>
        </div>
      </div>
    </div>
  )
}

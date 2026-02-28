'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Mail,
  Sparkles,
  Send,
  Save,
  Plus,
  Check,
  Eye,
  Pencil,
  X,
  CheckCircle2,
  LayoutTemplate,
  AlignLeft,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Contact {
  id: string
  name: string
  email: string | null
  title: string | null
  role: string
  is_primary: boolean
}

interface Email {
  id: string
  subject: string
  body: string
  status: string
  type: string
  sent_at: string | null
  ai_generated: boolean
  created_at: string
  contact?: { name: string; email: string } | null
}

interface EmailSectionProps {
  transitionId: string
  emails: Email[]
  contacts: Contact[]
  account: any
  fromOwner: any
  toOwner: any
  briefContent?: string | null
}

// ---------------------------------------------------------------------------
// Template variants
// ---------------------------------------------------------------------------

type EmailVariant = 'warm' | 'professional' | 'brief'

const VARIANT_OPTIONS: { value: EmailVariant; label: string; description: string }[] = [
  { value: 'warm', label: 'Warm & Personal', description: 'Friendly, relationship-focused tone' },
  { value: 'professional', label: 'Professional', description: 'Formal business language' },
  { value: 'brief', label: 'Brief & Direct', description: 'Short and to the point' },
]

function getMockEmail(
  account: any,
  contact: any,
  fromOwner: any,
  toOwner: any,
  variant: EmailVariant = 'warm'
): { subject: string; body: string } {
  const contactName = contact?.name?.split(' ')[0] || 'there'
  const newAMFirst = toOwner?.full_name?.split(' ')[0] || 'your new Account Manager'

  if (variant === 'professional') {
    return {
      subject: `Account Transition Notification — ${toOwner?.full_name || 'New Account Manager'}`,
      body: `Dear ${contactName},

I am writing to inform you of a change in account management for ${account?.name || 'your organization'}, effective immediately.

${toOwner?.full_name || 'Your new Account Manager'} will assume responsibility for your account and serve as your primary point of contact going forward. ${newAMFirst} brings extensive experience in ${account?.industry || 'your industry'} and has been fully briefed on your account history, open commitments, and strategic objectives.

Please note the following pending items that will be managed through this transition:
• Seat expansion proposal (submitted February 1, 2026)
• Renewal timeline and upcoming contract review
• Salesforce integration delivery milestone (Q2 2026)
• Outstanding support ticket #4891

${toOwner?.full_name || 'Your new Account Manager'} will contact you within 48 business hours to schedule an introductory meeting. In the interim, correspondence may be directed to ${toOwner?.email || 'their email address'}.

Thank you for your continued partnership.

Regards,
${fromOwner?.full_name || 'Account Management Team'}`,
    }
  }

  if (variant === 'brief') {
    return {
      subject: `Quick intro: ${toOwner?.full_name || 'your new AM'}`,
      body: `Hi ${contactName},

Quick note — I'm transitioning my accounts and wanted to introduce you to ${toOwner?.full_name || 'your new Account Manager'}, who'll be taking over from me.

${newAMFirst} is great and has been fully briefed on everything — your expansion discussion, open ticket #4891, and the renewal timeline.

Expect a note from ${newAMFirst} this week to set up a call.

Thanks for a great run — you're in good hands.

${fromOwner?.full_name || 'Your Account Manager'}`,
    }
  }

  // warm (default)
  return {
    subject: `A warm introduction to ${toOwner?.full_name || 'your new Account Manager'}`,
    body: `Hi ${contactName},

I hope this message finds you well! I wanted to reach out personally to let you know about a change on our team and introduce you to someone great.

As I transition to a new role, I want to make sure ${account?.name || 'your account'} continues to receive the outstanding support you deserve. I'm thrilled to introduce you to ${toOwner?.full_name || 'your new Account Manager'}, who will be your primary point of contact going forward.

${newAMFirst} is one of our strongest account managers — with deep expertise in ${account?.industry || 'your industry'} and a track record of helping clients like you maximize value from our platform. I've personally briefed ${newAMFirst} on everything we've been working on together, including:

• The expansion discussion for your analytics team
• The upcoming renewal timeline
• Your Salesforce integration request
• The open items from our last QBR

${newAMFirst} will be reaching out to schedule an introductory call this week. In the meantime, you can reach ${newAMFirst} directly at ${toOwner?.email || 'their email'}.

It has been a genuine pleasure working with you and the team at ${account?.name || 'your company'}. I'm confident you're in excellent hands.

${toOwner?.calendar_link ? `Book a time with ${newAMFirst}: ${toOwner.calendar_link}` : ''}

Warmly,
${fromOwner?.full_name || 'Your Account Manager'}`,
  }
}

const statusConfig: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  draft: { icon: Pencil, color: 'bg-stone-100 text-stone-600 border-stone-200', label: 'Draft' },
  approved: { icon: Check, color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Approved' },
  sent: { icon: Send, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Sent' },
  opened: { icon: Eye, color: 'bg-violet-50 text-violet-600 border-violet-200', label: 'Opened' },
  replied: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Replied' },
}

// ---------------------------------------------------------------------------
// Styled email preview (mock Gmail-like)
// ---------------------------------------------------------------------------

function StyledEmailPreview({ email, fromOwner }: { email: Email; fromOwner: any }) {
  const senderName = fromOwner?.full_name || 'Account Manager'
  const senderEmail = fromOwner?.email || 'am@company.com'
  const senderInitials = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="rounded-xl border overflow-hidden bg-white">
      {/* Gmail-like gradient header bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400" />

      {/* Email meta */}
      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <h3 className="text-[14px] font-semibold text-foreground mb-3">{email.subject}</h3>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-[11px] font-bold text-white">
            {senderInitials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-foreground">{senderName}</span>
              <span className="text-[11px] text-muted-foreground">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground">to</span>
              <span className="text-[11px] font-medium text-foreground">
                {email.contact?.name || 'Contact'} &lt;{email.contact?.email || ''}&gt;
              </span>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground/60 shrink-0">
            {formatDate(email.created_at)}
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="px-5 py-4">
        <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/80">
          {email.body}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center gap-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
          <Mail className="h-2.5 w-2.5" />
          <span>Sent via Relay · AI-assisted drafting</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EmailSection({
  transitionId,
  emails,
  contacts,
  account,
  fromOwner,
  toOwner,
  briefContent,
}: EmailSectionProps) {
  const [composing, setComposing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [emailList, setEmailList] = useState(emails)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'plain' | 'styled'>('plain')
  const [variant, setVariant] = useState<EmailVariant>('warm')
  const streamRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [])

  function generateEmail() {
    if (!selectedContact) return
    setGenerating(true)
    setSubject('')
    setBody('')

    const contact = contacts.find(c => c.id === selectedContact)
    const mock = getMockEmail(account, contact, fromOwner, toOwner, variant)
    setSubject(mock.subject)

    let idx = 0
    streamRef.current = setInterval(() => {
      idx += 4
      if (idx >= mock.body.length) {
        setBody(mock.body)
        setGenerating(false)
        if (streamRef.current) clearInterval(streamRef.current)
      } else {
        setBody(mock.body.slice(0, idx))
      }
    }, 10)
  }

  function saveDraft() {
    const contact = contacts.find(c => c.id === selectedContact)
    const newEmail: Email = {
      id: `email-new-${Date.now()}`,
      subject,
      body,
      status: 'draft',
      type: 'warm_intro',
      sent_at: null,
      ai_generated: true,
      created_at: new Date().toISOString(),
      contact: contact ? { name: contact.name, email: contact.email || '' } : null,
    }
    setEmailList(prev => [newEmail, ...prev])
    setComposing(false)
    setSubject('')
    setBody('')
    setSelectedContact('')
  }

  function markSent(emailId: string) {
    setEmailList(prev =>
      prev.map(e => e.id === emailId ? { ...e, status: 'sent', sent_at: new Date().toISOString() } : e)
    )
  }

  const previewEmail = emailList.find(e => e.id === previewId)

  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Transition Emails</CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {emailList.length} email{emailList.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {!composing && (
            <button
              onClick={() => setComposing(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3 w-3" /> Draft Email
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Composer */}
        {composing && (
          <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
            {/* Enhanced progress bar */}
            {generating && (
              <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden -mt-2 mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 transition-[width] duration-300"
                  style={{
                    width: body.length > 0 ? `${Math.min((body.length / 1500) * 100, 95)}%` : '5%',
                  }}
                />
              </div>
            )}

            {/* Template variant selector */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Tone</Label>
              <div className="flex items-center gap-1 rounded-lg border bg-muted/20 p-1">
                {VARIANT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setVariant(opt.value)}
                    disabled={generating}
                    className={cn(
                      'flex-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all',
                      variant === opt.value
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={opt.description}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">To</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger className="h-9 text-[12px]">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.filter(c => c.email).map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-[12px]">
                        {c.name} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateEmail}
                  disabled={generating || !selectedContact}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-medium transition-all h-9',
                    generating || !selectedContact
                      ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                      : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                  )}
                >
                  {generating ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                      Writing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> Generate with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9 text-[12px]"
                placeholder="Email subject..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Body</Label>
              <div className="relative">
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={14}
                  className="text-[12px] leading-relaxed"
                  placeholder="Email body..."
                />
                {generating && (
                  <span className="absolute bottom-3 right-3 inline-block w-2 h-5 bg-blue-500 animate-pulse rounded-sm" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setComposing(false)
                  setSubject('')
                  setBody('')
                  setSelectedContact('')
                  if (streamRef.current) clearInterval(streamRef.current)
                  setGenerating(false)
                }}
                className="rounded-md border px-3 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDraft}
                disabled={!subject || !body || generating}
                className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <Save className="h-3 w-3" /> Save Draft
              </button>
            </div>
          </div>
        )}

        {/* Email Preview */}
        {previewEmail && (
          <div className="rounded-xl border overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5 border-b">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium">Email Preview</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Plain / Styled toggle */}
                <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5">
                  <button
                    onClick={() => setPreviewMode('plain')}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors',
                      previewMode === 'plain'
                        ? 'bg-muted text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={previewMode === 'plain'}
                  >
                    <AlignLeft className="h-2.5 w-2.5" />
                    Plain
                  </button>
                  <button
                    onClick={() => setPreviewMode('styled')}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors',
                      previewMode === 'styled'
                        ? 'bg-muted text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-pressed={previewMode === 'styled'}
                  >
                    <LayoutTemplate className="h-2.5 w-2.5" />
                    Styled
                  </button>
                </div>

                <button
                  onClick={() => setPreviewId(null)}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label="Close preview"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Preview body */}
            {previewMode === 'plain' ? (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium">To:</span>
                  {previewEmail.contact?.name} ({previewEmail.contact?.email})
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium">Subject:</span>
                  <span className="text-foreground font-medium">{previewEmail.subject}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {previewEmail.body}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <StyledEmailPreview email={previewEmail} fromOwner={fromOwner} />
              </div>
            )}
          </div>
        )}

        {/* Email List */}
        {emailList.length === 0 && !composing ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
              <Mail className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No emails drafted yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Draft a personalized intro email to introduce the new account manager.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {emailList.map(email => {
              const sc = statusConfig[email.status] || statusConfig.draft
              const StatusIcon = sc.icon
              return (
                <div key={email.id} className="group flex items-center gap-3 rounded-lg border p-3 row-hover">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', sc.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setPreviewId(previewId === email.id ? null : email.id)}
                  >
                    <p className="text-[12px] font-medium truncate">{email.subject}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      To: {email.contact?.name || 'Unknown'} · {formatDate(email.created_at)}
                      {email.sent_at && ` · Sent ${formatDate(email.sent_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn('text-[9px]', sc.color)}>
                      {sc.label}
                    </Badge>
                    {email.status === 'draft' && (
                      <button
                        onClick={() => markSent(email.id)}
                        className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Send className="h-2.5 w-2.5" /> Send
                      </button>
                    )}
                    <button
                      onClick={() => setPreviewId(previewId === email.id ? null : email.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

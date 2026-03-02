'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

type Screen = 'form' | 'success'

interface FormData {
  name: string
  email: string
  company: string
  teamSize: string
  accountCount: string
  challenges: string[]
  notes: string
}

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  company: '',
  teamSize: '',
  accountCount: '',
  challenges: [],
  notes: '',
}

const CHALLENGE_OPTIONS = [
  { id: 'lost-accounts',   label: 'Accounts lost at rep change' },
  { id: 'slow-ramp',       label: 'New reps ramp too slowly' },
  { id: 'lost-context',    label: 'Context lost in handoffs' },
  { id: 'comp-disputes',   label: 'Comp disputes at transition' },
  { id: 'bad-intros',      label: 'Inconsistent customer intros' },
  { id: 'no-visibility',   label: 'No transition visibility' },
  { id: 'manual-process',  label: 'Handoffs are manual & slow' },
  { id: 'rep-attrition',   label: 'Rep attrition hurts pipeline' },
]

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/relay/demo'

export function RequestDemoModal({ open, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('form')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setScreen('form')
      setForm(EMPTY_FORM)
      setLoading(false)
    }
  }, [open])

  const toggleChallenge = (id: string) => {
    setForm((prev) => ({
      ...prev,
      challenges: prev.challenges.includes(id)
        ? prev.challenges.filter((c) => c !== id)
        : [...prev.challenges, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const challengeLabels = form.challenges.map(
      (id) => CHALLENGE_OPTIONS.find((o) => o.id === id)?.label ?? id
    )

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, challenges: challengeLabels }),
      })
      if (!res.ok) console.error('Demo request API returned', res.status)
    } catch (err) {
      console.error('Demo request fetch error', err)
    }

    setLoading(false)
    setScreen('success')
  }

  const isFormValid = form.name.trim() && form.email.trim() && form.company.trim() && form.teamSize

  if (screen === 'success') {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90dvh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <DialogTitle>You're all set, {form.name.split(' ')[0]}!</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We'll be in touch. Book a time below if you'd like to get on the calendar now.
          </p>
          <div className="rounded-xl overflow-hidden border border-border flex-1 min-h-0">
            <iframe
              src={CALENDLY_URL}
              width="100%"
              height="100%"
              style={{ minHeight: '400px' }}
              frameBorder="0"
              title="Book a demo"
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden flex flex-col max-h-[90dvh]">

        {/* Header — pinned */}
        <div className="px-6 pt-6 pb-5 border-b border-border shrink-0">
          <DialogTitle className="text-xl font-semibold">See Relay in action</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us a little about yourself and we'll set up a personalized demo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="demo-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full name</Label>
                <Input
                  id="demo-name"
                  placeholder="Alex Johnson"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Work email</Label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="alex@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Company + Team size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="demo-company" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</Label>
                <Input
                  id="demo-company"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-team-size" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team size</Label>
                <Select value={form.teamSize} onValueChange={(v) => setForm({ ...form, teamSize: v })}>
                  <SelectTrigger id="demo-team-size" className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-1000">201–1,000</SelectItem>
                    <SelectItem value="1000+">1,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Account count */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-account-count" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Customer accounts (logos) <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Select value={form.accountCount} onValueChange={(v) => setForm({ ...form, accountCount: v })}>
                <SelectTrigger id="demo-account-count" className="w-full">
                  <SelectValue placeholder="How many accounts does your team manage?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-50">Under 50</SelectItem>
                  <SelectItem value="50-200">50 – 200</SelectItem>
                  <SelectItem value="200-500">200 – 500</SelectItem>
                  <SelectItem value="500-2000">500 – 2,000</SelectItem>
                  <SelectItem value="2000-10000">2,000 – 10,000</SelectItem>
                  <SelectItem value="10000+">10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Challenge chips */}
            <div className="space-y-2.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What's causing pain right now? <span className="normal-case font-normal">(pick any)</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {CHALLENGE_OPTIONS.map((option) => {
                  const selected = form.challenges.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleChallenge(option.id)}
                      className={cn(
                        'flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium text-center transition-all duration-150 leading-snug',
                        selected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-border bg-background text-foreground/60 hover:border-emerald-300 hover:text-foreground hover:bg-muted/40'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Free text */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-notes" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Anything else? <span className="normal-case font-normal">(optional)</span>
              </Label>
              <textarea
                id="demo-notes"
                rows={2}
                placeholder="Any context that would help us tailor the demo…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
              />
            </div>
          </div>

          {/* Footer — pinned */}
          <div className="px-6 pb-6 pt-2 border-t border-border shrink-0">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-semibold"
              disabled={!isFormValid || loading}
            >
              {loading ? 'Sending…' : 'Book your demo →'}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  )
}

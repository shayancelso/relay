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
  challenge: string
}

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  company: '',
  teamSize: '',
  challenge: '',
}

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/relay/demo'

export function RequestDemoModal({ open, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('form')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset to form when modal closes
  useEffect(() => {
    if (!open) {
      setScreen('form')
      setForm(EMPTY_FORM)
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        // Don't block the user — still show success, but log the issue
        console.error('Demo request API returned', res.status)
      }
    } catch (err) {
      // Best-effort — show success regardless
      console.error('Demo request fetch error', err)
    }

    setLoading(false)
    setScreen('success')
  }

  const isFormValid = form.name.trim() && form.email.trim() && form.company.trim() && form.teamSize

  if (screen === 'success') {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <DialogTitle>You're all set, {form.name.split(' ')[0]}!</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            We'll be in touch. Book a time below if you'd like to get on the calendar now.
          </p>
          <div className="mt-2 rounded-lg overflow-hidden border border-border">
            <iframe
              src={CALENDLY_URL}
              width="100%"
              height="520"
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>See Relay in action</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Tell us a little about yourself and we'll set up a personalized demo.
        </p>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-name">Full name</Label>
              <Input
                id="demo-name"
                placeholder="Alex Johnson"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-email">Work email</Label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-company">Company name</Label>
              <Input
                id="demo-company"
                placeholder="Acme Corp"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-team-size">Team size</Label>
              <Select
                value={form.teamSize}
                onValueChange={(v) => setForm({ ...form, teamSize: v })}
              >
                <SelectTrigger id="demo-team-size" className="w-full">
                  <SelectValue placeholder="Select size" />
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

          <div className="space-y-1.5">
            <Label htmlFor="demo-challenge">
              What are you hoping to solve?{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              id="demo-challenge"
              rows={3}
              placeholder="Tell us about your biggest challenge with account transitions..."
              value={form.challenge}
              onChange={(e) => setForm({ ...form, challenge: e.target.value })}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Sending…' : 'Book your demo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

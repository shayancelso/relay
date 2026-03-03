'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2 } from 'lucide-react'

// ─── Component ────────────────────────────────────────────────────────────────

export function ResendConfigure() {
  const [fromAddress, setFromAddress] = useState('transitions@wealthsimple.com')
  const [fromName, setFromName] = useState('Wealthsimple Account Team')
  const [replyTo, setReplyTo] = useState('')
  const [signature, setSignature] = useState(
    'The Wealthsimple Account Team\ntransitions@wealthsimple.com'
  )
  const [copyToCRM, setCopyToCRM] = useState(true)
  const [trackOpens, setTrackOpens] = useState(true)

  return (
    <div className="space-y-6">
      {/* Connected */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Connected to Resend</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              Domain: wealthsimple.com · DNS verified · Sending enabled
            </p>
          </div>
          <button className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            Manage domain
          </button>
        </div>
      </div>

      {/* From address */}
      <div className="space-y-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sender Details
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="from-name" className="text-[11px] text-muted-foreground">
              Display name
            </Label>
            <Input
              id="from-name"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              placeholder="Acme Account Team"
              className="h-9 text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="from-address" className="text-[11px] text-muted-foreground">
              From address
            </Label>
            <Input
              id="from-address"
              type="email"
              value={fromAddress}
              onChange={e => setFromAddress(e.target.value)}
              placeholder="transitions@yourcompany.com"
              className="h-9 text-[12px]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reply-to" className="text-[11px] text-muted-foreground">
            Reply-to address <span className="font-normal text-muted-foreground/60">(optional)</span>
          </Label>
          <Input
            id="reply-to"
            type="email"
            value={replyTo}
            onChange={e => setReplyTo(e.target.value)}
            placeholder="Same as from address"
            className="h-9 text-[12px]"
          />
        </div>
      </div>

      {/* Signature */}
      <div className="space-y-1.5">
        <Label htmlFor="email-signature" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Email Signature
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Appended to the bottom of all transition emails sent through Relay
        </p>
        <textarea
          id="email-signature"
          rows={4}
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder="Your name / team&#10;your@email.com"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-[12px] shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none font-mono"
        />
      </div>

      {/* Tracking options */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Tracking & Logging
        </Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Track email opens & replies</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                See when customers open intro emails and whether they reply. Shown on the transition timeline.
              </p>
            </div>
            <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-[12px] font-medium">Copy sent emails to CRM activity log</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Logs transition emails as activity records in Salesforce or HubSpot
              </p>
            </div>
            <Switch checked={copyToCRM} onCheckedChange={setCopyToCRM} />
          </div>
        </div>
      </div>
    </div>
  )
}

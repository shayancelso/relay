'use client'

// Customer Portal — /portal/[id]
// Public-facing "Meet your new AM" page sent to customers during a transition.
// No sidebar/topbar — completely standalone.
//
// Usage: /portal/trans-1  (any valid transition ID from demoTransitions)

import { useState } from 'react'
import {
  demoTransitions,
  demoAccounts,
  demoTeamMembers,
  demoContacts,
} from '@/lib/demo-data'
import { getInitials, formatDate } from '@/lib/utils'
import {
  Mail,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Phone,
  ExternalLink,
  Zap,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

function Avatar({
  name,
  size = 'lg',
}: {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold tracking-tight shrink-0`}
    >
      {getInitials(name)}
    </div>
  )
}

const TIMELINE_STEPS = [
  {
    id: 'intro-email',
    label: 'Introduction Email',
    description: 'A warm intro email has been sent on your behalf.',
    status: 'done' as const,
  },
  {
    id: 'intro-call',
    label: 'Introductory Call',
    description: 'Schedule a 30-minute call to connect and align on priorities.',
    status: 'next' as const,
  },
  {
    id: 'bau',
    label: 'Business as Usual',
    description: 'Your account is fully transitioned. Everything continues seamlessly.',
    status: 'upcoming' as const,
  },
]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CustomerPortalPage({
  params,
}: {
  params: { id: string }
}) {
  const [callScheduled, setCallScheduled] = useState(false)

  // --- Resolve data ---
  const transition = demoTransitions.find((t) => t.id === params.id)
    ?? demoTransitions[0] // fallback to first transition for demo

  const account = demoAccounts.find((a) => a.id === transition.account_id)
  const fromOwner = demoTeamMembers.find((m) => m.id === transition.from_owner_id)
  const toOwner = demoTeamMembers.find((m) => m.id === transition.to_owner_id)
  const primaryContact = demoContacts.find(
    (c) => c.account_id === transition.account_id && c.is_primary
  ) ?? demoContacts.find((c) => c.account_id === transition.account_id)

  if (!account || !toOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1918]">
        <p className="text-white/60 font-medium">Transition not found.</p>
      </div>
    )
  }

  const fromName = fromOwner?.full_name ?? 'Your previous account manager'
  const reasonLabel: Record<string, string> = {
    territory_change: 'territory realignment',
    rep_departure: 'team change',
    rebalance: 'portfolio rebalance',
    promotion: 'internal promotion',
    performance: 'account review',
  }

  return (
    <div className="min-h-screen bg-[#f5f4f2] font-sans">
      {/* ---------------------------------------------------------------- */}
      {/* HERO — dark header                                               */}
      {/* ---------------------------------------------------------------- */}
      <header className="bg-[#1a1918] text-white">
        {/* Top bar */}
        <div className="max-w-3xl mx-auto px-6 pt-6 pb-0 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/relay-icon.png" alt="Relay" className="w-6 h-6" />
            <span className="text-white/90 font-semibold text-sm tracking-tight">Relay</span>
          </div>
          <span className="text-white/25 text-sm">·</span>
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">
            Account Update
          </span>
        </div>

        {/* Hero content */}
        <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
          <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-4">
            A message from {account.name}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-snug max-w-xl">
            We&rsquo;d like to introduce you to your new account manager
          </h1>
          <p className="mt-4 text-white/55 text-base max-w-lg leading-relaxed">
            As part of a {reasonLabel[transition.reason] ?? 'team change'}, your account at{' '}
            <span className="text-white/80 font-medium">{account.name}</span> is transitioning
            to a new dedicated point of contact.
          </p>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN CONTENT                                                     */}
      {/* ---------------------------------------------------------------- */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* -- New AM card -------------------------------------------- */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
          {/* Card header band */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">
              Your New Account Manager
            </span>
          </div>

          <div className="px-6 py-6">
            <div className="flex items-start gap-5">
              <Avatar name={toOwner.full_name} size="xl" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-stone-900 tracking-tight">
                  {toOwner.full_name}
                </h2>
                <p className="text-stone-500 text-sm mt-0.5">
                  Account Manager · Enterprise &amp; Corporate
                </p>

                <div className="mt-4 space-y-2">
                  <a
                    href={`mailto:${toOwner.email}`}
                    className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-600 transition-colors group"
                  >
                    <Mail className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition-colors" />
                    {toOwner.email}
                  </a>
                  {toOwner.calendar_link && (
                    <a
                      href={toOwner.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-600 transition-colors group"
                    >
                      <Calendar className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition-colors" />
                      {toOwner.calendar_link}
                    </a>
                  )}
                </div>

                {/* Bio */}
                <p className="mt-5 text-stone-600 text-sm leading-relaxed border-t border-stone-100 pt-4">
                  {toOwner.full_name.split(' ')[0]} has 8 years of experience in enterprise account
                  management, specializing in financial services and corporate growth strategy. They
                  are deeply familiar with your account&rsquo;s history and are ready to support
                  your goals from day one.
                </p>

                {/* CTA */}
                <div className="mt-5">
                  {callScheduled ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Call scheduled — we&rsquo;ll send a confirmation shortly
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (toOwner.calendar_link) {
                          window.open(toOwner.calendar_link, '_blank')
                        }
                        setCallScheduled(true)
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule a Call
                      <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -- Transition summary card ---------------------------------- */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 px-6 py-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Transition Summary
          </h3>
          <p className="text-stone-700 text-sm leading-relaxed">
            <span className="font-medium text-stone-900">{fromName}</span> has handed off your
            account with full context.{' '}
            <span className="font-medium text-stone-900">
              {toOwner.full_name.split(' ')[0]}
            </span>{' '}
            is up to speed on your priorities, open items, and upcoming renewal timeline. You
            can expect a seamless experience with no gaps in service.
          </p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Full context transferred
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Account history reviewed
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Priorities aligned
            </span>
          </div>
        </section>

        {/* -- What to expect timeline ---------------------------------- */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 px-6 py-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-6">
            What to Expect
          </h3>
          <ol className="space-y-0">
            {TIMELINE_STEPS.map((step, idx) => (
              <li key={step.id} className="flex gap-4">
                {/* Connector column */}
                <div className="flex flex-col items-center">
                  {step.status === 'done' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : step.status === 'next' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 ring-4 ring-emerald-100">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-stone-200 flex items-center justify-center shrink-0">
                      <Circle className="w-4 h-4 text-stone-300" />
                    </div>
                  )}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 my-1 rounded-full ${
                        step.status === 'done' ? 'bg-emerald-300' : 'bg-stone-200'
                      }`}
                      style={{ minHeight: '32px' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${idx === TIMELINE_STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        step.status === 'done'
                          ? 'text-emerald-600 line-through decoration-emerald-300'
                          : step.status === 'next'
                          ? 'text-stone-900'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.status === 'done' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                        Done
                      </span>
                    )}
                    {step.status === 'next' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wide">
                        Next up
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      step.status === 'upcoming' ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* -- Key contacts card --------------------------------------- */}
        {primaryContact && (
          <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 px-6 py-6">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
              Questions? Reach out to
            </h3>
            <div className="flex items-center gap-4">
              <Avatar name={primaryContact.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900">{primaryContact.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">{primaryContact.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {primaryContact.email && (
                  <a
                    href={`mailto:${primaryContact.email}`}
                    aria-label={`Email ${primaryContact.name}`}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-stone-500 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {primaryContact.phone && (
                  <a
                    href={`tel:${primaryContact.phone}`}
                    aria-label={`Call ${primaryContact.name}`}
                    className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-stone-500 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER                                                           */}
      {/* ---------------------------------------------------------------- */}
      <footer className="max-w-3xl mx-auto px-6 py-10 flex items-center justify-between">
        <p className="text-stone-400 text-xs">
          Sent on {formatDate(transition.created_at)}
        </p>
        <a
          href="/"
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors text-xs group"
        >
          <img src="/relay-icon.png" alt="Relay" className="w-4 h-4" />
          Powered by Relay
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </footer>
    </div>
  )
}

'use client'

// Customer Portal — /portal/[id]
// Public-facing "Meet your new AM" page sent to customers during a transition.
// No sidebar/topbar — completely standalone.
//
// Usage: /portal/trans-1  (any valid transition ID from demoTransitions)

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
  Linkedin,
  Twitter,
  Send,
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
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [questionSent, setQuestionSent] = useState(false)

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
      {/* HERO — gradient banner                                           */}
      {/* ---------------------------------------------------------------- */}
      <header className="relative overflow-hidden">
        {/* Gradient background: emerald → teal */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 80%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top bar */}
        <div className="relative max-w-3xl mx-auto px-6 pt-6 pb-0 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/relay-icon.png" alt="Relay" className="w-6 h-6" />
            <span className="text-white/90 font-semibold text-sm tracking-tight">Relay</span>
          </div>
          <span className="text-white/40 text-sm">·</span>
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
            Account Update
          </span>
        </div>

        {/* Hero content */}
        <div className="relative max-w-3xl mx-auto px-6 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-emerald-100 text-sm font-medium tracking-wide uppercase mb-4">
              A message from {account.name}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-snug max-w-xl">
              We&rsquo;d like to introduce you to your new account manager
            </h1>
            <p className="mt-4 text-white/75 text-base max-w-lg leading-relaxed">
              As part of a {reasonLabel[transition.reason] ?? 'team change'}, your account at{' '}
              <span className="text-white font-semibold">{account.name}</span> is transitioning
              to a new dedicated point of contact.
            </p>
          </motion.div>

          {/* Prominent Book a Call CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8"
          >
            {callScheduled ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold border border-white/30">
                <CheckCircle2 className="w-5 h-5" />
                Call scheduled — confirmation coming shortly
              </div>
            ) : (
              <button
                onClick={() => {
                  if (toOwner.calendar_link) window.open(toOwner.calendar_link, '_blank')
                  setCallScheduled(true)
                }}
                className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-emerald-700 text-sm font-bold shadow-lg shadow-emerald-900/20 hover:bg-emerald-50 active:bg-emerald-100 transition-all"
              >
                <Calendar className="w-4.5 h-4.5" />
                Book a Call with {toOwner.full_name.split(' ')[0]}
                <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </motion.div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN CONTENT                                                     */}
      {/* ---------------------------------------------------------------- */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* -- New AM card -------------------------------------------- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden"
        >
          {/* Gradient header band */}
          <div className="relative h-20 bg-gradient-to-r from-emerald-500 to-teal-400 overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute bottom-2 left-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                Your New Account Manager
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar overlapping the gradient band */}
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center font-bold text-2xl tracking-tight shrink-0 ring-4 ring-white shadow-md">
                {getInitials(toOwner.full_name)}
              </div>
              <div className="mb-1 min-w-0">
                <h2 className="text-xl font-semibold text-stone-900 tracking-tight">
                  {toOwner.full_name}
                </h2>
                <p className="text-stone-500 text-sm mt-0.5">
                  Account Manager · Enterprise &amp; Corporate
                </p>
              </div>
            </div>

            {/* Contact links + social */}
            <div className="space-y-2 mb-5">
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

            {/* Social links */}
            <div className="flex items-center gap-2 mb-5">
              <a
                href="#"
                aria-label="LinkedIn profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-xs font-medium"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
              <a
                href="#"
                aria-label="Twitter profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors text-xs font-medium"
              >
                <Twitter className="w-3.5 h-3.5" />
                Twitter
              </a>
            </div>

            {/* Bio */}
            <p className="text-stone-600 text-sm leading-relaxed border-t border-stone-100 pt-4">
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
                    if (toOwner.calendar_link) window.open(toOwner.calendar_link, '_blank')
                    setCallScheduled(true)
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
                >
                  <Calendar className="w-4 h-4" />
                  Book a Call
                  <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              )}
            </div>
          </div>
        </motion.section>

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

        {/* -- What to expect timeline (interactive) -------------------- */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 px-6 py-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-6">
            What to Expect
          </h3>
          <ol className="space-y-0">
            {TIMELINE_STEPS.map((step, idx) => {
              const isActive = activeStep === step.id
              return (
                <li key={step.id} className="flex gap-4">
                  {/* Connector column */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setActiveStep(isActive ? null : step.id)}
                      aria-label={`View details for ${step.label}`}
                      className="focus:outline-none"
                    >
                      {step.status === 'done' ? (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : step.status === 'next' ? (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 ring-4 ring-emerald-100 cursor-pointer"
                        >
                          <Clock className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-8 h-8 rounded-full border-2 border-stone-200 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Circle className="w-4 h-4 text-stone-300" />
                        </motion.div>
                      )}
                    </button>
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
                  <div className={`pb-6 flex-1 ${idx === TIMELINE_STEPS.length - 1 ? 'pb-0' : ''}`}>
                    <button
                      onClick={() => setActiveStep(isActive ? null : step.id)}
                      className="w-full text-left"
                    >
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
                    </button>

                    {/* Expandable detail */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
                            {step.status === 'done' && (
                              <p className="text-xs text-stone-600 leading-relaxed">
                                This step was completed successfully. Your previous account manager sent
                                a personalized introduction email with full context on your account.
                              </p>
                            )}
                            {step.status === 'next' && (
                              <div className="space-y-2">
                                <p className="text-xs text-stone-600 leading-relaxed">
                                  {toOwner.full_name.split(' ')[0]} will reach out within 48 hours to
                                  schedule your intro call. Preferred time: Tuesday or Thursday, 10–11am.
                                </p>
                                {!callScheduled && (
                                  <button
                                    onClick={() => {
                                      if (toOwner.calendar_link) window.open(toOwner.calendar_link, '_blank')
                                      setCallScheduled(true)
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    Book a time now
                                  </button>
                                )}
                              </div>
                            )}
                            {step.status === 'upcoming' && (
                              <p className="text-xs text-stone-500 leading-relaxed">
                                Once the intro call is complete, your account will be fully transitioned.
                                All processes, renewals, and support continue without interruption.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              )
            })}
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

        {/* -- Ask a Question form ------------------------------------- */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200/80 px-6 py-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Ask a Question
          </h3>
          <p className="text-stone-500 text-xs mb-4 leading-relaxed">
            Have something on your mind? Send {toOwner.full_name.split(' ')[0]} a quick note and
            they&rsquo;ll get back to you within one business day.
          </p>

          <AnimatePresence mode="wait">
            {questionSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Message sent!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {toOwner.full_name.split(' ')[0]} will respond within one business day.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`Ask ${toOwner.full_name.split(' ')[0]} anything about your transition…`}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!question.trim()) return
                      setQuestionSent(true)
                    }}
                    disabled={!question.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Message
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER — Powered by Relay                                        */}
      {/* ---------------------------------------------------------------- */}
      <footer className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between border-t border-stone-200 pt-8">
          <p className="text-stone-400 text-xs">
            Sent on {formatDate(transition.created_at)}
          </p>
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-all text-xs font-medium group shadow-sm"
          >
            <Zap className="w-3 h-3 text-emerald-500" />
            Powered by Relay
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
          </a>
        </div>
      </footer>
    </div>
  )
}

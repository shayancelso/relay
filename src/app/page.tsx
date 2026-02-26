'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  Play,
  FileText,
  Target,
  Shield,
  Mail,
  Upload,
  BarChart3,
  ArrowRight,
  User,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react'

import { BlurFade } from '@/components/ui/blur-fade'
import { DotPattern } from '@/components/ui/dot-pattern'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Marquee } from '@/components/ui/marquee'
import { BorderBeam } from '@/components/ui/border-beam'
import { cn } from '@/lib/utils'
import { DEMO_USERS, getRoleLabel, getRoleDescription, type DemoRole } from '@/lib/role-context'

// ─── Role config (preserved from original) ───────────────────────────────────

const roleConfig: Record<DemoRole, { icon: typeof Shield; gradient: string; accent: string; features: string[] }> = {
  revops_admin: {
    icon: Shield,
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    accent: 'group-hover:text-emerald-400',
    features: ['Assignment Rules Engine', 'Organization Analytics', 'Team Capacity Planning', 'Full Transition Control'],
  },
  am_leadership: {
    icon: BarChart3,
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    accent: 'group-hover:text-blue-400',
    features: ['Pipeline Oversight', 'Team Performance', 'At-Risk Monitoring', 'Transition Health'],
  },
  rep: {
    icon: User,
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    accent: 'group-hover:text-amber-400',
    features: ['My Accounts', 'My Transitions', 'Action Items', 'Handoff Briefs'],
  },
}

// ─── Integration logos ────────────────────────────────────────────────────────

const integrations = [
  'Salesforce', 'HubSpot', 'Gainsight', 'Gong', 'Slack',
  'Outreach', 'Intercom', 'Google Calendar', 'Outlook', 'Zendesk',
]

// ─── Animated Hero Components ─────────────────────────────────────────────────

const rotatingWords = ['bad handoff', 'rep departure', 'lost context', 'slow transition', 'dropped account']

const AnimatedWord = () => {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  return (
    <span
      className="inline-block relative"
      style={{
        textShadow: `
          0 0 80px rgba(16,185,129,0.5),
          0 18px 80px rgba(20,184,166,0.12),
          0 0 40px rgba(16,185,129,0.35),
          0 0 20px rgba(52,211,153,0.25),
          0 0 10px rgba(16,185,129,0.15)
        `,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={rotatingWords[wordIndex]}
          className="inline-block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {rotatingWords[wordIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const heroCards = [
  { id: 1, text: 'Generating handoff brief for Acme Corp...', icon: Sparkles, color: '#10b981' },
  { id: 2, text: 'Matching accounts to optimal reps...', icon: Target, color: '#14b8a6' },
  { id: 3, text: 'Drafting personalized intro email...', icon: Mail, color: '#34d399' },
  { id: 4, text: 'Analyzing revenue impact across portfolio...', icon: BarChart3, color: '#0d9488' },
]

const HeroCardStack = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroCards.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full max-w-[840px] h-[80px] mx-auto" style={{ perspective: '1000px' }}>
      <AnimatePresence mode="popLayout">
        {heroCards.map((card, i) => {
          const offset = (i - index + heroCards.length) % heroCards.length
          if (offset > 2) return null
          const isActive = offset === 0

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{
                opacity: isActive ? 1 : 1 - offset * 0.3,
                scale: isActive ? 1 : 1 - offset * 0.05,
                y: isActive ? 0 : offset * 14,
                filter: isActive ? 'blur(0px)' : `blur(${offset * 2}px)`,
              }}
              exit={{
                opacity: 0,
                x: -100,
                rotateZ: -5,
                filter: 'blur(10px)',
                transition: { duration: 0.4 },
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="absolute top-0 left-0 right-0 mx-auto w-full h-[80px] px-6 sm:px-8 flex items-center gap-4 rounded-[28px] border origin-bottom"
              style={{
                background: 'rgba(42, 40, 38, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.5)' : 'none',
                zIndex: heroCards.length - offset,
              }}
            >
              <div className="p-2 rounded-full" style={{ backgroundColor: `${card.color}20` }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <span className="text-white/85 text-sm sm:text-lg font-medium tracking-wide">
                {card.text}
              </span>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-8 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${card.color}80, transparent)` }}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '200px', opacity: 1, x: [0, 500] }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()

  const selectRole = (role: DemoRole) => {
    localStorage.setItem('relay-demo-role', role)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1a1918] text-white antialiased overflow-x-hidden">

      {/* ─── 1. Sticky Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1918]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/relay-logo.png"
              alt="Relay"
              width={120}
              height={32}
              className="brightness-[0.95]"
              priority
            />
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Integrations', href: '#integrations' },
              { label: 'Pricing', href: '#pricing' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/50 hover:text-white/90 transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <ShimmerButton
            shimmerColor="#34d399"
            background="rgba(16,185,129,0.12)"
            borderRadius="8px"
            className="text-sm font-medium px-5 py-2.5 border-emerald-500/30 text-emerald-300 hover:text-white"
          >
            Request Demo
          </ShimmerButton>
        </div>
      </nav>

      {/* ─── 2. Hero Section ──────────────────────────────────────────────── */}
      <section id="hero" className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Animated background glows */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[50vw] h-[30vw] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.div
            className="absolute top-[20%] left-[-5%] w-[30vw] h-[30vw] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.07) 0%, transparent 70%)' }}
            animate={{ x: [0, 40, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
          />
          <motion.div
            className="absolute top-[10%] right-[-5%] w-[25vw] h-[25vw] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
            animate={{ x: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
          />
          <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[40vw] h-[20vw] bg-white/[0.02] rounded-full blur-[100px]" />
        </div>

        {/* Dot pattern overlay */}
        <DotPattern
          width={32}
          height={32}
          cr={1}
          className="text-white/[0.025] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,#000_30%,transparent_100%)]"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">

          {/* Announcement pill */}
          <BlurFade delay={0} duration={0.5}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5 text-xs text-emerald-400 mb-8 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Now with Revenue Intelligence</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </BlurFade>

          {/* Main headline */}
          <BlurFade delay={0.08} duration={0.6}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white/95 max-w-4xl mx-auto">
              Never lose a customer
              <br />
              to a <AnimatedWord />
            </h1>
          </BlurFade>

          {/* Subtitle */}
          <BlurFade delay={0.16} duration={0.6}>
            <p className="mt-7 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Relay automates account transitions with AI-powered briefs, intelligent assignment, and personalized outreach — so your customers never feel the seams.
            </p>
          </BlurFade>

          {/* CTA buttons */}
          <BlurFade delay={0.24} duration={0.55}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ShimmerButton
                shimmerColor="#34d399"
                background="rgba(16,185,129,0.9)"
                borderRadius="10px"
                className="text-base font-semibold px-8 py-3.5 text-white border-emerald-400/40 w-full sm:w-auto"
              >
                Start Free Trial
              </ShimmerButton>
              <button className="inline-flex items-center gap-2.5 text-base font-medium text-white/60 hover:text-white/90 transition-colors duration-200 px-6 py-3.5 rounded-xl border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03] w-full sm:w-auto justify-center">
                <div className="h-7 w-7 rounded-full border border-white/[0.15] flex items-center justify-center bg-white/[0.04]">
                  <Play className="h-3 w-3 fill-white/60 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>
          </BlurFade>

          {/* Social proof dots */}
          <BlurFade delay={0.32} duration={0.5}>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[
                  'bg-emerald-400',
                  'bg-teal-400',
                  'bg-cyan-400',
                  'bg-sky-400',
                  'bg-blue-400',
                ].map((color, i) => (
                  <div
                    key={i}
                    className={cn('h-7 w-7 rounded-full border-2 border-[#1a1918]', color)}
                  />
                ))}
              </div>
              <p className="text-sm text-white/40">
                Trusted by <span className="text-white/70 font-medium">200+ revenue teams</span>
              </p>
            </div>
          </BlurFade>

          {/* Animated card stack */}
          <BlurFade delay={0.38} duration={0.6}>
            <div className="mt-12 mb-4">
              <HeroCardStack />
            </div>
          </BlurFade>

          {/* Product mockup */}
          <BlurFade delay={0.5} duration={0.7}>
            <div className="relative mt-16 mx-auto max-w-5xl">
              {/* Glow behind mockup */}
              <div className="absolute inset-x-0 -top-10 h-32 bg-emerald-500/[0.08] blur-[60px] rounded-full pointer-events-none" />

              <div className="relative rounded-2xl bg-[#232221] border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/60">
                <BorderBeam
                  size={300}
                  duration={10}
                  colorFrom="#34d399"
                  colorTo="#0d9488"
                />

                {/* Mock browser chrome */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#1e1d1c]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/[0.08]" />
                    <div className="h-3 w-3 rounded-full bg-white/[0.08]" />
                    <div className="h-3 w-3 rounded-full bg-white/[0.08]" />
                  </div>
                  <div className="flex-1 mx-4 h-6 bg-white/[0.04] rounded-md flex items-center px-3">
                    <span className="text-xs text-white/20 font-mono">app.relay.ai/transitions</span>
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="flex h-72 sm:h-80 md:h-96">
                  {/* Fake sidebar */}
                  <div className="hidden sm:flex w-52 border-r border-white/[0.06] flex-col p-4 gap-2 bg-[#1e1d1c]">
                    <div className="h-6 w-20 rounded-md bg-emerald-500/20 mb-3" />
                    {[
                      { w: 'w-full', active: true },
                      { w: 'w-4/5', active: false },
                      { w: 'w-3/4', active: false },
                      { w: 'w-full', active: false },
                      { w: 'w-2/3', active: false },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-7 rounded-lg flex items-center px-2 gap-2',
                          item.active ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.02]'
                        )}
                      >
                        <div className={cn('h-2 w-2 rounded-full', item.active ? 'bg-emerald-400' : 'bg-white/10')} />
                        <div className={cn('h-2 rounded-full bg-white/10', item.w)} />
                      </div>
                    ))}
                    <div className="mt-auto space-y-1.5">
                      <div className="h-5 w-2/3 rounded bg-white/[0.04]" />
                      <div className="h-5 w-1/2 rounded bg-white/[0.04]" />
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col gap-4 overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-base font-semibold text-white/90 tracking-tight">24 Active Transitions</div>
                        <div className="text-xs text-white/35 mt-0.5">Last updated just now</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-7 w-16 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <div className="h-1.5 w-8 rounded-full bg-emerald-400/60" />
                        </div>
                        <div className="h-7 w-7 rounded-lg bg-white/[0.05] border border-white/[0.06]" />
                      </div>
                    </div>

                    {/* Progress bars with status */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'In Progress', value: 12, total: 24, color: 'bg-amber-400', pct: '50%' },
                        { label: 'Intro Sent', value: 7, total: 24, color: 'bg-blue-400', pct: '29%' },
                        { label: 'Completed', value: 5, total: 24, color: 'bg-emerald-400', pct: '21%' },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                          <div className={cn('h-1.5 w-6 rounded-full mb-2.5', item.color)} />
                          <div className="text-xl font-bold text-white/90">{item.value}</div>
                          <div className="text-xs text-white/35 mt-0.5">{item.label}</div>
                          <div className="mt-2.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', item.color)} style={{ width: item.pct }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mini chart / table */}
                    <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-white/50">ARR at Risk by Transition Stage</div>
                        <div className="text-xs text-emerald-400 font-medium">$47.2M Protected</div>
                      </div>
                      {/* Fake chart bars */}
                      <div className="flex items-end gap-2 h-12 sm:h-16">
                        {[40, 65, 85, 55, 90, 70, 45, 80, 60, 75, 50, 88].map((h, i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 rounded-t-sm',
                              i % 3 === 0 ? 'bg-emerald-500/40' : i % 3 === 1 ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                            )}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-4 top-24 hidden lg:block">
                <div className="bg-[#232221] border border-white/[0.10] rounded-xl p-4 shadow-xl shadow-black/40 w-44">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-white/40">Churn Prevented</span>
                  </div>
                  <div className="text-2xl font-bold text-white/95">$1.2M</div>
                  <div className="text-xs text-emerald-400 mt-1">+23% this quarter</div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-24 hidden lg:block">
                <div className="bg-[#232221] border border-white/[0.10] rounded-xl p-4 shadow-xl shadow-black/40 w-44">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-xs text-white/40">Brief Generated</span>
                  </div>
                  <div className="text-2xl font-bold text-white/95">3 min</div>
                  <div className="text-xs text-white/35 mt-1">vs. 3 days manual</div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ─── 3. Logo Marquee ──────────────────────────────────────────────── */}
      <section id="integrations" className="py-16 border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0} duration={0.5} inView>
            <p className="text-center text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-8">
              Integrates With Your Stack
            </p>
          </BlurFade>
        </div>

        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1a1918] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#1a1918] to-transparent z-10 pointer-events-none" />

          <Marquee pauseOnHover className="[--duration:35s] [--gap:1.5rem] mb-3">
            {integrations.map((name) => (
              <div
                key={name}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-5 py-3 text-sm text-white/40 font-medium whitespace-nowrap hover:text-white/60 hover:border-white/[0.15] transition-colors duration-200"
              >
                {name}
              </div>
            ))}
          </Marquee>

          <Marquee reverse pauseOnHover className="[--duration:40s] [--gap:1.5rem]">
            {[...integrations].reverse().map((name) => (
              <div
                key={name}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-5 py-3 text-sm text-white/40 font-medium whitespace-nowrap hover:text-white/60 hover:border-white/[0.15] transition-colors duration-200"
              >
                {name}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ─── 4. Problem Section ───────────────────────────────────────────── */}
      <section id="problem" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Headline + pain points */}
            <div>
              <BlurFade delay={0} duration={0.55} inView>
                <p className="text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-4">
                  The Problem
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white/95 leading-[1.1]">
                  Every rep departure
                  <br />
                  <span className="text-white/40">costs you</span>
                </h2>
              </BlurFade>

              <BlurFade delay={0.1} duration={0.55} inView>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white/95 tracking-tight">$</span>
                  <NumberTicker
                    value={2.1}
                    decimalPlaces={1}
                    delay={0.3}
                    className="text-6xl font-black text-white/95 tracking-tight"
                  />
                  <span className="text-4xl font-black text-white/95">M</span>
                  <span className="text-lg text-white/40 font-medium ml-2">avg. ARR at risk</span>
                </div>
              </BlurFade>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: AlertTriangle,
                    stat: '43%',
                    text: 'of customers churn within 90 days of a rep change',
                    color: 'text-red-400',
                    bg: 'bg-red-500/[0.06] border-red-500/[0.15]',
                  },
                  {
                    icon: Clock,
                    stat: '3 weeks',
                    text: 'average handoff takes of manual coordination',
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/[0.06] border-amber-500/[0.15]',
                  },
                  {
                    icon: FileText,
                    stat: '67%',
                    text: 'of account context is lost during transitions',
                    color: 'text-orange-400',
                    bg: 'bg-orange-500/[0.06] border-orange-500/[0.15]',
                  },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <BlurFade key={item.stat} delay={0.18 + i * 0.08} duration={0.5} inView>
                      <div className={cn('flex items-start gap-4 rounded-xl border p-5', item.bg)}>
                        <div className={cn('mt-0.5 shrink-0', item.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className={cn('text-base font-bold', item.color)}>{item.stat}</span>
                          <span className="text-base text-white/50 ml-2">{item.text}</span>
                        </div>
                      </div>
                    </BlurFade>
                  )
                })}
              </div>
            </div>

            {/* Right: Before/After visual */}
            <BlurFade delay={0.15} duration={0.6} inView>
              <div className="space-y-4">
                {/* Without Relay */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-sm font-semibold text-red-400/80 uppercase tracking-widest text-xs">Without Relay</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: '📊', label: 'Manual spreadsheet export', sub: '6 hrs' },
                      { icon: '📧', label: 'Email chain coordination', sub: '3 days' },
                      { icon: '📞', label: 'Back-and-forth calls', sub: '1 week' },
                      { icon: '😰', label: 'Customer notified — too late', sub: '3 weeks' },
                    ].map((step) => (
                      <div key={step.label} className="flex items-center gap-3 rounded-lg bg-red-500/[0.05] border border-red-500/10 px-4 py-2.5">
                        <span className="text-lg grayscale opacity-50">{step.icon}</span>
                        <span className="text-sm text-white/40 flex-1">{step.label}</span>
                        <span className="text-xs text-red-400/60 font-mono">{step.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-red-500/10 flex items-center justify-between">
                    <span className="text-xs text-white/25">Total time</span>
                    <span className="text-sm font-semibold text-red-400">~3 weeks</span>
                  </div>
                </div>

                {/* With Relay */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-400/80 uppercase tracking-widest text-xs">With Relay</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'CRM synced automatically', sub: '0 min', done: true },
                      { label: 'AI brief generated', sub: '3 min', done: true },
                      { label: 'Optimal rep assigned', sub: '1 min', done: true },
                      { label: 'Personalized intro sent', sub: '< 1 day', done: true },
                    ].map((step) => (
                      <div key={step.label} className="flex items-center gap-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-sm text-white/60 flex-1">{step.label}</span>
                        <span className="text-xs text-emerald-400/80 font-mono">{step.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-500/10 flex items-center justify-between">
                    <span className="text-xs text-white/25">Total time</span>
                    <span className="text-sm font-semibold text-emerald-400">Less than 1 day</span>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ─── 5. Features Bento Grid ───────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0} duration={0.55} inView>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-4">Features</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/95 max-w-3xl mx-auto leading-[1.1]">
                Everything you need to protect revenue during transitions
              </h2>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Card 1: AI Briefs — spans 2 cols on desktop */}
            <BlurFade delay={0.08} duration={0.55} inView className="md:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/[0.15] transition-all duration-300 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white/95 tracking-tight mb-3">AI-Powered Handoff Briefs</h3>
                    <p className="text-white/50 leading-relaxed">
                      Claude AI analyzes account history, support tickets, and relationship notes to generate comprehensive handoff briefs your reps actually read.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-emerald-400 font-medium hover:text-emerald-300 cursor-pointer transition-colors group">
                      Learn more <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                  {/* Fake brief preview */}
                  <div className="bg-[#1e1d1c] border border-white/[0.06] rounded-xl p-5 font-mono text-xs">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                      <div className="h-5 w-5 rounded bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-white/50 text-xs">Acme Corp — Handoff Brief</span>
                      <span className="ml-auto text-emerald-400/60 text-[10px]">AI Generated</span>
                    </div>
                    {[
                      { section: 'Account Summary', lines: ['w-full', 'w-4/5', 'w-3/4'] },
                      { section: 'Key Stakeholders', lines: ['w-5/6', 'w-2/3'] },
                      { section: 'Risks & Landmines', lines: ['w-full', 'w-3/4', 'w-4/5', 'w-1/2'] },
                    ].map((block) => (
                      <div key={block.section} className="mb-4">
                        <div className="text-emerald-400/70 font-semibold text-[10px] uppercase tracking-wider mb-2">{block.section}</div>
                        {block.lines.map((w, j) => (
                          <div key={j} className={cn('h-1.5 rounded-full bg-white/[0.08] mb-1.5', w)} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Card 2: Assignment Engine */}
            <BlurFade delay={0.14} duration={0.55} inView>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/[0.15] transition-all duration-300 h-full">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white/95 tracking-tight mb-3">Intelligent Assignment Engine</h3>
                <p className="text-white/50 leading-relaxed text-sm">
                  Weighted scoring algorithm matches accounts to the right rep based on capacity, industry expertise, geography, and ARR tier.
                </p>
                {/* Score bars */}
                <div className="mt-6 space-y-3">
                  {[
                    { name: 'Sarah Chen', score: 94, color: 'bg-emerald-400' },
                    { name: 'Marcus J.', score: 87, color: 'bg-blue-400' },
                    { name: 'Elena R.', score: 72, color: 'bg-white/20' },
                  ].map((rep, i) => (
                    <div key={rep.name} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] text-white/40 font-medium">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60">{rep.name}</span>
                          <span className={cn('text-xs font-bold', i === 0 ? 'text-emerald-400' : 'text-white/40')}>{rep.score}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', rep.color)} style={{ width: `${rep.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BlurFade>

            {/* Card 3: Revenue Dashboard */}
            <BlurFade delay={0.2} duration={0.55} inView>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/[0.15] transition-all duration-300 h-full">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white/95 tracking-tight mb-3">Revenue Protection Dashboard</h3>
                <p className="text-white/50 leading-relaxed text-sm">
                  Real-time visibility into ARR at risk, transition velocity, and churn prevention metrics across your entire book.
                </p>
                {/* Mini stat */}
                <div className="mt-6 bg-[#1e1d1c] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-white/30 mb-1">ARR Protected This Quarter</div>
                  <div className="text-3xl font-black text-emerald-400 tracking-tight">$47.2M</div>
                  {/* Mini trend line */}
                  <div className="mt-3 flex items-end gap-1 h-10">
                    {[30, 45, 40, 55, 50, 65, 60, 70, 65, 80, 75, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-emerald-500/20"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">+34% vs. last quarter</span>
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Card 4: Intro Sequences — spans 2 cols on desktop */}
            <BlurFade delay={0.26} duration={0.55} inView className="md:col-span-2">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/[0.15] transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
                      <Mail className="h-5 w-5 text-violet-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white/95 tracking-tight mb-3">Automated Intro Sequences</h3>
                    <p className="text-white/50 leading-relaxed">
                      Personalized intro emails that reference specific relationship details — not generic templates. Customers feel the continuity, not the change.
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-sm text-violet-400 font-medium hover:text-violet-300 cursor-pointer transition-colors group">
                      Learn more <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                  {/* Fake email preview */}
                  <div className="bg-[#1e1d1c] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">JD</div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">Jane Doe — Acme Corp</div>
                        <div className="text-[10px] text-white/25">Re: Your account — new point of contact</div>
                      </div>
                      <div className="ml-auto text-[10px] text-white/20">Just now</div>
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="text-xs text-white/50">Hi Jane,</div>
                      <div className="text-xs text-white/50 leading-relaxed">
                        I wanted to personally reach out as your new point of contact at Relay. I&apos;ve been fully briefed on your{' '}
                        <span className="text-violet-400/80">Q2 expansion goals</span> and the{' '}
                        <span className="text-violet-400/80">Salesforce integration</span> you&apos;ve been working toward...
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] w-4/5 mt-2" />
                      <div className="h-1.5 rounded-full bg-white/[0.06] w-3/5" />
                    </div>
                    <div className="px-5 pb-4 flex items-center gap-2">
                      <div className="h-7 w-20 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <span className="text-[10px] text-violet-400 font-medium">Send now</span>
                      </div>
                      <div className="h-7 w-16 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <span className="text-[10px] text-white/30">Edit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>

          </div>
        </div>
      </section>

      {/* ─── 6. Metrics Section ───────────────────────────────────────────── */}
      <section id="metrics" className="py-24 md:py-32 bg-[#161514] border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0} duration={0.55} inView>
            <p className="text-center text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-16">
              By The Numbers
            </p>
          </BlurFade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x divide-white/[0.06]">
            {[
              {
                prefix: '$',
                value: 2.1,
                suffix: 'B',
                decimals: 1,
                label: 'ARR transitioned safely',
                delay: 0,
              },
              {
                prefix: '',
                value: 94,
                suffix: 'x',
                decimals: 0,
                label: 'Average customer ROI',
                delay: 0.15,
              },
              {
                prefix: '',
                value: 3,
                suffix: ' min',
                decimals: 0,
                label: 'Average brief generation',
                delay: 0.3,
              },
              {
                prefix: '',
                value: 67,
                suffix: '%',
                decimals: 0,
                label: 'Reduction in transition time',
                delay: 0.45,
              },
            ].map((stat, i) => (
              <BlurFade key={i} delay={stat.delay} duration={0.55} inView>
                <div className="text-center lg:px-10">
                  <div className="flex items-baseline justify-center gap-1">
                    {stat.prefix && (
                      <span className="text-4xl font-black text-white/95">{stat.prefix}</span>
                    )}
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={stat.decimals}
                      delay={stat.delay + 0.3}
                      className="text-5xl font-black text-white/95 tracking-tight"
                    />
                    <span className="text-4xl font-black text-emerald-400">{stat.suffix}</span>
                  </div>
                  <p className="mt-3 text-sm text-white/40 leading-relaxed">{stat.label}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0} duration={0.55} inView>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/95 max-w-2xl mx-auto leading-[1.1]">
                From departure to done in days, not weeks
              </h2>
            </div>
          </BlurFade>

          <div className="relative grid md:grid-cols-3 gap-6">
            {/* Connecting line on desktop */}
            <div className="absolute top-14 left-0 right-0 hidden md:block">
              <div className="mx-auto max-w-2xl px-32">
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              </div>
            </div>

            {[
              {
                step: '01',
                icon: Upload,
                title: 'Import & Assign',
                description: 'Upload your book of business or sync directly from your CRM. Our engine recommends optimal assignments based on your rules and rep capacity.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Generate & Review',
                description: 'AI creates comprehensive briefs and personalized intro emails in minutes. Review, edit, and approve — or let it run automatically.',
                color: 'text-teal-400',
                bg: 'bg-teal-500/10 border-teal-500/20',
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Track & Protect',
                description: 'Monitor every transition in real-time. Get alerts on stalls, track customer engagement, and measure revenue impact across your entire pipeline.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
              },
            ].map((step, i) => {
              const Icon = step.icon
              return (
                <BlurFade key={step.step} delay={0.1 + i * 0.1} duration={0.55} inView>
                  <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/[0.15] transition-all duration-300 relative">
                    {/* Step number */}
                    <div className={cn('h-12 w-12 rounded-2xl border flex items-center justify-center mb-6', step.bg)}>
                      <Icon className={cn('h-5 w-5', step.color)} />
                    </div>
                    <div className="absolute top-8 right-8 text-5xl font-black text-white/[0.04] tracking-tight select-none">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-white/95 tracking-tight mb-3">{step.title}</h3>
                    <p className="text-white/45 leading-relaxed text-sm">{step.description}</p>
                  </div>
                </BlurFade>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. Social Proof / Testimonial ───────────────────────────────── */}
      <section id="social-proof" className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6">

          {/* Big quote card */}
          <BlurFade delay={0} duration={0.6} inView>
            <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-10 md:p-14 overflow-hidden max-w-4xl mx-auto">
              {/* Subtle emerald gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-teal-500/[0.04] pointer-events-none" />
              <BorderBeam size={200} duration={14} colorFrom="#34d399" colorTo="#0d9488" />

              <div className="relative z-10">
                {/* Stars */}
                <div className="flex gap-1 mb-7">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="h-4 w-4 rounded-sm bg-emerald-400/40" />
                  ))}
                </div>

                <blockquote className="text-xl sm:text-2xl md:text-3xl font-medium text-white/80 leading-relaxed tracking-tight">
                  &ldquo;Relay cut our transition time from 3 weeks to 3 days. More importantly, we went from losing 15% of transitioning accounts to losing less than 2%.&rdquo;
                </blockquote>

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                    VP
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/70">VP Revenue Operations</div>
                    <div className="text-xs text-white/35">Series D SaaS Company — $120M ARR</div>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* Social proof metric cards */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { value: '4.9/5', label: 'Avg. customer rating', sub: 'G2 + Capterra' },
              { value: '200+', label: 'Companies trust Relay', sub: 'From Series A to public' },
              { value: 'SOC 2', label: 'Type II certified', sub: 'Enterprise-grade security' },
            ].map((card) => (
              <BlurFade key={card.value} delay={0.15} duration={0.5} inView>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
                  <div className="text-2xl font-black text-white/90 tracking-tight">{card.value}</div>
                  <div className="text-xs text-white/50 mt-1 font-medium">{card.label}</div>
                  <div className="text-xs text-white/25 mt-0.5">{card.sub}</div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Try The Demo (Persona Selector) ──────────────────────────── */}
      <section id="demo" className="py-24 md:py-32 bg-[#161514] border-t border-white/[0.04]">
        <div className="relative max-w-7xl mx-auto px-6">
          <DotPattern
            width={32}
            height={32}
            cr={1}
            className="text-white/[0.02] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)]"
          />

          <div className="relative z-10">
            {/* Section header */}
            <BlurFade delay={0} duration={0.55} inView>
              <div className="text-center mb-4">
                <p className="text-xs font-semibold tracking-[0.2em] text-white/25 uppercase mb-4">Live Demo</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/95">
                  See it in action
                </h2>
                <p className="mt-5 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
                  Choose a persona to explore a live demo with{' '}
                  <span className="text-white/75 font-medium">2,000 accounts</span> of realistic data.
                </p>
              </div>
            </BlurFade>

            {/* Demo badge */}
            <BlurFade delay={0.08} duration={0.5} inView>
              <div className="flex justify-center mt-6 mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white/50 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Interactive demo — Wealthsimple
                </div>
              </div>
            </BlurFade>

            {/* Persona cards */}
            <div className="grid w-full gap-5 md:grid-cols-3">
              {(Object.keys(DEMO_USERS) as DemoRole[]).map((role, i) => {
                const config = roleConfig[role]
                const user = DEMO_USERS[role]
                const Icon = config.icon

                return (
                  <BlurFade key={role} delay={0.16 + i * 0.08} duration={0.5} inView>
                    <button
                      onClick={() => selectRole(role)}
                      className="group relative w-full text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20"
                    >
                      {/* Gradient glow on hover */}
                      <div
                        className={cn(
                          'absolute inset-0 rounded-2xl bg-gradient-to-b opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                          config.gradient
                        )}
                      />

                      <div className="relative z-10">
                        {/* Avatar + Info */}
                        <div className="mb-5 flex items-center gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/10 transition-all duration-300 group-hover:border-white/25 group-hover:shadow-lg group-hover:shadow-black/30">
                            <Image
                              src={user.avatar_url}
                              alt={user.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-white/30 mb-0.5">
                              {getRoleLabel(role)}
                            </p>
                            <h3 className="text-lg font-semibold text-white/90 tracking-tight">
                              {user.name}
                            </h3>
                            <p className="text-sm text-white/40">{user.title}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-4 text-sm text-white/35 leading-relaxed">
                          {getRoleDescription(role)}
                        </p>

                        {/* Features list */}
                        <div className="mt-5 space-y-2">
                          {config.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-xs text-white/30">
                              <div className="h-1 w-1 rounded-full bg-white/20" />
                              {f}
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white/40 transition-colors duration-300 group-hover:text-white/80">
                          Enter as {user.name.split(' ')[0]}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  </BlurFade>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Final CTA ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <BlurFade delay={0} duration={0.6} inView>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-emerald-500/[0.08] blur-[60px] rounded-full" />
              <div className="relative h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="h-7 w-7 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white/95 max-w-2xl mx-auto leading-[1.1]">
              Ready to protect your revenue?
            </h2>
            <p className="mt-6 text-lg text-white/45 max-w-xl mx-auto leading-relaxed">
              Join 200+ revenue teams using Relay to eliminate transition risk and retain more customers through every change.
            </p>
          </BlurFade>

          <BlurFade delay={0.12} duration={0.55} inView>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ShimmerButton
                shimmerColor="#34d399"
                background="rgba(16,185,129,0.9)"
                borderRadius="10px"
                className="text-base font-semibold px-10 py-4 text-white border-emerald-400/40 w-full sm:w-auto"
              >
                Start Free Trial
              </ShimmerButton>
              <button className="inline-flex items-center gap-2 text-base font-medium text-white/50 hover:text-white/80 transition-colors duration-200 px-8 py-4 rounded-xl border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.03] w-full sm:w-auto justify-center">
                Talk to Sales
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} duration={0.5} inView>
            <p className="mt-8 text-xs text-white/25">
              No credit card required. 14-day free trial. Cancel anytime.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* ─── 11. Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-16 bg-[#161514]">
        <div className="max-w-7xl mx-auto px-6">
          {/* 4-column grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {[
              {
                heading: 'Product',
                links: ['AI Handoff Briefs', 'Assignment Engine', 'Revenue Dashboard', 'Intro Sequences', 'Integrations', 'API'],
              },
              {
                heading: 'Resources',
                links: ['Documentation', 'API Reference', 'Changelog', 'Status Page', 'Community', 'Blog'],
              },
              {
                heading: 'Company',
                links: ['About', 'Careers', 'Security', 'Press Kit', 'Partners', 'Contact'],
              },
              {
                heading: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Data Processing', 'Cookie Policy', 'GDPR', 'SLA'],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold tracking-[0.15em] text-white/35 uppercase mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-white/35 hover:text-white/65 transition-colors duration-150"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/relay-logo.png"
                alt="Relay"
                width={80}
                height={22}
                className="brightness-[0.6]"
              />
              <span className="text-xs text-white/20">
                &copy; 2026 Relay. All rights reserved.
              </span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {['X', 'in', 'gh'].map((social) => (
                <div
                  key={social}
                  className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-xs font-bold text-white/25 hover:text-white/50 hover:border-white/[0.15] transition-all duration-150 cursor-pointer"
                >
                  {social}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

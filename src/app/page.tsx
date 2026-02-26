'use client'

import { useRouter } from 'next/navigation'
import { BlurFade } from '@/components/ui/blur-fade'
import { DotPattern } from '@/components/ui/dot-pattern'
import { DEMO_USERS, getRoleLabel, getRoleDescription, type DemoRole } from '@/lib/role-context'
import {
  Shield,
  BarChart3,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'

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

export default function PersonaSelector() {
  const router = useRouter()

  const selectRole = (role: DemoRole) => {
    localStorage.setItem('relay-demo-role', role)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1a1918] text-white antialiased">
      {/* Subtle dot pattern */}
      <DotPattern
        width={32}
        height={32}
        cr={1}
        className="text-white/[0.03] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-20">
        {/* Brand */}
        <BlurFade delay={0} duration={0.5}>
          <div className="mb-3">
            <Image
              src="/relay-logo.png"
              alt="Relay"
              width={180}
              height={48}
              className="brightness-[0.95]"
              priority
            />
          </div>
        </BlurFade>

        <BlurFade delay={0.05} duration={0.5}>
          <p className="mb-2 text-center text-sm text-white/40 tracking-wide">
            Account Transition Engine
          </p>
        </BlurFade>

        {/* Headline */}
        <BlurFade delay={0.1} duration={0.55}>
          <h1 className="mt-8 text-center text-4xl font-bold tracking-tight sm:text-5xl">
            Choose your view
          </h1>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.55}>
          <p className="mt-4 text-center text-base text-white/50 max-w-lg leading-relaxed">
            Relay adapts to your role. Select a persona to explore the demo with{' '}
            <span className="text-white/70">2,000 accounts</span> of realistic data.
          </p>
        </BlurFade>

        {/* Demo badge */}
        <BlurFade delay={0.2} duration={0.5}>
          <div className="mt-6 mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            Interactive demo — Wealthsimple
          </div>
        </BlurFade>

        {/* Role Cards */}
        <div className="grid w-full gap-5 md:grid-cols-3">
          {(Object.keys(DEMO_USERS) as DemoRole[]).map((role, i) => {
            const config = roleConfig[role]
            const user = DEMO_USERS[role]
            const Icon = config.icon

            return (
              <BlurFade key={role} delay={0.25 + i * 0.08} duration={0.5}>
                <button
                  onClick={() => selectRole(role)}
                  className="group relative w-full text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20"
                >
                  {/* Gradient glow on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${config.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

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
                        <p className="text-sm text-white/40">
                          {user.title}
                        </p>
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

        {/* Footer */}
        <BlurFade delay={0.5} duration={0.5}>
          <p className="mt-16 text-center text-xs text-white/20">
            Built with Next.js, Supabase, and Claude AI — all data is simulated
          </p>
        </BlurFade>
      </div>
    </div>
  )
}

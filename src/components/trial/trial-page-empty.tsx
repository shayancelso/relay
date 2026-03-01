'use client'

import Link from 'next/link'
import { Play, type LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  onExploreDemo: () => void
}

export function TrialPageEmpty({ icon: Icon, title, description, ctaLabel, ctaHref, onExploreDemo }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
          <Icon className="h-6 w-6 text-stone-300" />
        </div>

        {/* Heading */}
        <h2 className="text-lg font-semibold text-stone-800">{title}</h2>

        {/* Description */}
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">{description}</p>

        {/* Primary CTA */}
        <Link
          href={ctaHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          {ctaLabel}
        </Link>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-100" />
          <span className="text-xs text-stone-400">or</span>
          <div className="h-px flex-1 bg-stone-100" />
        </div>

        {/* Secondary — explore demo */}
        <button
          onClick={onExploreDemo}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <Play className="h-3.5 w-3.5 text-emerald-500" />
          Explore demo environment
        </button>
      </div>
    </div>
  )
}

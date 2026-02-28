'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: number
  selector: string
  title: string
  description: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    selector: '[data-tour="metrics"]',
    title: 'Dashboard Metrics',
    description: 'Get a real-time overview of all your account transitions, pipeline value, and team workload at a glance.',
    placement: 'bottom',
  },
  {
    id: 2,
    selector: '[data-tour="sidebar"]',
    title: 'Navigation',
    description: 'Navigate between Accounts, Transitions, Team, Rules, and more. Your role determines what you see here.',
    placement: 'right',
  },
  {
    id: 3,
    selector: '[data-tour="nav-transitions"]',
    title: 'Transitions',
    description: 'Track every account handoff from draft to completion. Click here to see all active transitions with AI-generated briefs and status tracking.',
    placement: 'right',
  },
  {
    id: 4,
    selector: '[data-tour="search"]',
    title: 'Quick Search',
    description: 'Press ⌘K to instantly search accounts, transitions, and team members. Type "account:" or "transition:" to filter by category.',
    placement: 'bottom',
  },
  {
    id: 5,
    selector: '[data-tour="role-switcher"]',
    title: 'Role Switcher',
    description: 'Switch between RevOps Admin, AM Leadership, and Rep personas to see how Relay adapts the entire experience to each role.',
    placement: 'right',
  },
]

const STORAGE_KEY = 'relay-tour-complete'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface TooltipPosition {
  top?: number
  bottom?: number
  left?: number
  right?: number
  translateX?: string
  translateY?: string
}

function getTooltipPosition(
  rect: SpotlightRect,
  placement: TourStep['placement'],
  tooltipWidth: number,
  tooltipHeight: number,
  padding: number
): TooltipPosition {
  const gap = 16

  switch (placement) {
    case 'bottom':
      return {
        top: rect.top + rect.height + gap,
        left: Math.max(
          padding,
          Math.min(
            window.innerWidth - tooltipWidth - padding,
            rect.left + rect.width / 2 - tooltipWidth / 2
          )
        ),
      }
    case 'top':
      return {
        top: rect.top - tooltipHeight - gap,
        left: Math.max(
          padding,
          Math.min(
            window.innerWidth - tooltipWidth - padding,
            rect.left + rect.width / 2 - tooltipWidth / 2
          )
        ),
      }
    case 'right':
      return {
        top: Math.max(
          padding,
          Math.min(
            window.innerHeight - tooltipHeight - padding,
            rect.top + rect.height / 2 - tooltipHeight / 2
          )
        ),
        left: rect.left + rect.width + gap,
      }
    case 'left':
      return {
        top: Math.max(
          padding,
          Math.min(
            window.innerHeight - tooltipHeight - padding,
            rect.top + rect.height / 2 - tooltipHeight / 2
          )
        ),
        left: rect.left - tooltipWidth - gap,
      }
  }
}

export function ProductTour() {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = TOUR_STEPS[stepIndex]

  const measureTarget = useCallback(() => {
    if (!currentStep) return

    const el = document.querySelector(currentStep.selector)
    if (!el) {
      setSpotlightRect(null)
      return
    }

    const r = el.getBoundingClientRect()
    const pad = 8
    const rect: SpotlightRect = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    }
    setSpotlightRect(rect)

    const tooltipW = 300
    const tooltipH = tooltipRef.current?.offsetHeight ?? 180
    const pos = getTooltipPosition(rect, currentStep.placement, tooltipW, tooltipH, 16)
    setTooltipPos(pos)
  }, [currentStep])

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        // Small delay to let the page render first
        const timer = setTimeout(() => setActive(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!active) return
    measureTarget()
    window.addEventListener('resize', measureTarget)
    return () => window.removeEventListener('resize', measureTarget)
  }, [active, measureTarget])

  function complete() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
    setActive(false)
  }

  function goNext() {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(i => i + 1)
    } else {
      complete()
    }
  }

  function goPrev() {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1)
    }
  }

  function skip() {
    complete()
  }

  if (!active) return null

  const isLast = stepIndex === TOUR_STEPS.length - 1
  const isFirst = stepIndex === 0

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Dark overlay with spotlight cutout */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998]"
            style={{ pointerEvents: 'none' }}
          >
            {/* Top shadow */}
            {spotlightRect && (
              <>
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: spotlightRect.top,
                  }}
                />
                {/* Bottom shadow */}
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: spotlightRect.top + spotlightRect.height,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                {/* Left shadow */}
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: spotlightRect.top,
                    left: 0,
                    width: spotlightRect.left,
                    height: spotlightRect.height,
                  }}
                />
                {/* Right shadow */}
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: spotlightRect.top,
                    left: spotlightRect.left + spotlightRect.width,
                    right: 0,
                    height: spotlightRect.height,
                  }}
                />
                {/* Spotlight ring */}
                <div
                  className="absolute rounded-xl ring-2 ring-primary/70 ring-offset-0 pointer-events-none"
                  style={{
                    top: spotlightRect.top,
                    left: spotlightRect.left,
                    width: spotlightRect.width,
                    height: spotlightRect.height,
                    boxShadow: '0 0 0 2px hsl(var(--primary) / 0.4)',
                  }}
                />
              </>
            )}

            {/* Full overlay when no element found */}
            {!spotlightRect && (
              <div className="absolute inset-0 bg-black/60" />
            )}
          </motion.div>

          {/* Clickthrough blocker except on tooltip */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={skip}
            aria-hidden="true"
          />

          {/* Tooltip */}
          <motion.div
            key={`tooltip-${stepIndex}`}
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[9999] w-[300px] rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/20"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {currentStep.id}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Step {currentStep.id} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={skip}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-muted/60 hover:text-muted-foreground transition-colors"
                aria-label="Skip tour"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1 px-4 mb-3">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === stepIndex
                      ? 'w-5 bg-primary'
                      : i < stepIndex
                      ? 'w-2 bg-primary/40'
                      : 'w-2 bg-muted-foreground/20'
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              <h3 className="text-[13px] font-semibold text-foreground mb-1">
                {currentStep.title}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
              <button
                onClick={skip}
                className="text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={goPrev}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/50 transition-colors"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isLast ? 'Done' : 'Next'}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

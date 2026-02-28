'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Play, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'relay-demo-banner-dismissed'

export function DemoBanner() {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (!dismissed) {
        // Small delay so the page renders first
        const timer = setTimeout(() => setVisible(true), 600)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore
    }
  }, [])

  function dismiss(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  function handleClick() {
    router.push('/transitions/trans-1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          {/* Gradient border wrapper */}
          <div
            className="rounded-2xl p-px"
            style={{
              background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(271 81% 66%), hsl(160 84% 39%))',
            }}
          >
            <button
              onClick={handleClick}
              className={cn(
                'group flex items-center gap-3 rounded-[15px] bg-card px-4 py-3 shadow-xl shadow-black/10',
                'hover:bg-muted/30 transition-colors'
              )}
              aria-label="Try the demo flow - view the first transition"
            >
              {/* Play icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm">
                <Play className="h-3.5 w-3.5 fill-white text-white" />
              </div>

              {/* Text */}
              <div className="text-left">
                <p className="text-[12px] font-semibold text-foreground leading-tight">
                  Try the demo flow
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  See a full account transition end-to-end
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />

              {/* Dismiss */}
              <div
                role="button"
                tabIndex={0}
                onClick={dismiss}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') dismiss(e as any) }}
                className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/30 hover:bg-muted/60 hover:text-muted-foreground transition-colors"
                aria-label="Dismiss demo banner"
              >
                <X className="h-3 w-3" />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

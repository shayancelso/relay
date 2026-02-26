'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShortcutGroup {
  label: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'A'], description: 'Go to Accounts' },
      { keys: ['G', 'T'], description: 'Go to Transitions' },
      { keys: ['G', 'M'], description: 'Go to Team' },
      { keys: ['G', 'P'], description: 'Go to Playbooks' },
      { keys: ['G', 'N'], description: 'Go to Analytics' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    label: 'Actions',
    shortcuts: [
      { keys: ['C'], description: 'Create new transition' },
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    label: 'Views',
    shortcuts: [
      { keys: ['1'], description: 'Switch to RevOps Admin view' },
      { keys: ['2'], description: 'Switch to AM Leadership view' },
      { keys: ['3'], description: 'Switch to Rep view' },
    ],
  },
]

export function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const router = useRouter()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    // ? key shows help
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setShowHelp(s => !s)
      return
    }

    // Escape closes help
    if (e.key === 'Escape') {
      setShowHelp(false)
      setPendingKey(null)
      return
    }

    // C for create
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !pendingKey) {
      router.push('/transitions/new')
      return
    }

    // Number keys for role switching
    if (['1', '2', '3'].includes(e.key) && !e.metaKey && !e.ctrlKey && !pendingKey) {
      const roles = ['revops_admin', 'am_leadership', 'rep'] as const
      const role = roles[parseInt(e.key) - 1]
      localStorage.setItem('relay-demo-role', role)
      window.location.reload()
      return
    }

    // G + key navigation
    if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !pendingKey) {
      setPendingKey('g')
      setTimeout(() => setPendingKey(null), 1500) // Reset after 1.5s
      return
    }

    if (pendingKey === 'g') {
      const navMap: Record<string, string> = {
        d: '/dashboard',
        a: '/accounts',
        t: '/transitions',
        m: '/team',
        p: '/playbooks',
        n: '/analytics',
        s: '/settings',
      }
      if (navMap[e.key]) {
        e.preventDefault()
        router.push(navMap[e.key])
      }
      setPendingKey(null)
    }
  }, [pendingKey, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!showHelp) {
    return pendingKey ? (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-foreground/90 px-3 py-2 text-[12px] text-background shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
        <kbd className="rounded bg-background/20 px-1.5 py-0.5 text-[11px] font-mono font-medium">G</kbd>
        <span className="text-background/70">then press a key...</span>
      </div>
    ) : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Keyboard Shortcuts</h2>
          <button onClick={() => setShowHelp(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted/50 hover:text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2.5">{group.label}</p>
              <div className="space-y-1">
                {group.shortcuts.map(shortcut => (
                  <div key={shortcut.description} className="flex items-center justify-between rounded-lg px-2.5 py-2 row-hover">
                    <span className="text-[12px] text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-muted-foreground/30 mx-0.5">then</span>}
                          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border/60 bg-muted/30 px-1.5 text-[11px] font-mono font-medium text-muted-foreground">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/40">Press <kbd className="rounded border border-border/40 bg-muted/20 px-1 text-[10px] font-mono">?</kbd> to toggle</span>
          <span className="text-[10px] text-muted-foreground/40">Press <kbd className="rounded border border-border/40 bg-muted/20 px-1 text-[10px] font-mono">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}

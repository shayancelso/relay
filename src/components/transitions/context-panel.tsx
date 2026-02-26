'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  X, ArrowRight, Building2, DollarSign, Calendar, Heart,
  FileText, Mail, ExternalLink, Clock,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStatus, getStatusColor, getPriorityColor, getSegmentColor, formatSegment, getHealthBg, getInitials, cn } from '@/lib/utils'
import { demoAccounts, demoTeamMembers, demoBriefs, demoEmails, demoActivities } from '@/lib/demo-data'
import type { Transition } from '@/types'
import Link from 'next/link'

interface ContextPanelProps {
  transition: Transition | null
  onClose: () => void
}

export function ContextPanel({ transition, onClose }: ContextPanelProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (transition) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [transition, onClose])

  if (!transition) return null

  const account = demoAccounts.find(a => a.id === transition.account_id)
  const fromOwner = demoTeamMembers.find(m => m.id === transition.from_owner_id)
  const toOwner = demoTeamMembers.find(m => m.id === transition.to_owner_id)
  const brief = demoBriefs.find(b => b.transition_id === transition.id)
  const emails = demoEmails.filter(e => e.transition_id === transition.id)
  const activities = demoActivities
    .filter(a => a.transition_id === transition.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const STATUS_STEPS = ['draft', 'pending_approval', 'approved', 'intro_sent', 'meeting_booked', 'in_progress', 'completed']
  const currentStepIdx = STATUS_STEPS.indexOf(transition.status)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[440px] border-l border-border/60 bg-card shadow-2xl shadow-black/10 overflow-hidden animate-in slide-in-from-right duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
              <Building2 className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-tight">{account?.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatSegment(account?.segment || '')} · {account?.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/transitions/${transition.id}`}
              className="flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              Open <ExternalLink className="h-2.5 w-2.5" />
            </Link>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-muted/50 hover:text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Status + Priority */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-3">
            <Badge variant="outline" className={cn('text-[10px]', getStatusColor(transition.status))}>{formatStatus(transition.status)}</Badge>
            <Badge variant="outline" className={cn('text-[10px]', getPriorityColor(transition.priority))}>{transition.priority}</Badge>
            {transition.reason && <Badge variant="outline" className="text-[10px] capitalize">{transition.reason.replace(/_/g, ' ')}</Badge>}
          </div>

          {/* Progress Steps */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-0.5">
              {STATUS_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i <= currentStepIdx ? 'bg-emerald-500' : 'bg-muted'
                  )}
                  title={formatStatus(s)}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Step {currentStepIdx + 1} of {STATUS_STEPS.length}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-5" />

          {/* Assignment */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 mb-3">Assignment</p>
            <div className="flex items-center gap-3">
              {fromOwner && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 border border-border/40 shrink-0">
                    <AvatarFallback className="text-[9px] font-semibold bg-red-50 text-red-600">{getInitials(fromOwner.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{fromOwner.full_name}</p>
                    <p className="text-[9px] text-muted-foreground">Outgoing</p>
                  </div>
                </div>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              {toOwner && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 border border-border/40 shrink-0">
                    <AvatarFallback className="text-[9px] font-semibold bg-emerald-50 text-emerald-600">{getInitials(toOwner.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{toOwner.full_name}</p>
                    <p className="text-[9px] text-muted-foreground">Incoming</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Account Stats */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 mb-3">Account Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: DollarSign, label: 'ARR', value: formatCurrency(account?.arr || 0) },
                { icon: Heart, label: 'Health', value: String(account?.health_score || 0), color: getHealthBg(account?.health_score || 0) },
                { icon: Calendar, label: 'Due Date', value: transition.due_date ? formatDate(transition.due_date) : 'Not set' },
                { icon: Building2, label: 'Employees', value: account?.employee_count?.toLocaleString() || '—' },
              ].map(stat => (
                <div key={stat.label} className="rounded-lg border border-border/40 p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className={cn('text-[13px] font-semibold tabular-nums', stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Brief + Emails Summary */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 mb-3">Artifacts</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', brief ? 'bg-violet-50' : 'bg-muted/50')}>
                  <FileText className={cn('h-3.5 w-3.5', brief ? 'text-violet-600' : 'text-muted-foreground/40')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">Handoff Brief</p>
                  <p className="text-[9px] text-muted-foreground">{brief ? `v${brief.version} · ${brief.status}` : 'Not generated'}</p>
                </div>
                {brief && <Badge variant="outline" className="text-[8px] bg-violet-50 text-violet-600 border-violet-200 capitalize">{brief.status}</Badge>}
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', emails.length > 0 ? 'bg-blue-50' : 'bg-muted/50')}>
                  <Mail className={cn('h-3.5 w-3.5', emails.length > 0 ? 'text-blue-600' : 'text-muted-foreground/40')} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium">Emails</p>
                  <p className="text-[9px] text-muted-foreground">{emails.length > 0 ? `${emails.length} email${emails.length !== 1 ? 's' : ''} · ${emails.filter(e => e.status === 'sent').length} sent` : 'No emails drafted'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 mx-5" />

          {/* Activity Timeline */}
          {activities.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40 mb-3">Recent Activity</p>
              <div className="space-y-2.5">
                {activities.map(a => {
                  const user = demoTeamMembers.find(m => m.id === a.created_by)
                  return (
                    <div key={a.id} className="flex gap-2.5">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <div className="w-px flex-1 bg-border/40 mt-1" />
                      </div>
                      <div className="pb-2">
                        <p className="text-[11px] leading-relaxed">{a.description}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {user?.full_name} · {formatDate(a.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t px-5 py-3 flex items-center gap-2 shrink-0">
          <Link
            href={`/transitions/${transition.id}`}
            className="flex-1 rounded-lg bg-primary py-2 text-center text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </>
  )
}

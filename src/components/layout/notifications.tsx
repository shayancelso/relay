'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  ArrowLeftRight,
  FileText,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'transition' | 'brief' | 'email' | 'alert' | 'complete' | 'team'
  title: string
  description: string
  time: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Transition Stalled',
    description: 'Lightspeed Commerce transition has had no activity for 8 days',
    time: '12m ago',
    read: false,
  },
  {
    id: '2',
    type: 'brief',
    title: 'Brief Ready for Review',
    description: 'AI-generated handoff brief for Coveo Solutions is ready',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    type: 'email',
    title: 'Intro Email Opened',
    description: 'Sarah Park at Shopify Plus opened the intro email',
    time: '2h ago',
    read: false,
  },
  {
    id: '4',
    type: 'transition',
    title: 'New Transition Assigned',
    description: "You've been assigned Wealthsimple Trade (Enterprise)",
    time: '3h ago',
    read: true,
  },
  {
    id: '5',
    type: 'complete',
    title: 'Transition Completed',
    description: 'Meridian Credit Union handoff marked as complete',
    time: '5h ago',
    read: true,
  },
  {
    id: '6',
    type: 'team',
    title: 'Capacity Alert',
    description: 'Elena Rodriguez is at 92% capacity — consider rebalancing',
    time: '1d ago',
    read: true,
  },
  {
    id: '7',
    type: 'email',
    title: 'Follow-up Reminder',
    description: 'No reply from David Lee at Suncor Energy after 5 days',
    time: '1d ago',
    read: true,
  },
  {
    id: '8',
    type: 'transition',
    title: 'Approval Needed',
    description: 'Bulk transition for territory change needs your approval',
    time: '2d ago',
    read: true,
  },
]

const typeIcons: Record<Notification['type'], React.ElementType> = {
  transition: ArrowLeftRight,
  brief: FileText,
  email: Mail,
  alert: AlertTriangle,
  complete: CheckCircle2,
  team: Users,
}

const typeColors: Record<Notification['type'], string> = {
  transition: 'text-blue-500 bg-blue-50',
  brief: 'text-violet-500 bg-violet-50',
  email: 'text-emerald-500 bg-emerald-50',
  alert: 'text-red-500 bg-red-50',
  complete: 'text-emerald-600 bg-emerald-50',
  team: 'text-amber-500 bg-amber-50',
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type]
              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markRead(notification.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      markRead(notification.id)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer gap-3 border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/30',
                    !notification.read && 'bg-muted/20'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      typeColors[notification.type]
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'truncate text-[12px] font-medium',
                          !notification.read && 'text-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/50">
                      {notification.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2.5 text-center">
            <button className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

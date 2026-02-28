'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { demoAccounts } from '@/lib/demo-data'

interface Notification {
  id: string
  type: 'transition' | 'brief' | 'email' | 'alert' | 'complete' | 'team'
  title: string
  description: string
  time: string
  read: boolean
  // ISO-like date bucket: 'today' | 'yesterday' | 'earlier'
  bucket: 'today' | 'yesterday' | 'earlier'
}

// ---------------------------------------------------------------------------
// Route map per notification type
// ---------------------------------------------------------------------------
const typeRoutes: Record<Notification['type'], string> = {
  transition: '/transitions',
  brief: '/transitions',
  email: '/transitions',
  alert: '/transitions',
  complete: '/transitions',
  team: '/team',
}

// ---------------------------------------------------------------------------
// Category tab definitions
// ---------------------------------------------------------------------------
type CategoryTab = 'all' | 'transition' | 'brief' | 'email' | 'alert'

const CATEGORY_TABS: { id: CategoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'transition', label: 'Transitions' },
  { id: 'brief', label: 'Briefs' },
  { id: 'email', label: 'Emails' },
  { id: 'alert', label: 'Alerts' },
]

// 'alert' tab should also match 'complete' and 'team' types for simplicity
function notificationMatchesTab(n: Notification, tab: CategoryTab): boolean {
  if (tab === 'all') return true
  if (tab === 'alert') return n.type === 'alert' || n.type === 'complete' || n.type === 'team'
  return n.type === tab
}

// ---------------------------------------------------------------------------
// Initial notifications dataset
// ---------------------------------------------------------------------------
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Transition Stalled',
    description: 'Lightspeed Commerce transition has had no activity for 8 days',
    time: '12m ago',
    read: false,
    bucket: 'today',
  },
  {
    id: '2',
    type: 'brief',
    title: 'Brief Ready for Review',
    description: 'AI-generated handoff brief for Coveo Solutions is ready',
    time: '1h ago',
    read: false,
    bucket: 'today',
  },
  {
    id: '3',
    type: 'email',
    title: 'Intro Email Opened',
    description: 'Sarah Park at Shopify Plus opened the intro email',
    time: '2h ago',
    read: false,
    bucket: 'today',
  },
  {
    id: '4',
    type: 'transition',
    title: 'New Transition Assigned',
    description: "You've been assigned Wealthsimple Trade (Enterprise)",
    time: '3h ago',
    read: true,
    bucket: 'today',
  },
  {
    id: '5',
    type: 'complete',
    title: 'Transition Completed',
    description: 'Meridian Credit Union handoff marked as complete',
    time: '5h ago',
    read: true,
    bucket: 'today',
  },
  {
    id: '6',
    type: 'team',
    title: 'Capacity Alert',
    description: 'Elena Rodriguez is at 92% capacity — consider rebalancing',
    time: '1d ago',
    read: true,
    bucket: 'yesterday',
  },
  {
    id: '7',
    type: 'email',
    title: 'Follow-up Reminder',
    description: 'No reply from David Lee at Suncor Energy after 5 days',
    time: '1d ago',
    read: true,
    bucket: 'yesterday',
  },
  {
    id: '8',
    type: 'transition',
    title: 'Approval Needed',
    description: 'Bulk transition for territory change needs your approval',
    time: '2d ago',
    read: true,
    bucket: 'earlier',
  },
]

// ---------------------------------------------------------------------------
// Random notification generator for real-time simulation
// ---------------------------------------------------------------------------
let simulationCounter = 100

function getRandomAccountName(): string {
  const accounts = demoAccounts.slice(0, 20)
  const idx = Math.floor(Math.random() * accounts.length)
  return accounts[idx]?.name ?? 'Acme Corp'
}

function getRandomContactName(): string {
  const names = ['Jordan Lee', 'Maria Santos', 'Kevin Wu', 'Aisha Patel', 'Tom Nguyen']
  return names[Math.floor(Math.random() * names.length)]
}

type NotificationTemplate = {
  type: Notification['type']
  titleFn: () => string
  descFn: () => string
}

const TEMPLATES: NotificationTemplate[] = [
  {
    type: 'transition',
    titleFn: () => 'New Transition Assigned',
    descFn: () => `New transition assigned: ${getRandomAccountName()}`,
  },
  {
    type: 'brief',
    titleFn: () => 'Brief Ready for Review',
    descFn: () => `Brief ready for review: ${getRandomAccountName()}`,
  },
  {
    type: 'email',
    titleFn: () => 'Intro Email Opened',
    descFn: () => `Email opened by ${getRandomContactName()}`,
  },
  {
    type: 'complete',
    titleFn: () => 'Transition Completed',
    descFn: () => `Transition completed: ${getRandomAccountName()}`,
  },
]

function generateRandomNotification(): Notification {
  simulationCounter++
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  return {
    id: `sim-${simulationCounter}`,
    type: template.type,
    title: template.titleFn(),
    description: template.descFn(),
    time: 'just now',
    read: false,
    bucket: 'today',
  }
}

// ---------------------------------------------------------------------------
// Icon / color maps
// ---------------------------------------------------------------------------
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

const BUCKET_LABELS: Record<Notification['bucket'], string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
}

const BUCKET_ORDER: Notification['bucket'][] = ['today', 'yesterday', 'earlier']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real-time simulation: add a new notification every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif = generateRandomNotification()
      setNotifications((prev) => [newNotif, ...prev])
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      markRead(notification.id)
      const route = typeRoutes[notification.type]
      setOpen(false)
      router.push(route)
    },
    [markRead, router],
  )

  // Filtered notifications by active tab
  const filteredNotifications = notifications.filter((n) =>
    notificationMatchesTab(n, activeTab),
  )

  // Group by bucket
  const grouped = BUCKET_ORDER.reduce<Record<string, Notification[]>>(
    (acc, bucket) => {
      const items = filteredNotifications.filter((n) => n.bucket === bucket)
      if (items.length > 0) acc[bucket] = items
      return acc
    },
    {},
  )

  const tabUnreadCount = (tab: CategoryTab) =>
    notifications.filter((n) => !n.read && notificationMatchesTab(n, tab)).length

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
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/5"
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

          {/* Category tabs */}
          <div className="flex items-center gap-1 border-b px-3 py-2">
            {CATEGORY_TABS.map((tab) => {
              const count = tabUnreadCount(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {tab.label}
                  {count > 0 && tab.id !== 'all' && (
                    <span
                      className={cn(
                        'ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold',
                        activeTab === tab.id
                          ? 'bg-background text-foreground'
                          : 'bg-emerald-500 text-white',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-muted-foreground">
                No notifications in this category
              </div>
            ) : (
              BUCKET_ORDER.filter((b) => grouped[b]).map((bucket) => (
                <div key={bucket}>
                  {/* Date group header */}
                  <div className="sticky top-0 z-10 bg-muted/40 px-4 py-1.5 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {BUCKET_LABELS[bucket]}
                    </span>
                  </div>

                  {grouped[bucket].map((notification) => {
                    const Icon = typeIcons[notification.type]
                    return (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notification)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleNotificationClick(notification)
                          }
                        }}
                        className={cn(
                          'flex cursor-pointer gap-3 border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/30',
                          !notification.read && 'bg-muted/20',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            typeColors[notification.type],
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                'truncate text-[12px] font-medium',
                                !notification.read && 'text-foreground',
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
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2.5 text-center">
            <button
              onClick={() => {
                setOpen(false)
                router.push('/transitions')
              }}
              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

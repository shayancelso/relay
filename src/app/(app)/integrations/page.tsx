'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  RefreshCw,
  Plus,
  Settings,
  Link2,
  Loader2,
  Trash2,
  Key,
  ExternalLink,
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  getIntegrationGroups,
  getIntegrationDef,
  type IntegrationDefinition,
} from '@/lib/integrations/registry'
import type { IntegrationConnection } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IntegrationConfigureSheet } from '@/components/settings/integration-configure-sheet'

// ─── Integration Card ────────────────────────────────────────────────────────

function IntegrationCard({
  def,
  connection,
  onConnect,
  onDisconnect,
  onConfigure,
}: {
  def: IntegrationDefinition
  connection: IntegrationConnection | null
  onConnect: (def: IntegrationDefinition) => void
  onDisconnect: (provider: string) => void
  onConfigure: (def: IntegrationDefinition, connection: IntegrationConnection) => void
}) {
  const isConnected = connection?.status === 'connected'
  const isError = connection?.status === 'error'

  return (
    <Card className={cn('group relative overflow-hidden', isConnected && 'border-border/60')}>
      {isConnected && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400/60 via-emerald-500/80 to-emerald-400/60" />
      )}
      {isError && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-400/60 via-red-500/80 to-red-400/60" />
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold tracking-wide',
              def.color,
            )}
          >
            {def.icon}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold leading-none">{def.name}</span>
                  {isConnected ? (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                      Connected
                    </Badge>
                  ) : isError ? (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-red-50 text-red-600 border-red-200 gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                      Error
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground/60">
                      Available
                    </Badge>
                  )}
                  {def.authType === 'oauth2' && !isConnected && (
                    <span className="text-[9px] text-muted-foreground/40">OAuth</span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">{def.description}</p>

            {isConnected && connection?.api_key_label && (
              <div className="flex items-center gap-1.5">
                <Key className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/50 font-mono">
                  {connection.api_key_label}
                </span>
              </div>
            )}

            {isError && connection?.last_error && (
              <p className="text-[10px] text-red-500">{connection.last_error}</p>
            )}

            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                {isConnected && connection?.connected_at ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                    <span>Connected {timeAgo(connection.connected_at)}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/40">Not connected</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => onConfigure(def, connection!)}
                      className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Configure
                    </button>
                    <button
                      onClick={() => onDisconnect(def.id)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      title="Disconnect"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onConnect(def)}
                    className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Connect Sheet (API Key) ─────────────────────────────────────────────────

function ConnectSheet({
  def,
  onClose,
  onConnected,
}: {
  def: IntegrationDefinition | null
  onClose: () => void
  onConnected: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConnect = async () => {
    if (!def || !apiKey.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: def.id, api_key: apiKey }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Connection failed')
      }

      toast.success(`${def.name} connected`, { description: 'Integration is now active.' })
      setApiKey('')
      onConnected()
      onClose()
    } catch (err) {
      toast.error('Connection failed', { description: err instanceof Error ? err.message : 'Please check your API key and try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={!!def} onOpenChange={(open) => { if (!open) { onClose(); setApiKey('') } }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-5 border-b shrink-0">
          {def && (
            <div className="flex items-center gap-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold', def.color)}>
                {def.icon}
              </div>
              <div>
                <SheetTitle className="text-[15px] font-semibold leading-none">
                  Connect {def.name}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground mt-1">{def.description}</p>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {def?.authType === 'api_key' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-[12px] font-medium">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={def.keyPlaceholder || 'Paste your API key here'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-[12px]"
                />
              </div>

              {def.keyHelpUrl && (
                <a
                  href={def.keyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  How to find your API key
                </a>
              )}

              <div className="rounded-lg bg-muted/40 border border-border/50 p-3 space-y-1.5">
                <p className="text-[11px] font-medium text-foreground/80">What happens next</p>
                <ul className="text-[10px] text-muted-foreground space-y-1">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    Your API key is encrypted and stored securely
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    Relay will verify the connection with {def.name}
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    Data sync begins automatically
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <Link2 className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] font-medium text-foreground">OAuth Integration</p>
              <p className="text-[11px] text-muted-foreground text-center max-w-[260px]">
                {def?.name} uses OAuth for authentication. This requires additional setup with your {def?.name} admin.
                Contact us for assistance.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => { onClose(); setApiKey('') }}>
            Cancel
          </Button>
          {def?.authType === 'api_key' && (
            <Button
              size="sm"
              disabled={!apiKey.trim() || saving}
              onClick={handleConnect}
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
              Connect
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Page ────────────────────────────────────────────────────────────────────

function IntegrationsContent() {
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<IntegrationConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingDef, setConnectingDef] = useState<IntegrationDefinition | null>(null)
  const [configuringProvider, setConfiguringProvider] = useState<string | null>(null)
  const toastShown = useRef(false)

  // Handle OAuth return params
  useEffect(() => {
    if (toastShown.current) return
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      const def = getIntegrationDef(connected)
      toast.success(`${def?.name || connected} connected!`, { description: 'Integration is now active.' })
      toastShown.current = true
      window.history.replaceState({}, '', '/integrations')
    } else if (error) {
      const messages: Record<string, string> = {
        access_denied: 'You denied access. Try again when ready.',
        not_configured: 'This integration is not configured yet. Contact support.',
        token_exchange_failed: 'Failed to complete authentication. Please try again.',
        oauth_failed: 'Something went wrong. Please try again.',
      }
      toast.error('Connection failed', { description: messages[error] || error })
      toastShown.current = true
      window.history.replaceState({}, '', '/integrations')
    }
  }, [searchParams])

  const groups = getIntegrationGroups()

  // Handle connect: OAuth → redirect, API key → open sheet
  const handleConnect = (def: IntegrationDefinition) => {
    if (def.authType === 'oauth2') {
      window.location.href = `/api/integrations/oauth/${def.id}`
    } else {
      setConnectingDef(def)
    }
  }

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations')
      if (res.ok) {
        const data = await res.json()
        setConnections(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConnections()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, fetchConnections])

  const getConnection = (provider: string) =>
    connections.find((c) => c.provider === provider) || null

  const handleDisconnect = async (provider: string) => {
    const def = getIntegrationDef(provider)
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${def?.name || provider} disconnected`)
      fetchConnections()
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const handleConfigure = (def: IntegrationDefinition, _connection: IntegrationConnection) => {
    setConfiguringProvider(def.id)
  }

  const connectedCount = connections.filter((c) => c.status === 'connected').length
  const totalCount = integrationRegistry.length

  return (
    <div className="space-y-7 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your tools to enrich transition data and automate workflows
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', connectedCount > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {connectedCount} of {totalCount} connected
            </span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Integration Groups */
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </h2>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[10px] text-muted-foreground/40">
                  {group.items.filter((d) => getConnection(d.id)?.status === 'connected').length}/{group.items.length} connected
                </span>
              </div>

              <div
                className={cn(
                  'grid gap-3',
                  group.items.length === 1 ? 'grid-cols-1 max-w-sm' :
                  group.items.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {group.items.map((def) => (
                  <IntegrationCard
                    key={def.id}
                    def={def}
                    connection={getConnection(def.id)}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onConfigure={handleConfigure}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Sheet */}
      <ConnectSheet
        def={connectingDef}
        onClose={() => setConnectingDef(null)}
        onConnected={fetchConnections}
      />

      {/* Configure Sheet */}
      <IntegrationConfigureSheet
        integrationId={configuringProvider}
        onClose={() => setConfiguringProvider(null)}
      />
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense>
      <IntegrationsContent />
    </Suspense>
  )
}

// Need to import this for totalCount
import { integrationRegistry } from '@/lib/integrations/registry'

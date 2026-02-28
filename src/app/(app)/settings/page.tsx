'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRole } from '@/lib/role-context'
import { cn } from '@/lib/utils'
import {
  User, Building2, Link2, CreditCard, Check, ExternalLink, Shield, Bell,
  Zap, Globe, Database, Mail, Calendar, MessageSquare, ArrowRight,
} from 'lucide-react'

const integrations = [
  { id: 'salesforce', name: 'Salesforce', description: 'Sync accounts, contacts, and opportunities', icon: Database, connected: true, status: 'Last synced 2h ago' },
  { id: 'hubspot', name: 'HubSpot', description: 'Import companies and deals from HubSpot CRM', icon: Database, connected: false, status: 'Not connected' },
  { id: 'slack', name: 'Slack', description: 'Get transition notifications in Slack channels', icon: MessageSquare, connected: true, status: 'Connected to #cs-transitions' },
  { id: 'google', name: 'Google Calendar', description: 'Sync handoff meetings and availability', icon: Calendar, connected: true, status: 'Connected' },
  { id: 'outlook', name: 'Microsoft Outlook', description: 'Calendar and email integration', icon: Mail, connected: false, status: 'Not connected' },
  { id: 'resend', name: 'Resend', description: 'Send transition emails through your domain', icon: Mail, connected: true, status: 'Sending from transitions@wealthsimple.com' },
]

const plans = [
  { name: 'Starter', price: '$0', period: '/mo', description: '1 rep, 50 accounts', features: ['1 team member', '50 accounts', '5 transitions/mo', 'Basic briefs'], current: false },
  { name: 'Team', price: '$49', period: '/seat/mo', description: 'For growing CS teams', features: ['Unlimited members', '2,000 accounts', 'Unlimited transitions', 'AI briefs & emails', 'Assignment engine', 'Analytics'], current: true },
  { name: 'Enterprise', price: 'Custom', period: '', description: 'For large organizations', features: ['Everything in Team', 'SSO / SAML', 'Custom integrations', 'Dedicated support', 'SLA guarantees', 'Audit log'], current: false },
]

export default function SettingsPage() {
  const { user } = useRole()
  const [notifications, setNotifications] = useState({
    transitions: true,
    briefs: true,
    emails: true,
    stalled: true,
    weeklyDigest: true,
    slackAlerts: true,
  })

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, organization, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="organization" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Organization</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 border border-border/40">
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">{user.avatar_initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.title}</p>
                  <button className="mt-1 text-[11px] text-primary hover:underline">Change avatar</button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Full Name</Label>
                  <Input defaultValue={user.name} className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Email</Label>
                  <Input defaultValue={user.email} className="h-9 text-[13px]" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Calendar Link</Label>
                  <Input defaultValue="https://cal.com/sarah-chen" className="h-9 text-[13px]" placeholder="https://calendly.com/..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Account Capacity</Label>
                  <Input defaultValue="400" type="number" className="h-9 text-[13px]" />
                </div>
              </div>
              <button
                onClick={() => toast.success('Settings saved', { description: 'Your changes have been applied.' })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'transitions' as const, label: 'Transition Updates', desc: 'Get notified when transitions are assigned, updated, or completed', icon: Zap },
                { key: 'briefs' as const, label: 'Brief Ready', desc: 'Notification when AI-generated briefs are ready for review', icon: Shield },
                { key: 'emails' as const, label: 'Email Activity', desc: 'Track when intro emails are opened or replied to', icon: Mail },
                { key: 'stalled' as const, label: 'Stall Alerts', desc: 'Alert when transitions have no activity for 7+ days', icon: Bell },
                { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of transition activity sent every Monday', icon: Calendar },
                { key: 'slackAlerts' as const, label: 'Slack Notifications', desc: 'Mirror critical alerts to your Slack DMs', icon: MessageSquare },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-3 row-hover">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Organization Name</Label>
                  <Input defaultValue="Wealthsimple" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Slug</Label>
                  <Input defaultValue="wealthsimple" disabled className="h-9 text-[13px] bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Default Account Capacity</Label>
                  <Input defaultValue="400" type="number" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Email Domain</Label>
                  <Input defaultValue="wealthsimple.com" className="h-9 text-[13px]" />
                </div>
              </div>
              <button
                onClick={() => toast.success('Organization saved', { description: 'Your organization details have been updated.' })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Organization
              </button>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Two-Factor Authentication', desc: 'Require 2FA for all team members', enabled: true },
                { label: 'SSO / SAML', desc: 'Enterprise single sign-on', enabled: false },
                { label: 'Session Timeout', desc: 'Auto-logout after 8 hours of inactivity', enabled: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-[12px] font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="grid gap-3 md:grid-cols-2">
            {integrations.map(integration => (
              <Card key={integration.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                      integration.connected ? 'bg-emerald-50' : 'bg-muted/50'
                    )}>
                      <integration.icon className={cn('h-5 w-5', integration.connected ? 'text-emerald-600' : 'text-muted-foreground/50')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold">{integration.name}</p>
                        {integration.connected && (
                          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">Connected</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{integration.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{integration.status}</p>
                    </div>
                    <button className={cn(
                      'rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors shrink-0',
                      integration.connected
                        ? 'border border-border hover:bg-muted'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}>
                      {integration.connected ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map(plan => (
              <Card key={plan.name} className={cn('card-hover relative overflow-hidden', plan.current && 'ring-2 ring-primary')}>
                {plan.current && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                )}
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    {plan.current && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px]">Current Plan</Badge>}
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-4">{plan.description}</p>
                  <div className="space-y-2 mb-5">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-[11px]">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={cn(
                    'w-full rounded-lg py-2 text-[12px] font-medium transition-colors',
                    plan.current ? 'border border-border text-muted-foreground cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}>
                    {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Team Members', used: 6, limit: 'Unlimited', pct: 0 },
                  { label: 'Accounts', used: 2000, limit: 2000, pct: 100 },
                  { label: 'AI Briefs Generated', used: 47, limit: 200, pct: 24 },
                  { label: 'Emails Sent', used: 89, limit: 500, pct: 18 },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium tabular-nums">{item.used.toLocaleString()} / {typeof item.limit === 'number' ? item.limit.toLocaleString() : item.limit}</span>
                    </div>
                    {item.pct > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', item.pct > 90 ? 'bg-red-500' : item.pct > 70 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${item.pct}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type CRMType = 'salesforce' | 'hubspot'
type CustomFieldType = 'text' | 'number' | 'date' | 'boolean'

interface CustomField {
  id: string
  crmName: string
  type: CustomFieldType
}

interface CRMConfigureProps {
  crm: CRMType
}

// ─── Core field definitions ───────────────────────────────────────────────────

const CORE_FIELDS: {
  relayName: string
  sfDefault: string
  hsDefault: string
  type: 'text' | 'number' | 'date' | 'category'
  isSegment?: boolean
}[] = [
  { relayName: 'Account Name',         sfDefault: 'Name',                   hsDefault: 'name',                type: 'text' },
  { relayName: 'Account Owner',        sfDefault: 'OwnerId',                hsDefault: 'hubspot_owner_id',    type: 'text' },
  { relayName: 'Annual Revenue (ARR)', sfDefault: 'AnnualRevenue',          hsDefault: 'annualrevenue',       type: 'number' },
  { relayName: 'Health Score',         sfDefault: 'Health_Score__c',        hsDefault: 'health_score',        type: 'number' },
  { relayName: 'Account Segment',      sfDefault: 'Account_Segment__c',     hsDefault: 'account_segment',     type: 'category', isSegment: true },
  { relayName: 'Industry',             sfDefault: 'Industry',               hsDefault: 'industry',            type: 'text' },
  { relayName: 'Region / Geography',   sfDefault: 'BillingCountry',         hsDefault: 'country',             type: 'text' },
  { relayName: 'Contract Renewal Date',sfDefault: 'Contract_End_Date__c',   hsDefault: 'contract_renewal_date', type: 'date' },
  { relayName: 'Customer Since',       sfDefault: 'Contract_Start_Date__c', hsDefault: 'createdate',          type: 'date' },
  { relayName: 'Last Activity Date',   sfDefault: 'LastActivityDate',       hsDefault: 'notes_last_updated',  type: 'date' },
  { relayName: 'Number of Seats',      sfDefault: 'Num_Seats__c',           hsDefault: 'num_seats',           type: 'number' },
  { relayName: 'CSM / Account Manager',sfDefault: 'CSM_Name__c',            hsDefault: 'csm_name',            type: 'text' },
]

function FieldTypeBadge({ type }: { type: 'text' | 'number' | 'date' | 'category' }) {
  const config = {
    text:     { label: 'Text',     className: 'bg-stone-100 text-stone-500' },
    number:   { label: 'Number',   className: 'bg-blue-100 text-blue-600' },
    date:     { label: 'Date',     className: 'bg-violet-100 text-violet-600' },
    category: { label: 'Category', className: 'bg-amber-100 text-amber-600' },
  }
  const { label, className } = config[type]
  return (
    <span className={cn('shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold', className)}>
      {label}
    </span>
  )
}

// ─── Tab 1: Connection & Sync ─────────────────────────────────────────────────

function ConnectionTab({ crm }: { crm: CRMType }) {
  const [syncFreq, setSyncFreq] = useState('15min')
  const [syncAccounts, setSyncAccounts] = useState(true)
  const [syncContacts, setSyncContacts] = useState(true)
  const [syncOpps, setSyncOpps] = useState(false)

  const isSF = crm === 'salesforce'

  return (
    <div className="space-y-6">
      {/* Connected account */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">
              Connected to {isSF ? 'Salesforce' : 'HubSpot'}
            </p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              {isSF
                ? 'Org: Wealthsimple (production) · Connected user: sarah.chen@wealthsimple.com'
                : 'Portal: Wealthsimple (ID: 12345678) · Connected user: sarah.chen@wealthsimple.com'}
            </p>
          </div>
          <button onClick={() => toast.success('Re-authenticated', { description: `${isSF ? 'Salesforce' : 'HubSpot'} credentials refreshed.` })} className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            Re-authenticate
          </button>
        </div>
      </div>

      {/* Sync frequency */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Sync Frequency
        </Label>
        <Select value={syncFreq} onValueChange={setSyncFreq}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">Real-time webhooks</SelectItem>
            <SelectItem value="15min">Every 15 minutes</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Objects to sync */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Objects to Sync
        </Label>
        <div className="space-y-2">
          {[
            { label: 'Accounts', desc: 'Core account data and ownership', value: syncAccounts, onChange: setSyncAccounts, required: true },
            { label: 'Contacts', desc: 'Key stakeholders and decision makers', value: syncContacts, onChange: setSyncContacts, required: false },
            { label: 'Opportunities', desc: 'Open and closed deals for context', value: syncOpps, onChange: setSyncOpps, required: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-medium">{item.label}</p>
                  {item.required && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch
                checked={item.value}
                disabled={item.required}
                onCheckedChange={item.required ? undefined : item.onChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Last sync + manual trigger */}
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <div>
          <p className="text-[12px] font-medium">Last full sync</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">2 minutes ago · 2,000 accounts, 4,200 contacts</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted transition-colors">
          <RefreshCw className="h-3 w-3" />
          Sync now
        </button>
      </div>
    </div>
  )
}

// ─── Tab 2: Field Mapping ─────────────────────────────────────────────────────

function FieldMappingTab({ crm }: { crm: CRMType }) {
  const isSF = crm === 'salesforce'

  const [mappings, setMappings] = useState<Record<string, string>>(
    Object.fromEntries(
      CORE_FIELDS.map(f => [f.relayName, isSF ? f.sfDefault : f.hsDefault])
    )
  )
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  const updateMapping = (relayName: string, value: string) => {
    setMappings(prev => ({ ...prev, [relayName]: value }))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, crmName: '', type: 'text' }])
  }

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Map {isSF ? 'Salesforce' : 'HubSpot'} field names to Relay's data model. Pre-filled with smart defaults — update any that differ in your org.
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Relay field</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Your {isSF ? 'Salesforce' : 'HubSpot'} field name
        </span>
      </div>

      {/* Core fields */}
      <div className="space-y-2.5">
        {CORE_FIELDS.map(field => (
          <div key={field.relayName} className="space-y-1.5">
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 min-w-0">
                <span className="text-[12px] text-foreground font-medium truncate flex-1 min-w-0">
                  {field.relayName}
                </span>
                <FieldTypeBadge type={field.type} />
              </div>
              <Input
                value={mappings[field.relayName] ?? ''}
                onChange={e => updateMapping(field.relayName, e.target.value)}
                className="h-9 text-[12px]"
                placeholder={isSF ? field.sfDefault : field.hsDefault}
              />
            </div>
            {field.isSegment && (
              <div className="ml-[calc(50%+8px)] flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-2.5 py-1.5">
                <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Values from this field become the segment filters on your dashboard (e.g. Commercial, Corporate, Enterprise).
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom fields */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold">Custom fields</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Additional CRM fields to include in transition briefs</p>
          </div>
          <button
            onClick={addCustomField}
            className="flex items-center gap-1 text-[12px] text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add field
          </button>
        </div>

        {customFields.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 italic">
            No custom fields yet. Add any CRM fields not covered above.
          </p>
        ) : (
          <div className="space-y-2">
            {customFields.map(field => (
              <div key={field.id} className="flex items-center gap-2 group">
                <Input
                  value={field.crmName}
                  onChange={e => updateCustomField(field.id, { crmName: e.target.value })}
                  placeholder="e.g. Territory, Product_Line__c, Churn_Probability__c"
                  className="flex-1 h-9 text-[12px]"
                />
                <Select
                  value={field.type}
                  onValueChange={v => updateCustomField(field.id, { type: v as CustomFieldType })}
                >
                  <SelectTrigger className="h-9 w-[100px] text-[11px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Yes / No</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeCustomField(field.id)}
                  className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  aria-label="Remove field"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: Filters ───────────────────────────────────────────────────────────

function FiltersTab() {
  const [recordTypes, setRecordTypes] = useState(['Customer'])
  const [minArr, setMinArr] = useState('')
  const [excludeSegments, setExcludeSegments] = useState<string[]>([])

  const allSegments = ['Commercial', 'Corporate', 'Enterprise', 'International', 'Fins']
  const allRecordTypes = ['Customer', 'Prospect', 'Partner', 'Churned']

  const toggleRecordType = (rt: string) => {
    setRecordTypes(prev =>
      prev.includes(rt) ? (prev.length > 1 ? prev.filter(r => r !== rt) : prev) : [...prev, rt]
    )
  }

  const toggleSegment = (seg: string) => {
    setExcludeSegments(prev =>
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Filter which records Relay syncs. This keeps your workspace focused on the accounts that matter.
      </p>

      {/* Record types */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Record types to sync
        </Label>
        <p className="text-[10px] text-muted-foreground/70">Only accounts with these record types will be synced</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {allRecordTypes.map(rt => (
            <button
              key={rt}
              onClick={() => toggleRecordType(rt)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
                recordTypes.includes(rt)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      {/* Min ARR */}
      <div className="space-y-2">
        <Label htmlFor="min-arr" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Minimum ARR threshold
        </Label>
        <p className="text-[10px] text-muted-foreground/70">Only sync accounts with ARR above this value (leave blank for no minimum)</p>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">$</span>
          <Input
            id="min-arr"
            type="number"
            value={minArr}
            onChange={e => setMinArr(e.target.value)}
            placeholder="e.g. 10000"
            className="h-9 text-[12px] max-w-[180px]"
          />
          <span className="text-[12px] text-muted-foreground">per year</span>
        </div>
      </div>

      {/* Exclude segments */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Exclude segments
        </Label>
        <p className="text-[10px] text-muted-foreground/70">Accounts in these segments will not be synced to Relay</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {allSegments.map(seg => (
            <button
              key={seg}
              onClick={() => toggleSegment(seg)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
                excludeSegments.includes(seg)
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {excludeSegments.includes(seg) ? '✕ ' : ''}{seg}
            </button>
          ))}
        </div>
        {excludeSegments.length > 0 && (
          <p className="text-[10px] text-muted-foreground/60">
            {excludeSegments.join(', ')} will be excluded from sync
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main CRM Configure component ─────────────────────────────────────────────

export function CRMConfigure({ crm }: CRMConfigureProps) {
  return (
    <Tabs defaultValue="connection" className="flex flex-col h-full">
      <TabsList className="shrink-0 w-full justify-start">
        <TabsTrigger value="connection" className="text-[12px]">Connection & Sync</TabsTrigger>
        <TabsTrigger value="mapping" className="text-[12px]">Field Mapping</TabsTrigger>
        <TabsTrigger value="filters" className="text-[12px]">Filters</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto mt-4">
        <TabsContent value="connection" className="mt-0">
          <ConnectionTab crm={crm} />
        </TabsContent>
        <TabsContent value="mapping" className="mt-0">
          <FieldMappingTab crm={crm} />
        </TabsContent>
        <TabsContent value="filters" className="mt-0">
          <FiltersTab />
        </TabsContent>
      </div>
    </Tabs>
  )
}

// ─── HubSpot not-connected state ──────────────────────────────────────────────

export function HubSpotConnect() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white text-2xl font-bold shadow-sm">
        H
      </div>
      <div className="space-y-2 max-w-sm">
        <p className="text-[15px] font-semibold">Connect HubSpot</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Connect your HubSpot portal to sync companies, contacts, and deals into Relay. You'll configure field mapping after connecting.
        </p>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        <button onClick={() => toast.success('HubSpot connected', { description: 'Syncing companies and deals…' })} className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-orange-600 transition-colors">
          Connect HubSpot →
        </button>
        <p className="text-[10px] text-muted-foreground/60">
          You'll be redirected to HubSpot to authorize the connection.
        </p>
      </div>
    </div>
  )
}

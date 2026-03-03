'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'category'
type CustomFieldType = 'text' | 'number' | 'date' | 'boolean'

interface CustomField {
  id: string
  gainsightName: string
  type: CustomFieldType
}

// ─── Core Gainsight fields ────────────────────────────────────────────────────

const GAINSIGHT_FIELDS: { relayName: string; gsDefault: string; type: FieldType }[] = [
  { relayName: 'Health Score',           gsDefault: 'health_score',          type: 'number' },
  { relayName: 'Risk Tier',              gsDefault: 'risk_tier',             type: 'category' },
  { relayName: 'Success Plan Status',    gsDefault: 'success_plan_status',   type: 'category' },
  { relayName: 'NPS Score',              gsDefault: 'nps_score',             type: 'number' },
  { relayName: 'Days Since Last QBR',    gsDefault: 'days_since_last_review',type: 'number' },
  { relayName: 'Executive Sponsor',      gsDefault: 'sponsor_name',          type: 'text' },
  { relayName: 'CSM Name',               gsDefault: 'csm_name',              type: 'text' },
]

function FieldTypeBadge({ type }: { type: FieldType }) {
  const config = {
    text:     { label: 'Text',     className: 'bg-stone-100 text-stone-500' },
    number:   { label: 'Number',   className: 'bg-blue-100 text-blue-600' },
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

function ConnectionTab() {
  const [syncFreq, setSyncFreq] = useState('15min')
  const [syncHealth, setSyncHealth] = useState(true)
  const [syncRisk, setSyncRisk] = useState(true)
  const [syncCSM, setSyncCSM] = useState(true)
  const [syncSuccessPlans, setSyncSuccessPlans] = useState(true)
  const [syncNPS, setSyncNPS] = useState(false)

  return (
    <div className="space-y-6">
      {/* Connected account */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-emerald-800">Connected to Gainsight</p>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              Instance: wealthsimple.gainsight.com · Connected user: sarah.chen@wealthsimple.com
            </p>
          </div>
          <button className="shrink-0 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
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

      {/* Data to sync */}
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Data to Sync
        </Label>
        <p className="text-[10px] text-muted-foreground/70">
          Choose which Gainsight data Relay reads when building transition briefs
        </p>
        <div className="space-y-2">
          {[
            { label: 'Health scores',        desc: 'Account health score and colour rating',          value: syncHealth,       onChange: setSyncHealth,       required: true },
            { label: 'Risk signals',         desc: 'Risk flags, churn risk indicators, red accounts', value: syncRisk,         onChange: setSyncRisk,         required: false },
            { label: 'CSM assignments',      desc: 'Current CSM and owner data',                      value: syncCSM,          onChange: setSyncCSM,          required: false },
            { label: 'Success plan status',  desc: 'Active, at-risk, or not started success plans',   value: syncSuccessPlans, onChange: setSyncSuccessPlans, required: false },
            { label: 'NPS scores',           desc: 'Most recent NPS survey result',                   value: syncNPS,          onChange: setSyncNPS,          required: false },
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

      {/* Last sync */}
      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <div>
          <p className="text-[12px] font-medium">Last sync</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">4 minutes ago · 2,000 health scores, 340 risk signals</p>
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

function FieldMappingTab() {
  const [mappings, setMappings] = useState<Record<string, string>>(
    Object.fromEntries(GAINSIGHT_FIELDS.map(f => [f.relayName, f.gsDefault]))
  )
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  const updateMapping = (relayName: string, value: string) => {
    setMappings(prev => ({ ...prev, [relayName]: value }))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: `cf-${Date.now()}`, gainsightName: '', type: 'text' }])
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
        Map Gainsight field names to Relay's data model. These fields are pulled into every transition brief automatically.
      </p>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Relay field</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your Gainsight field name</span>
      </div>

      {/* Core fields */}
      <div className="space-y-2.5">
        {GAINSIGHT_FIELDS.map(field => (
          <div key={field.relayName} className="grid grid-cols-2 gap-4 items-center">
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
              placeholder={field.gsDefault}
            />
          </div>
        ))}
      </div>

      {/* Custom fields */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold">Custom fields</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Additional Gainsight fields to include in briefs</p>
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
            No custom fields yet. Add any Gainsight fields not covered above.
          </p>
        ) : (
          <div className="space-y-2">
            {customFields.map(field => (
              <div key={field.id} className="flex items-center gap-2 group">
                <Input
                  value={field.gainsightName}
                  onChange={e => updateCustomField(field.id, { gainsightName: e.target.value })}
                  placeholder="e.g. adoption_score, tier_segment, product_usage"
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

// ─── Main component ───────────────────────────────────────────────────────────

export function GainsightConfigure() {
  return (
    <Tabs defaultValue="connection" className="flex flex-col h-full">
      <TabsList className="shrink-0 w-full justify-start">
        <TabsTrigger value="connection" className="text-[12px]">Connection & Sync</TabsTrigger>
        <TabsTrigger value="mapping" className="text-[12px]">Field Mapping</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto mt-4">
        <TabsContent value="connection" className="mt-0">
          <ConnectionTab />
        </TabsContent>
        <TabsContent value="mapping" className="mt-0">
          <FieldMappingTab />
        </TabsContent>
      </div>
    </Tabs>
  )
}

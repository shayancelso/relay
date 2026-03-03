'use client'

import { useState, useMemo } from 'react'
import { demoTeamMembers, demoAccounts, demoTransitions } from '@/lib/demo-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRole } from '@/lib/role-context'
import { useEquityRules } from '@/lib/equity-context'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Users,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Scale,
  CheckCircle2,
  Flame,
  UserX,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Cell,
  ScatterChart, Scatter, PieChart, Pie,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useTrialMode } from '@/lib/trial-context'
import { TrialPageEmpty } from '@/components/trial/trial-page-empty'

// ---------------------------------------------------------------------------
// Ramp + equity constants
// ---------------------------------------------------------------------------

// Current demo date — aligns with project date
const TODAY = new Date('2026-03-02')
const RAMP_MONTHS = 12
const RAMP_RECENTLY_COMPLETE_MONTHS = 3 // window after ramp ends to show "Just Ramped"
// Equity targets are now sourced from EquityProvider context (shared with Rules page)

type SortKey = 'arr' | 'accounts' | 'health' | 'utilization' | 'ramp' | 'name'
type SortDir = 'asc' | 'desc'
type RoleFilter = 'all' | 'rep' | 'manager' | 'admin'

function getRampInfo(createdAt: string, capacity: number, role: string) {
  const defaultOut = { isOnRamp: false, isRecentlyRamped: false, rampProgress: 100, monthsIn: 0 }
  // Only reps with active capacity have a ramp period
  if (role !== 'rep' || capacity === 0) return defaultOut

  const msElapsed = TODAY.getTime() - new Date(createdAt).getTime()
  const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 30.44)
  const progress = Math.min((monthsElapsed / RAMP_MONTHS) * 100, 100)
  const isOnRamp = monthsElapsed < RAMP_MONTHS
  const isRecentlyRamped =
    !isOnRamp && monthsElapsed < RAMP_MONTHS + RAMP_RECENTLY_COMPLETE_MONTHS

  return {
    isOnRamp,
    isRecentlyRamped,
    rampProgress: Math.round(progress),
    monthsIn: Math.max(1, Math.floor(monthsElapsed)), // show at least "Month 1"
  }
}

// ---------------------------------------------------------------------------
// Segment colors (shared across chart & legend)
// ---------------------------------------------------------------------------

const SEGMENT_COLORS: Record<string, { fill: string; label: string }> = {
  commercial:    { fill: '#38bdf8', label: 'Commercial' },
  corporate:     { fill: '#a78bfa', label: 'Corporate' },
  enterprise:    { fill: '#fbbf24', label: 'Enterprise' },
  fins:          { fill: '#34d399', label: 'FINS' },
  international: { fill: '#fb7185', label: 'International' },
}

const SEGMENT_KEYS = Object.keys(SEGMENT_COLORS) as Array<keyof typeof SEGMENT_COLORS>

// ---------------------------------------------------------------------------
// Book Distribution Chart — Types & Constants
// ---------------------------------------------------------------------------

type ChartMetric = 'arr' | 'accounts' | 'health' | 'utilization'
type ChartView = 'bar' | 'scatter' | 'donut'
type ColorBy = 'equity' | 'health' | 'ramp' | 'specialty'
type GroupBy = 'rep' | 'segment' | 'country'
type ScatterAxis = 'arr' | 'accounts' | 'health' | 'utilization'
type DonutDimension = 'segment' | 'country' | 'health'
type HealthTier = 'healthy' | 'at_risk' | 'critical'
type RampTier = 'on_ramp' | 'recently_ramped' | 'standard'

interface ChartFilters {
  segments: string[]
  country: string
  ramp: 'all' | 'on_ramp' | 'recently_ramped' | 'standard'
  health: 'all' | 'healthy' | 'at_risk' | 'critical'
}

const DEFAULT_FILTERS: ChartFilters = {
  segments: [],
  country: 'all',
  ramp: 'all',
  health: 'all',
}

const COUNTRY_COLORS: Record<string, string> = {
  'Canada': '#34d399', 'United States': '#38bdf8', 'United Kingdom': '#a78bfa',
  'Germany': '#fbbf24', 'Australia': '#fb7185', 'Japan': '#f97316',
  'Singapore': '#06b6d4', 'Brazil': '#84cc16', 'India': '#ec4899',
  'France': '#6366f1', 'Netherlands': '#14b8a6', 'Sweden': '#eab308',
  'Switzerland': '#8b5cf6',
}

const HEALTH_TIER_COLORS: Record<HealthTier, string> = {
  healthy: '#34d399', at_risk: '#fbbf24', critical: '#f87171',
}

const RAMP_TIER_COLORS: Record<RampTier, string> = {
  on_ramp: '#fbbf24', recently_ramped: '#34d399', standard: '#d6d3d1',
}

function getHealthTier(health: number): HealthTier {
  if (health >= 70) return 'healthy'
  if (health >= 50) return 'at_risk'
  return 'critical'
}

function getRampTier(isOnRamp: boolean, isRecentlyRamped: boolean): RampTier {
  if (isOnRamp) return 'on_ramp'
  if (isRecentlyRamped) return 'recently_ramped'
  return 'standard'
}

interface ChartEntry {
  name: string
  fullName: string
  value: number
  deviation: number
  flagged: boolean
  above: boolean
  commercial: number
  corporate: number
  enterprise: number
  fins: number
  international: number
  // Extended fields for new views
  rawArr: number
  rawAccounts: number
  rawHealth: number
  rawUtilization: number
  healthTier: HealthTier
  rampTier: RampTier
  primarySpecialty: string
  hasEquityFlag: boolean
  segmentTarget?: number  // for absolute metrics: the segment-specific target for this rep
}

interface GroupedEntry {
  name: string
  value: number
  fill: string
}

interface ScatterEntry {
  x: number
  y: number
  fullName: string
  primarySegment: string
  hasEquityFlag: boolean
  rawArr: number
  rawAccounts: number
  rawHealth: number
  rawUtilization: number
}

interface DonutEntry {
  name: string
  value: number
  fill: string
}

const METRIC_OPTS: { key: ChartMetric; label: string }[] = [
  { key: 'arr', label: 'ARR' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'health', label: 'Health' },
  { key: 'utilization', label: 'Utilization' },
]

const VIEW_OPTS: { key: ChartView; label: string }[] = [
  { key: 'bar', label: 'Bar' },
  { key: 'scatter', label: 'Scatter' },
  { key: 'donut', label: 'Donut' },
]

const RAMP_FILTER_OPTS: { key: ChartFilters['ramp']; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'on_ramp', label: 'On Ramp' },
  { key: 'recently_ramped', label: 'Just Ramped' },
  { key: 'standard', label: 'Standard' },
]

const HEALTH_FILTER_OPTS: { key: ChartFilters['health']; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'critical', label: 'Critical' },
]

function BookDistributionChart({
  enrichedData,
  meanArr,
  meanAccounts,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrichedData: any[]
  meanArr: number
  meanAccounts: number
}) {
  // View + metric
  const [chartView, setChartView] = useState<ChartView>('bar')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('arr')

  // Bar-specific
  const [showSegmentStack, setShowSegmentStack] = useState(false)
  const [showEquityBands, setShowEquityBands] = useState(true)
  const [colorBy, setColorBy] = useState<ColorBy>('equity')
  const [groupBy, setGroupBy] = useState<GroupBy>('rep')

  // Scatter
  const [scatterX, setScatterX] = useState<ScatterAxis>('arr')
  const [scatterY, setScatterY] = useState<ScatterAxis>('health')

  // Donut
  const [donutDimension, setDonutDimension] = useState<DonutDimension>('segment')

  // Filters
  const [filters, setFilters] = useState<ChartFilters>({ ...DEFAULT_FILTERS })
  const [showFilters, setShowFilters] = useState(false)

  const { getMetricTarget } = useEquityRules()
  const metricTarget = getMetricTarget(chartMetric)
  const hasEquityRules = metricTarget !== null
  const isAbsoluteMetric = metricTarget?.targetType === 'absolute'
  const tolerance = metricTarget?.tolerance ?? 0
  const isGrouped = groupBy !== 'rep'

  // Active filter count for badge
  const activeFilterCount =
    (filters.segments.length > 0 ? 1 : 0) +
    (filters.country !== 'all' ? 1 : 0) +
    (filters.ramp !== 'all' ? 1 : 0) +
    (filters.health !== 'all' ? 1 : 0)

  // ── Available countries (stable, depends only on enrichedData) ──────────
  const availableCountries = useMemo(() => {
    const activeReps = enrichedData.filter(m => m.role === 'rep' && m.capacity > 0)
    const repIds = new Set(activeReps.map(m => m.id))
    const countries = new Set<string>()
    for (const a of demoAccounts) {
      if (a.current_owner_id && repIds.has(a.current_owner_id) && a.country) {
        countries.add(a.country)
      }
    }
    return Array.from(countries).sort()
  }, [enrichedData])

  // ── Filtered reps (applies 4 filter dimensions) ─────────────────────────
  const filteredReps = useMemo(() => {
    const activeReps = enrichedData.filter(m => m.role === 'rep' && m.capacity > 0)

    return activeReps.filter(m => {
      // Health filter
      if (filters.health !== 'all') {
        const tier = getHealthTier(m.avgHealth)
        if (tier !== filters.health) return false
      }

      // Ramp filter
      if (filters.ramp !== 'all') {
        const tier = getRampTier(m.isOnRamp, m.isRecentlyRamped)
        if (tier !== filters.ramp) return false
      }

      // Segment + country filters require checking the rep's accounts
      if (filters.segments.length > 0 || filters.country !== 'all') {
        const repAccounts = demoAccounts.filter(a => a.current_owner_id === m.id)

        if (filters.segments.length > 0) {
          const hasMatchingSegment = repAccounts.some(a => filters.segments.includes(a.segment))
          if (!hasMatchingSegment) return false
        }

        if (filters.country !== 'all') {
          const hasMatchingCountry = repAccounts.some(a => a.country === filters.country)
          if (!hasMatchingCountry) return false
        }
      }

      return true
    })
  }, [enrichedData, filters])

  // ── Chart data (all shapes) ─────────────────────────────────────────────
  const {
    repEntries,
    groupedEntries,
    scatterEntries,
    donutEntries,
    filteredMean,
  } = useMemo(() => {
    const getMetricValue = (m: typeof filteredReps[0]) => {
      if (chartMetric === 'arr') return m.totalArr
      if (chartMetric === 'accounts') return m.accountCount
      if (chartMetric === 'health') return m.avgHealth
      return m.utilization
    }

    const fMean = filteredReps.length > 0
      ? filteredReps.reduce((s, m) => s + getMetricValue(m), 0) / filteredReps.length
      : 0

    // Per-rep entries
    const reps: ChartEntry[] = filteredReps
      .map(m => {
        const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
        const value = getMetricValue(m)

        // Primary specialty = most accounts segment
        const segCounts: Record<string, number> = {}
        for (const a of accounts) segCounts[a.segment] = (segCounts[a.segment] || 0) + 1
        const primarySpecialty = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'commercial'

        // Compute deviation + flagging based on target type
        let deviation = 0
        let flagged = false
        let segTarget: number | undefined

        if (isAbsoluteMetric && metricTarget && metricTarget.defaultTarget !== undefined) {
          // Absolute mode: compare against segment-specific target
          segTarget = metricTarget.segmentTargets?.[primarySpecialty]?.target ?? metricTarget.defaultTarget
          deviation = value - segTarget
          flagged = Math.abs(deviation) > metricTarget.tolerance
        } else if (hasEquityRules) {
          // Mean-relative mode
          const mean = chartMetric === 'arr' ? meanArr : chartMetric === 'accounts' ? meanAccounts : 0
          deviation = mean > 0 ? ((value - mean) / mean) * 100 : 0
          flagged = Math.abs(deviation / 100) > tolerance
        }

        const segBreakdown: Record<string, number> = { commercial: 0, corporate: 0, enterprise: 0, fins: 0, international: 0 }
        for (const a of accounts) {
          if (chartMetric === 'arr') segBreakdown[a.segment] += a.arr
          else segBreakdown[a.segment] += 1
        }

        return {
          name: m.full_name.split(' ')[0],
          fullName: m.full_name,
          value,
          deviation: Math.round(deviation),
          flagged,
          above: deviation > 0,
          rawArr: m.totalArr,
          rawAccounts: m.accountCount,
          rawHealth: m.avgHealth,
          rawUtilization: m.utilization,
          healthTier: getHealthTier(m.avgHealth),
          rampTier: getRampTier(m.isOnRamp, m.isRecentlyRamped),
          primarySpecialty,
          hasEquityFlag: m.hasEquityFlag,
          segmentTarget: segTarget,
          ...segBreakdown,
        } as ChartEntry
      })
      .sort((a, b) => b.value - a.value)

    // Grouped entries
    const grouped: GroupedEntry[] = (() => {
      if (groupBy === 'segment') {
        return SEGMENT_KEYS.map(seg => {
          const matching = filteredReps.filter(m => {
            const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
            return accounts.some(a => a.segment === seg)
          })
          let value = 0
          if (chartMetric === 'arr') {
            for (const m of matching) {
              const accounts = demoAccounts.filter(a => a.current_owner_id === m.id && a.segment === seg)
              value += accounts.reduce((s, a) => s + a.arr, 0)
            }
          } else if (chartMetric === 'accounts') {
            for (const m of matching) {
              value += demoAccounts.filter(a => a.current_owner_id === m.id && a.segment === seg).length
            }
          } else {
            // health / utilization: avg across matching reps
            value = matching.length > 0 ? Math.round(matching.reduce((s, m) => s + getMetricValue(m), 0) / matching.length) : 0
          }
          return { name: SEGMENT_COLORS[seg].label, value, fill: SEGMENT_COLORS[seg].fill }
        }).filter(e => e.value > 0)
      }
      if (groupBy === 'country') {
        const countryMap: Record<string, number> = {}
        for (const m of filteredReps) {
          const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
          for (const a of accounts) {
            const c = a.country || 'Unknown'
            if (chartMetric === 'arr') countryMap[c] = (countryMap[c] || 0) + a.arr
            else if (chartMetric === 'accounts') countryMap[c] = (countryMap[c] || 0) + 1
          }
        }
        if (chartMetric === 'health' || chartMetric === 'utilization') {
          // Group reps by primary country, average their metric
          const countryReps: Record<string, number[]> = {}
          for (const m of filteredReps) {
            const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
            const countryCounts: Record<string, number> = {}
            for (const a of accounts) countryCounts[a.country || 'Unknown'] = (countryCounts[a.country || 'Unknown'] || 0) + 1
            const primary = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
            if (!countryReps[primary]) countryReps[primary] = []
            countryReps[primary].push(getMetricValue(m))
          }
          for (const [c, vals] of Object.entries(countryReps)) {
            countryMap[c] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
          }
        }
        return Object.entries(countryMap)
          .map(([name, value]) => ({ name, value, fill: COUNTRY_COLORS[name] || '#94a3b8' }))
          .sort((a, b) => b.value - a.value)
      }
      return []
    })()

    // Scatter entries
    const getAxisValue = (m: typeof filteredReps[0], axis: ScatterAxis) => {
      if (axis === 'arr') return m.totalArr
      if (axis === 'accounts') return m.accountCount
      if (axis === 'health') return m.avgHealth
      return m.utilization
    }
    const scatter: ScatterEntry[] = filteredReps.map(m => {
      const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
      const segCounts: Record<string, number> = {}
      for (const a of accounts) segCounts[a.segment] = (segCounts[a.segment] || 0) + 1
      const primarySegment = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'commercial'

      return {
        x: getAxisValue(m, scatterX),
        y: getAxisValue(m, scatterY),
        fullName: m.full_name,
        primarySegment,
        hasEquityFlag: m.hasEquityFlag,
        rawArr: m.totalArr,
        rawAccounts: m.accountCount,
        rawHealth: m.avgHealth,
        rawUtilization: m.utilization,
      }
    })

    // Donut entries
    const donut: DonutEntry[] = (() => {
      if (donutDimension === 'segment') {
        return SEGMENT_KEYS.map(seg => {
          let val = 0
          for (const m of filteredReps) {
            const accounts = demoAccounts.filter(a => a.current_owner_id === m.id && a.segment === seg)
            if (chartMetric === 'arr') val += accounts.reduce((s, a) => s + a.arr, 0)
            else if (chartMetric === 'accounts') val += accounts.length
            else {
              // health/utilization: avg of reps whose primary seg matches
              // (simpler: sum segment accounts for arr/accounts, use rep avg for health/util)
            }
          }
          if ((chartMetric === 'health' || chartMetric === 'utilization') && val === 0) {
            const matching = filteredReps.filter(m => {
              const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
              const segCounts: Record<string, number> = {}
              for (const a of accounts) segCounts[a.segment] = (segCounts[a.segment] || 0) + 1
              const primary = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
              return primary === seg
            })
            val = matching.length
          }
          return { name: SEGMENT_COLORS[seg].label, value: val, fill: SEGMENT_COLORS[seg].fill }
        }).filter(e => e.value > 0)
      }
      if (donutDimension === 'country') {
        const countryMap: Record<string, number> = {}
        for (const m of filteredReps) {
          const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
          for (const a of accounts) {
            const c = a.country || 'Unknown'
            if (chartMetric === 'arr') countryMap[c] = (countryMap[c] || 0) + a.arr
            else countryMap[c] = (countryMap[c] || 0) + 1
          }
        }
        if (chartMetric === 'health' || chartMetric === 'utilization') {
          // Just use rep count per primary country
          const cleared: Record<string, number> = {}
          for (const m of filteredReps) {
            const accounts = demoAccounts.filter(a => a.current_owner_id === m.id)
            const countryCounts: Record<string, number> = {}
            for (const a of accounts) countryCounts[a.country || 'Unknown'] = (countryCounts[a.country || 'Unknown'] || 0) + 1
            const primary = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
            cleared[primary] = (cleared[primary] || 0) + 1
          }
          Object.assign(countryMap, cleared)
        }
        return Object.entries(countryMap)
          .map(([name, value]) => ({ name, value, fill: COUNTRY_COLORS[name] || '#94a3b8' }))
          .sort((a, b) => b.value - a.value)
      }
      if (donutDimension === 'health') {
        const tiers: Record<HealthTier, number> = { healthy: 0, at_risk: 0, critical: 0 }
        for (const m of filteredReps) {
          tiers[getHealthTier(m.avgHealth)] += 1
        }
        return [
          { name: 'Healthy (70+)', value: tiers.healthy, fill: HEALTH_TIER_COLORS.healthy },
          { name: 'At Risk (50-69)', value: tiers.at_risk, fill: HEALTH_TIER_COLORS.at_risk },
          { name: 'Critical (<50)', value: tiers.critical, fill: HEALTH_TIER_COLORS.critical },
        ].filter(e => e.value > 0)
      }
      return []
    })()

    return { repEntries: reps, groupedEntries: grouped, scatterEntries: scatter, donutEntries: donut, filteredMean: fMean }
  }, [filteredReps, chartMetric, meanArr, meanAccounts, hasEquityRules, tolerance, isAbsoluteMetric, metricTarget, groupBy, scatterX, scatterY, donutDimension])

  // Derived values for bar view
  const meanValue = isAbsoluteMetric
    ? (metricTarget?.defaultTarget ?? 0)
    : (chartMetric === 'arr' ? meanArr : meanAccounts)
  const lowerBound = isAbsoluteMetric
    ? meanValue - (metricTarget?.tolerance ?? 0)
    : meanValue * (1 - tolerance)
  const upperBound = isAbsoluteMetric
    ? meanValue + (metricTarget?.tolerance ?? 0)
    : meanValue * (1 + tolerance)
  const aboveCount = repEntries.filter(d => d.flagged && d.above).length
  const belowCount = repEntries.filter(d => d.flagged && !d.above).length
  const balancedCount = repEntries.length - aboveCount - belowCount

  // ── Formatting helpers ──────────────────────────────────────────────────
  const formatYAxis = (v: number) => {
    if (chartMetric === 'arr') {
      if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
      if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
      return `$${v}`
    }
    if (chartMetric === 'utilization') return `${v}%`
    return String(v)
  }

  const formatMetricValue = (v: number) => {
    if (chartMetric === 'arr') return formatCurrency(v)
    if (chartMetric === 'utilization') return `${v}%`
    return String(v)
  }

  const formatAxisLabel = (axis: ScatterAxis) => {
    if (axis === 'arr') return 'ARR'
    if (axis === 'accounts') return 'Accounts'
    if (axis === 'health') return 'Health Score'
    return 'Utilization %'
  }

  const formatAxisValue = (v: number, axis: ScatterAxis) => {
    if (axis === 'arr') return formatCurrency(v)
    if (axis === 'utilization') return `${v}%`
    return String(v)
  }

  // Bar color by mode
  const getBarColor = (entry: ChartEntry) => {
    if (colorBy === 'health') return HEALTH_TIER_COLORS[entry.healthTier]
    if (colorBy === 'ramp') return RAMP_TIER_COLORS[entry.rampTier]
    if (colorBy === 'specialty') return SEGMENT_COLORS[entry.primarySpecialty]?.fill || '#94a3b8'
    // equity (default)
    return entry.flagged ? (entry.above ? '#f59e0b' : '#38bdf8') : '#d6d3d1'
  }

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS })

  const toggleSegmentFilter = (seg: string) => {
    setFilters(prev => ({
      ...prev,
      segments: prev.segments.includes(seg)
        ? prev.segments.filter(s => s !== seg)
        : [...prev.segments, seg],
    }))
  }

  // ── Mini select helper for inline dropdowns ─────────────────────────────
  const MiniSelect = ({ value, onValueChange, options, className }: {
    value: string
    onValueChange: (v: string) => void
    options: { key: string; label: string }[]
    className?: string
  }) => (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className={cn('h-7 text-[11px] font-medium gap-1 px-2 border-border/60 bg-background min-w-0', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.key} value={o.key} className="text-[12px]">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-3">

        {/* ── ROW 1: View pills + Metric pills + Filter toggle ──────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View pills */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {VIEW_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setChartView(key)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  chartView === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Metric pills */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {METRIC_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setChartMetric(key)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  chartMetric === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter toggle with badge */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ml-auto',
              showFilters
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── ROW 2: Contextual controls per view ──────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {chartView === 'bar' && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Color:</span>
                <MiniSelect
                  value={colorBy}
                  onValueChange={v => setColorBy(v as ColorBy)}
                  options={[
                    { key: 'equity', label: 'Equity flags' },
                    { key: 'health', label: 'Health tier' },
                    { key: 'ramp', label: 'Ramp status' },
                    { key: 'specialty', label: 'Specialty' },
                  ]}
                  className="w-[120px]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Group:</span>
                <MiniSelect
                  value={groupBy}
                  onValueChange={v => setGroupBy(v as GroupBy)}
                  options={[
                    { key: 'rep', label: 'Per Rep' },
                    { key: 'segment', label: 'By Segment' },
                    { key: 'country', label: 'By Country' },
                  ]}
                  className="w-[110px]"
                />
              </div>

              {!isGrouped && (
                <>
                  <button
                    onClick={() => setShowSegmentStack(v => !v)}
                    disabled={!hasEquityRules}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                      !hasEquityRules && 'opacity-40 cursor-not-allowed',
                      showSegmentStack && hasEquityRules
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    ◧ Segments
                  </button>

                  <button
                    onClick={() => setShowEquityBands(v => !v)}
                    disabled={!hasEquityRules}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
                      !hasEquityRules && 'opacity-40 cursor-not-allowed',
                      showEquityBands && hasEquityRules
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    ⚖ Equity Bands
                  </button>
                </>
              )}
            </>
          )}

          {chartView === 'scatter' && (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>X:</span>
                <MiniSelect
                  value={scatterX}
                  onValueChange={v => setScatterX(v as ScatterAxis)}
                  options={[
                    { key: 'arr', label: 'ARR' },
                    { key: 'accounts', label: 'Accounts' },
                    { key: 'health', label: 'Health' },
                    { key: 'utilization', label: 'Utilization' },
                  ]}
                  className="w-[100px]"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Y:</span>
                <MiniSelect
                  value={scatterY}
                  onValueChange={v => setScatterY(v as ScatterAxis)}
                  options={[
                    { key: 'arr', label: 'ARR' },
                    { key: 'accounts', label: 'Accounts' },
                    { key: 'health', label: 'Health' },
                    { key: 'utilization', label: 'Utilization' },
                  ]}
                  className="w-[100px]"
                />
              </div>
              {scatterX === scatterY && (
                <span className="text-[10px] text-amber-600 italic">Select different axes to see spread</span>
              )}
            </>
          )}

          {chartView === 'donut' && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Slice by:</span>
              <MiniSelect
                value={donutDimension}
                onValueChange={v => setDonutDimension(v as DonutDimension)}
                options={[
                  { key: 'segment', label: 'Segment' },
                  { key: 'country', label: 'Country' },
                  { key: 'health', label: 'Health Tier' },
                ]}
                className="w-[120px]"
              />
            </div>
          )}
        </div>

        {/* ── Filter panel (collapsible) ───────────────────────────────── */}
        {showFilters && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
            {/* Segment chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium w-14 shrink-0">Segment</span>
              {SEGMENT_KEYS.map(seg => (
                <button
                  key={seg}
                  onClick={() => toggleSegmentFilter(seg)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
                    filters.segments.includes(seg)
                      ? 'text-white border-transparent'
                      : 'bg-background text-muted-foreground border-border/60 hover:bg-muted/40'
                  )}
                  style={filters.segments.includes(seg) ? { backgroundColor: SEGMENT_COLORS[seg].fill } : undefined}
                >
                  {SEGMENT_COLORS[seg].label}
                </button>
              ))}
            </div>

            {/* Country dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium w-14 shrink-0">Country</span>
              <MiniSelect
                value={filters.country}
                onValueChange={v => setFilters(prev => ({ ...prev, country: v }))}
                options={[
                  { key: 'all', label: 'All countries' },
                  ...availableCountries.map(c => ({ key: c, label: c })),
                ]}
                className="w-[160px]"
              />
            </div>

            {/* Ramp pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium w-14 shrink-0">Ramp</span>
              <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background">
                {RAMP_FILTER_OPTS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilters(prev => ({ ...prev, ramp: key }))}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                      filters.ramp === key
                        ? 'bg-stone-800 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Health pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium w-14 shrink-0">Health</span>
              <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background">
                {HEALTH_FILTER_OPTS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilters(prev => ({ ...prev, health: key }))}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                      filters.health === key
                        ? 'bg-stone-800 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-auto"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {filteredReps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[320px] text-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">No reps match these filters</p>
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              Clear chart filters
            </button>
          </div>
        ) : (
          <>
            {/* ── BAR CHART ──────────────────────────────────────────── */}
            {chartView === 'bar' && !isGrouped && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={repEntries} barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  {showEquityBands && hasEquityRules && (
                    <ReferenceLine
                      y={meanValue}
                      stroke="#78716c"
                      strokeDasharray="6 4"
                      label={{ value: isAbsoluteMetric ? 'Target' : 'Mean', position: 'right', fontSize: 10, fill: '#78716c' }}
                    />
                  )}
                  {showEquityBands && hasEquityRules && (
                    <ReferenceArea y1={lowerBound} y2={upperBound} fill="#059669" fillOpacity={0.06} />
                  )}
                  {/* Per-segment target dashed lines (absolute metrics only) */}
                  {showEquityBands && isAbsoluteMetric && metricTarget?.segmentTargets && Object.entries(metricTarget.segmentTargets).map(([seg, { target }]) => (
                    <ReferenceLine
                      key={seg}
                      y={target}
                      stroke={SEGMENT_COLORS[seg]?.fill || '#94a3b8'}
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                    />
                  ))}
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as ChartEntry
                      return (
                        <div className="bg-white border border-stone-200 shadow-md rounded-lg px-3 py-2 text-[12px]">
                          <p className="font-semibold text-foreground">{d.fullName}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {formatAxisLabel(chartMetric)}:{' '}
                            <span className="font-semibold text-foreground">{formatMetricValue(d.value)}</span>
                          </p>
                          {hasEquityRules && isAbsoluteMetric && d.segmentTarget !== undefined && (
                            <p className={cn('mt-0.5', d.flagged ? (d.above ? 'text-amber-600' : 'text-sky-600') : 'text-muted-foreground')}>
                              Target: {d.segmentTarget} ({SEGMENT_COLORS[d.primarySpecialty]?.label || d.primarySpecialty})
                              {' · '}{d.deviation > 0 ? '+' : ''}{d.deviation} from target
                              {d.flagged && ' ⚠'}
                            </p>
                          )}
                          {hasEquityRules && !isAbsoluteMetric && (
                            <p className={cn('mt-0.5', d.flagged ? (d.above ? 'text-amber-600' : 'text-sky-600') : 'text-muted-foreground')}>
                              {d.deviation > 0 ? '+' : ''}{d.deviation}% from mean
                              {d.flagged && (d.above ? ' ⚠' : ' ↓')}
                            </p>
                          )}
                          {showSegmentStack && hasEquityRules && (
                            <div className="mt-1.5 pt-1.5 border-t border-stone-100 space-y-0.5">
                              {SEGMENT_KEYS.map(seg => {
                                const v = d[seg as keyof ChartEntry] as number
                                if (!v) return null
                                return (
                                  <div key={seg} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEGMENT_COLORS[seg].fill }} />
                                      <span className="text-muted-foreground">{SEGMENT_COLORS[seg].label}</span>
                                    </div>
                                    <span className="font-medium tabular-nums text-foreground">
                                      {chartMetric === 'arr' ? formatCurrency(v) : v}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  {showSegmentStack && hasEquityRules ? (
                    <>
                      <Bar dataKey="commercial" stackId="seg" fill="#38bdf8" />
                      <Bar dataKey="corporate" stackId="seg" fill="#a78bfa" />
                      <Bar dataKey="enterprise" stackId="seg" fill="#fbbf24" />
                      <Bar dataKey="fins" stackId="seg" fill="#34d399" />
                      <Bar dataKey="international" stackId="seg" fill="#fb7185" radius={[2, 2, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {repEntries.map((entry, i) => (
                        <Cell key={i} fill={getBarColor(entry)} />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* ── BAR CHART — Grouped mode ───────────────────────────── */}
            {chartView === 'bar' && isGrouped && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={groupedEntries} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={groupBy === 'country' ? -45 : 0}
                    textAnchor={groupBy === 'country' ? 'end' : 'middle'}
                    height={groupBy === 'country' ? 60 : 30}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as GroupedEntry
                      return (
                        <div className="bg-white border border-stone-200 shadow-md rounded-lg px-3 py-2 text-[12px]">
                          <p className="font-semibold text-foreground">{d.name}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {formatAxisLabel(chartMetric)}:{' '}
                            <span className="font-semibold text-foreground">{formatMetricValue(d.value)}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {groupedEntries.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* ── SCATTER CHART ──────────────────────────────────────── */}
            {chartView === 'scatter' && (
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name={formatAxisLabel(scatterX)}
                    tickFormatter={v => formatAxisValue(v, scatterX)}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: formatAxisLabel(scatterX), position: 'insideBottom', offset: -5, fontSize: 11, fill: '#78716c' }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name={formatAxisLabel(scatterY)}
                    tickFormatter={v => formatAxisValue(v, scatterY)}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: formatAxisLabel(scatterY), angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#78716c' }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as ScatterEntry
                      return (
                        <div className="bg-white border border-stone-200 shadow-md rounded-lg px-3 py-2 text-[12px]">
                          <p className="font-semibold text-foreground">{d.fullName}</p>
                          <div className="mt-1 space-y-0.5 text-muted-foreground">
                            <p>ARR: <span className="font-semibold text-foreground">{formatCurrency(d.rawArr)}</span></p>
                            <p>Accounts: <span className="font-semibold text-foreground">{d.rawAccounts}</span></p>
                            <p>Health: <span className="font-semibold text-foreground">{d.rawHealth}</span></p>
                            <p>Utilization: <span className="font-semibold text-foreground">{d.rawUtilization}%</span></p>
                          </div>
                          {d.hasEquityFlag && (
                            <p className="mt-1 text-amber-600 text-[11px]">⚠ Equity flagged</p>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Scatter data={scatterEntries} fill="#d6d3d1">
                    {scatterEntries.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={SEGMENT_COLORS[entry.primarySegment]?.fill || '#94a3b8'}
                        stroke={entry.hasEquityFlag ? '#f59e0b' : 'transparent'}
                        strokeWidth={entry.hasEquityFlag ? 2 : 0}
                        r={6}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {/* ── DONUT CHART ────────────────────────────────────────── */}
            {chartView === 'donut' && (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={donutEntries}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={(props: PieLabelRenderProps) => `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#a8a29e', strokeWidth: 1 }}
                  >
                    {donutEntries.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as DonutEntry
                      return (
                        <div className="bg-white border border-stone-200 shadow-md rounded-lg px-3 py-2 text-[12px]">
                          <p className="font-semibold text-foreground">{d.name}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {formatAxisLabel(chartMetric)}:{' '}
                            <span className="font-semibold text-foreground">{formatMetricValue(d.value)}</span>
                          </p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {/* ── Footer: legends + summary (contextual per view) ──────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Bar view: equity summary */}
          {chartView === 'bar' && !isGrouped && hasEquityRules && showEquityBands && colorBy === 'equity' && (
            <div className="flex items-center gap-3 text-[11px]">
              {aboveCount > 0 && (
                <span className="text-amber-600 font-medium">
                  ⚠ {aboveCount} above {isAbsoluteMetric ? 'target' : 'tolerance'}
                </span>
              )}
              {belowCount > 0 && (
                <>
                  {aboveCount > 0 && <span className="text-muted-foreground/40">·</span>}
                  <span className="text-sky-600 font-medium">
                    ↓ {belowCount} below {isAbsoluteMetric ? 'target' : 'tolerance'}
                  </span>
                </>
              )}
              {balancedCount > 0 && (
                <>
                  {(aboveCount > 0 || belowCount > 0) && <span className="text-muted-foreground/40">·</span>}
                  <span className="text-emerald-600 font-medium">
                    ✓ {balancedCount} {isAbsoluteMetric ? 'on target' : 'balanced'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Bar view: color-by legend */}
          {chartView === 'bar' && !isGrouped && !showSegmentStack && (
            <div className="flex items-center gap-3 text-[11px] ml-auto">
              {colorBy === 'equity' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-amber-500" />
                    <span className="text-muted-foreground">Above</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-sky-500" />
                    <span className="text-muted-foreground">Below</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-stone-300" />
                    <span className="text-muted-foreground">In range</span>
                  </div>
                </>
              )}
              {colorBy === 'health' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: HEALTH_TIER_COLORS.healthy }} />
                    <span className="text-muted-foreground">Healthy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: HEALTH_TIER_COLORS.at_risk }} />
                    <span className="text-muted-foreground">At Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: HEALTH_TIER_COLORS.critical }} />
                    <span className="text-muted-foreground">Critical</span>
                  </div>
                </>
              )}
              {colorBy === 'ramp' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RAMP_TIER_COLORS.on_ramp }} />
                    <span className="text-muted-foreground">On Ramp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RAMP_TIER_COLORS.recently_ramped }} />
                    <span className="text-muted-foreground">Just Ramped</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RAMP_TIER_COLORS.standard }} />
                    <span className="text-muted-foreground">Standard</span>
                  </div>
                </>
              )}
              {colorBy === 'specialty' && SEGMENT_KEYS.map(seg => (
                <div key={seg} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEGMENT_COLORS[seg].fill }} />
                  <span className="text-muted-foreground">{SEGMENT_COLORS[seg].label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bar view: segment stack legend */}
          {chartView === 'bar' && !isGrouped && showSegmentStack && hasEquityRules && (
            <div className="flex items-center gap-3 text-[11px] ml-auto">
              {SEGMENT_KEYS.map(seg => (
                <div key={seg} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEGMENT_COLORS[seg].fill }} />
                  <span className="text-muted-foreground">{SEGMENT_COLORS[seg].label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scatter view: segment legend + equity flag indicator */}
          {chartView === 'scatter' && (
            <div className="flex items-center gap-3 text-[11px]">
              {SEGMENT_KEYS.map(seg => (
                <div key={seg} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEGMENT_COLORS[seg].fill }} />
                  <span className="text-muted-foreground">{SEGMENT_COLORS[seg].label}</span>
                </div>
              ))}
              <span className="text-muted-foreground/40">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border-2 border-amber-500 bg-transparent" />
                <span className="text-muted-foreground">Equity flagged</span>
              </div>
            </div>
          )}

          {/* Donut view: slice legend */}
          {chartView === 'donut' && (
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              {donutEntries.map(entry => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatMetricValue(entry.value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filtered rep count + mean */}
          {activeFilterCount > 0 && filteredReps.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-auto">
              <span>{filteredReps.length} reps shown</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Mean: {formatMetricValue(Math.round(filteredMean))}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const { role } = useRole()
  const { isTrialMode, enterDemoMode } = useTrialMode()
  const { getMetricTarget } = useEquityRules()

  const [sortKey,          setSortKey]          = useState<SortKey>('arr')
  const [sortDir,          setSortDir]          = useState<SortDir>('desc')
  const [filterRole,       setFilterRole]       = useState<RoleFilter>('all')
  const [showOnRampOnly,   setShowOnRampOnly]   = useState(false)
  const [showFlaggedOnly,  setShowFlaggedOnly]  = useState(false)
  const [showChart,        setShowChart]        = useState(false)

  // ── Compute enriched per-member data ──────────────────────────────────────
  const teamData = useMemo(() => {
    return demoTeamMembers.map(member => {
      const accounts = demoAccounts.filter(a => a.current_owner_id === member.id)
      const activeTransitions = demoTransitions.filter(t =>
        (t.to_owner_id === member.id || t.from_owner_id === member.id) &&
        !['completed', 'cancelled'].includes(t.status)
      )
      const completedTransitions = demoTransitions.filter(t =>
        t.to_owner_id === member.id && t.status === 'completed'
      )
      const totalArr  = accounts.reduce((s, a) => s + a.arr, 0)
      const avgHealth = accounts.length > 0
        ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / accounts.length)
        : 0
      const utilization = member.capacity > 0
        ? Math.round((accounts.length / member.capacity) * 100)
        : 0
      const isDeparted = member.role === 'rep' && member.capacity === 0
      const ramp = getRampInfo(member.created_at, member.capacity, member.role)

      return {
        ...member,
        accountCount: accounts.length,
        activeTransitions: activeTransitions.length,
        completedTransitions: completedTransitions.length,
        totalArr,
        avgHealth,
        utilization,
        isDeparted,
        ...ramp,
        // equity fields filled in below after mean is computed
        arrDeviation:     0,
        accountDeviation: 0,
        isArrFlagged:     false,
        isAccountsFlagged:false,
        hasEquityFlag:    false,
      }
    })
  }, [])

  // ── Equity baseline (active reps only) ────────────────────────────────────
  const arrTarget     = getMetricTarget('arr')
  const accountTarget = getMetricTarget('accounts')
  const arrTolerance     = arrTarget?.tolerance     ?? 0.20
  const accountTolerance = accountTarget?.tolerance ?? 0.15

  const { enrichedData, meanArr, meanAccounts, onRampCount, flaggedCount } = useMemo(() => {
    const activeReps = teamData.filter(m => m.role === 'rep' && m.capacity > 0 && m.accountCount > 0)
    const mArr      = activeReps.length > 0 ? activeReps.reduce((s, m) => s + m.totalArr, 0)     / activeReps.length : 0
    const mAccounts = activeReps.length > 0 ? activeReps.reduce((s, m) => s + m.accountCount, 0) / activeReps.length : 0

    const enriched = teamData.map(m => {
      if (m.role !== 'rep' || m.capacity === 0) return m
      const arrDev     = mArr      > 0 ? (m.totalArr     - mArr)      / mArr      : 0
      const accountDev = mAccounts > 0 ? (m.accountCount - mAccounts) / mAccounts : 0
      const isArrFlagged     = arrTarget     !== null && Math.abs(arrDev)     > arrTolerance
      const isAccountsFlagged = accountTarget !== null && Math.abs(accountDev) > accountTolerance
      return {
        ...m,
        arrDeviation:      Math.round(arrDev     * 100),
        accountDeviation:  Math.round(accountDev * 100),
        isArrFlagged,
        isAccountsFlagged,
        hasEquityFlag: isArrFlagged || isAccountsFlagged,
      }
    })

    return {
      enrichedData: enriched,
      meanArr:      Math.round(mArr),
      meanAccounts: Math.round(mAccounts),
      onRampCount:  enriched.filter(m => m.isOnRamp).length,
      flaggedCount: enriched.filter(m => m.hasEquityFlag).length,
    }
  }, [teamData, arrTarget, accountTarget, arrTolerance, accountTolerance])

  // ── Sort + filter ──────────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    return enrichedData
      .filter(m => {
        if (filterRole !== 'all' && m.role !== filterRole) return false
        if (showOnRampOnly  && !m.isOnRamp)      return false
        if (showFlaggedOnly && !m.hasEquityFlag)  return false
        return true
      })
      .sort((a, b) => {
        if (sortKey === 'name') {
          return sortDir === 'asc'
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name)
        }
        const vals: Record<SortKey, [number, number]> = {
          arr:         [a.totalArr,     b.totalArr],
          accounts:    [a.accountCount, b.accountCount],
          health:      [a.avgHealth,    b.avgHealth],
          utilization: [a.utilization,  b.utilization],
          ramp:        [a.rampProgress, b.rampProgress],
          name:        [0, 0],
        }
        const [av, bv] = vals[sortKey]
        return sortDir === 'asc' ? av - bv : bv - av
      })
  }, [enrichedData, sortKey, sortDir, filterRole, showOnRampOnly, showFlaggedOnly])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const activeRepsTotal = demoTeamMembers.filter(m => m.role === 'rep').length

  if (isTrialMode) {
    return (
      <TrialPageEmpty
        icon={Users}
        title="Your Team"
        description="Invite team members to collaborate on account transitions."
        ctaLabel="Manage team"
        ctaHref="/settings"
        onExploreDemo={enterDemoMode}
      />
    )
  }

  const SortChevron = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === 'desc'
        ? <ChevronDown className="w-3 h-3 ml-0.5" />
        : <ChevronUp   className="w-3 h-3 ml-0.5" />
    ) : null

  const SORT_OPTS: { key: SortKey; label: string }[] = [
    { key: 'arr',         label: 'ARR' },
    { key: 'accounts',    label: 'Accounts' },
    { key: 'health',      label: 'Health' },
    { key: 'utilization', label: 'Utilization' },
    { key: 'ramp',        label: 'Ramp' },
    { key: 'name',        label: 'Name' },
  ]

  const ROLE_OPTS: { key: RoleFilter; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'rep',     label: 'Reps' },
    { key: 'manager', label: 'Managers' },
    { key: 'admin',   label: 'Admins' },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              {role === 'am_leadership' ? 'Team Performance' : 'Team'}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {demoTeamMembers.length} members
              <span className="mx-1.5 text-border">·</span>
              {activeRepsTotal} active reps
              {onRampCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-amber-600 font-medium">{onRampCount} ramping</span>
                </>
              )}
              {flaggedCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-amber-600 font-medium">{flaggedCount} equity {flaggedCount === 1 ? 'flag' : 'flags'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Team overview bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-5 px-4 py-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="w-3 h-3 shrink-0" />
            <span>Rep mean ARR:</span>
            <span className="font-semibold text-foreground">{formatCurrency(meanArr)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3 h-3 shrink-0" />
            <span>Mean accounts:</span>
            <span className="font-semibold text-foreground">{meanAccounts}</span>
          </div>
          {onRampCount > 0 && (
            <div className="flex items-center gap-1 text-amber-700">
              <Flame className="w-3 h-3" />
              <span className="font-medium">{onRampCount} on {RAMP_MONTHS}-month ramp</span>
            </div>
          )}
          {flaggedCount > 0 ? (
            <div className="flex items-center gap-1 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">{flaggedCount} outside equity tolerance</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium">All books balanced</span>
            </div>
          )}
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Sort */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {SORT_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  'flex items-center px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  sortKey === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
                <SortChevron k={key} />
              </button>
            ))}
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden bg-background shrink-0">
            {ROLE_OPTS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterRole(key)}
                className={cn(
                  'px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border/40 last:border-r-0',
                  filterRole === key
                    ? 'bg-stone-800 text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status toggles */}
          <button
            onClick={() => setShowOnRampOnly(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              showOnRampOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Flame className="w-3 h-3" />
            On Ramp
          </button>

          <button
            onClick={() => setShowFlaggedOnly(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              showFlaggedOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            Equity Flags
          </button>

          <button
            onClick={() => setShowChart(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              showChart
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <BarChart3 className="w-3 h-3" />
            Chart
          </button>

          {/* Result count */}
          {displayData.length !== enrichedData.length && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {displayData.length} of {enrichedData.length} shown
            </span>
          )}
        </div>

        {/* ── Book Distribution Chart ──────────────────────────────────── */}
        {showChart && (
          <BookDistributionChart
            enrichedData={enrichedData}
            meanArr={meanArr}
            meanAccounts={meanAccounts}
          />
        )}

        {/* ── Team Cards ──────────────────────────────────────────────────── */}
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">No team members match these filters</p>
            <button
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => {
                setFilterRole('all')
                setShowOnRampOnly(false)
                setShowFlaggedOnly(false)
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayData.map(member => (
              <Card
                key={member.id}
                className={cn(
                  'overflow-hidden border-border/60 transition-shadow hover:shadow-sm',
                  member.isDeparted && 'opacity-50 grayscale-[40%]'
                )}
              >
                <CardContent className="p-0">
                  {/* Top bar — ramp progress (amber) or capacity utilization */}
                  <div className="h-[2px] w-full bg-muted">
                    {member.isOnRamp ? (
                      <div
                        className="h-full bg-amber-400 transition-all duration-700"
                        style={{ width: `${member.rampProgress}%` }}
                      />
                    ) : (
                      <div
                        className={cn(
                          'h-full transition-all duration-700',
                          member.utilization > 90 ? 'bg-red-500' :
                          member.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(member.utilization, 100)}%` }}
                      />
                    )}
                  </div>

                  <div className="p-5">
                    {/* Member header */}
                    <div className="flex items-start gap-3.5">
                      <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                        <AvatarFallback className="text-[11px] font-semibold bg-muted text-muted-foreground">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold tracking-tight text-foreground truncate">
                          {member.full_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {member.email}
                        </p>
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium px-1.5 py-0 capitalize text-muted-foreground border-border/60"
                          >
                            {member.role}
                          </Badge>
                          {member.isDeparted && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-stone-100 text-stone-500 border-stone-200">
                              <UserX className="w-2.5 h-2.5 mr-0.5" />
                              Departed
                            </Badge>
                          )}
                          {member.isOnRamp && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                              <Flame className="w-2.5 h-2.5 mr-0.5" />
                              Ramping
                            </Badge>
                          )}
                          {member.isRecentlyRamped && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                              Just Ramped
                            </Badge>
                          )}
                          {member.hasEquityFlag && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              Flagged
                            </Badge>
                          )}
                          {member.specialties.slice(0, 2).map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ramp progress bar */}
                    {member.isOnRamp && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-700"
                            style={{ width: `${member.rampProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-amber-700 shrink-0 tabular-nums">
                          Month {member.monthsIn} of {RAMP_MONTHS}
                        </span>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="mt-4 grid grid-cols-3 gap-0 rounded-lg border border-border/50 overflow-hidden">

                      {/* Accounts */}
                      <div className="px-3 py-2.5 text-center bg-muted/20 relative">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                            {member.accountCount}
                          </p>
                          {member.isAccountsFlagged && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3 h-3 text-amber-500 cursor-default shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {member.accountDeviation > 0 ? '+' : ''}{member.accountDeviation}% vs team mean ({meanAccounts} accounts)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          Accounts
                        </p>
                      </div>

                      {/* ARR */}
                      <div className="px-3 py-2.5 text-center bg-muted/20 border-x border-border/50">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                            {formatCurrency(member.totalArr)}
                          </p>
                          {member.isArrFlagged && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3 h-3 text-amber-500 cursor-default shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">
                                  {member.arrDeviation > 0 ? '+' : ''}{member.arrDeviation}% vs team mean ({formatCurrency(meanArr)})
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          ARR
                        </p>
                      </div>

                      {/* Health */}
                      <div className="px-3 py-2.5 text-center bg-muted/20">
                        <p className={cn(
                          'text-[16px] font-semibold tabular-nums tracking-tight',
                          member.avgHealth >= 70 ? 'text-emerald-600' :
                          member.avgHealth >= 50 ? 'text-amber-600' : 'text-red-500'
                        )}>
                          {member.avgHealth}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          Health
                        </p>
                      </div>
                    </div>

                    {/* Footer row */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px]">
                        {member.capacity > 0 ? (
                          <>
                            <span className={cn(
                              'font-semibold tabular-nums',
                              member.utilization > 90 ? 'text-red-600' :
                              member.utilization > 70 ? 'text-amber-600' : 'text-emerald-600'
                            )}>
                              {member.utilization}%
                            </span>
                            <span className="text-muted-foreground">capacity</span>
                            <span className="text-muted-foreground/50 ml-0.5">
                              ({member.accountCount}/{member.capacity})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60 text-[10px]">No capacity set</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        {member.activeTransitions > 0 && (
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-blue-600 tabular-nums">
                              {member.activeTransitions}
                            </span>
                            {' '}active
                          </span>
                        )}
                        {member.completedTransitions > 0 && (
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-emerald-600 tabular-nums">
                              {member.completedTransitions}
                            </span>
                            {' '}done
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

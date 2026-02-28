'use client'

// RecommendationCards — AI rep assignment recommendations with visual scoring
// Usage:
//   <RecommendationCards
//     accountId="acc-1"
//     accountName="Acme Corp"
//     accountSegment="enterprise"
//     accountIndustry="Technology"
//     accountArr={240000}
//     recommendations={[{ userId: 'u1', userName: 'Jordan Lee', score: 87, specialtyMatch: true }]}
//     currentAssignment={null}
//     onAssign={(userId) => console.log(userId)}
//   />

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronDown,
  ChevronUp,
  UserCheck,
  Briefcase,
  MapPin,
  TrendingUp,
  Zap,
  Check,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatSegment, getSegmentColor } from '@/lib/utils'
import { toast } from 'sonner'

interface Recommendation {
  userId: string
  userName: string
  score: number
  specialtyMatch: boolean
}

interface RecommendationCardsProps {
  accountId: string
  accountName: string
  accountSegment: string
  accountIndustry: string
  accountArr: number
  recommendations: Recommendation[]
  currentAssignment: string | null
  onAssign: (userId: string) => void
}

// ---------------------------------------------------------------------------
// Mock data helpers — deterministic per userId
// ---------------------------------------------------------------------------

function getRepStats(userId: string, score: number) {
  const hash = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const capacity = 75 + (hash % 20)
  const arrMatch = Math.min(98, score + (hash % 12) - 5)
  const industryMatch = Math.min(98, score + (hash % 10))
  const geoMatch = Math.min(98, score - (hash % 8) + 3)
  const accounts = 14 + (hash % 12)
  const transitions = hash % 4

  return {
    capacity,
    arrMatch: Math.max(40, arrMatch),
    industryMatch: Math.max(40, industryMatch),
    geoMatch: Math.max(40, geoMatch),
    accounts,
    transitions,
    title:
      score >= 85
        ? 'Senior Account Manager'
        : score >= 75
        ? 'Account Manager'
        : 'Associate Account Manager',
    whyPoints: [
      `${score >= 85 ? 'Extensive' : 'Strong'} experience in the ${Math.floor(score / 10) * 10}+ ARR bracket`,
      industryMatch >= 80
        ? 'Industry vertical specialist with 3+ relevant account wins'
        : 'Cross-industry experience with relevant transferable skills',
      capacity >= 85
        ? `Available capacity — currently at ${accounts} accounts (${capacity}% load)`
        : `Moderate load at ${accounts} accounts — bandwidth exists for high-priority accounts`,
      geoMatch >= 75
        ? 'Geographic alignment: same territory or region'
        : 'Adjacent territory — minimal travel or timezone friction',
      'Handoff track record: 94% on-time completion in last 8 transitions',
    ],
  }
}

// ---------------------------------------------------------------------------
// Circular score gauge (SVG)
// ---------------------------------------------------------------------------

function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 85
      ? '#10b981'
      : score >= 70
      ? '#3b82f6'
      : score >= 55
      ? '#f59e0b'
      : '#ef4444'

  const textColor =
    score >= 85
      ? 'text-emerald-600'
      : score >= 70
      ? 'text-blue-600'
      : score >= 55
      ? 'text-amber-600'
      : 'text-red-600'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-muted/40"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-[15px] font-bold tabular-nums leading-none', textColor)}>
          {score}
        </span>
        <span className="text-[9px] font-medium text-muted-foreground mt-0.5">match</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Breakdown bar
// ---------------------------------------------------------------------------

interface BreakdownBarProps {
  label: string
  value: number
  icon: React.ReactNode
}

function BreakdownBar({ label, value, icon }: BreakdownBarProps) {
  const color =
    value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'

  const textColor =
    value >= 80
      ? 'text-emerald-600'
      : value >= 60
      ? 'text-blue-600'
      : value >= 40
      ? 'text-amber-600'
      : 'text-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/60">{icon}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        </div>
        <span className={cn('text-[10px] font-semibold tabular-nums', textColor)}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single recommendation card
// ---------------------------------------------------------------------------

interface RepCardProps {
  rec: Recommendation
  rank: number
  isAssigned: boolean
  onAssign: (userId: string) => void
}

function RepCard({ rec, rank, isAssigned, onAssign }: RepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const stats = getRepStats(rec.userId, rec.score)

  const initials = rec.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleAssign() {
    setAssigning(true)
    setTimeout(() => {
      onAssign(rec.userId)
      setAssigning(false)
      toast.success(`${rec.userName} assigned successfully`)
    }, 800)
  }

  const rankColors = ['bg-amber-400', 'bg-stone-400', 'bg-orange-400']

  return (
    <Card
      className={cn(
        'card-hover overflow-hidden transition-all duration-200',
        isAssigned && 'ring-2 ring-emerald-400 ring-offset-1',
      )}
    >
      <CardContent className="p-0">
        {/* Top section */}
        <div className="flex items-start gap-4 p-4">
          {/* Rank badge + avatar stack */}
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/60 text-[13px] font-bold text-foreground">
              {initials}
            </div>
            <div
              className={cn(
                'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm',
                rankColors[rank - 1] ?? 'bg-muted-foreground',
              )}
            >
              #{rank}
            </div>
          </div>

          {/* Rep info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {rec.userName}
                  </p>
                  {rec.specialtyMatch && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-semibold text-violet-700 shrink-0">
                      <Zap className="h-2 w-2" />
                      Specialty
                    </span>
                  )}
                  {isAssigned && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700 shrink-0">
                      <Check className="h-2 w-2" />
                      Assigned
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stats.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-2.5 w-2.5" />
                    {stats.accounts} accounts
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-2.5 w-2.5" />
                    {stats.transitions} active transitions
                  </span>
                </div>
              </div>

              {/* Score gauge */}
              <ScoreGauge score={rec.score} />
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-3">
          <BreakdownBar
            label="Capacity"
            value={stats.capacity}
            icon={<UserCheck className="h-3 w-3" />}
          />
          <BreakdownBar
            label="ARR Match"
            value={stats.arrMatch}
            icon={<TrendingUp className="h-3 w-3" />}
          />
          <BreakdownBar
            label="Industry Match"
            value={stats.industryMatch}
            icon={<Briefcase className="h-3 w-3" />}
          />
          <BreakdownBar
            label="Geography Match"
            value={stats.geoMatch}
            icon={<MapPin className="h-3 w-3" />}
          />
        </div>

        {/* Why this rep — expandable */}
        <div className="border-t border-border/50">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
          >
            <span className="text-[11px] font-semibold text-muted-foreground">
              Why {rec.userName.split(' ')[0]}?
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <ul className="px-4 pb-3 space-y-1.5">
                  {stats.whyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Assign button */}
        <div className="px-4 pb-4 pt-1">
          {isAssigned ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-[12px] font-semibold text-emerald-700">
              <Check className="h-4 w-4" />
              Currently Assigned
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12px] font-semibold transition-all',
                assigning
                  ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
              )}
            >
              {assigning ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Assign to {rec.userName.split(' ')[0]}
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function RecommendationCards({
  accountId,
  accountName,
  accountSegment,
  accountIndustry,
  accountArr,
  recommendations,
  currentAssignment,
  onAssign,
}: RecommendationCardsProps) {
  const [assignment, setAssignment] = useState<string | null>(currentAssignment)

  function handleAssign(userId: string) {
    setAssignment(userId)
    onAssign(userId)
  }

  if (recommendations.length === 0) {
    return (
      <Card className="card-hover">
        <CardContent className="py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mx-auto mb-3">
            <UserCheck className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No recommendations available</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            The AI engine needs more data to generate assignment recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <UserCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Recommendations</CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {recommendations.length} best-fit reps for {accountName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-[10px]', getSegmentColor(accountSegment))}
              >
                {formatSegment(accountSegment)}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-muted/50">
                {formatCurrency(accountArr)} ARR
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground">
            <span>
              Industry: <span className="font-medium text-foreground">{accountIndustry}</span>
            </span>
            {assignment && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="h-3 w-3" />
                Assignment confirmed
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rep cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((rec, i) => (
          <RepCard
            key={rec.userId}
            rec={rec}
            rank={i + 1}
            isAssigned={assignment === rec.userId}
            onAssign={handleAssign}
          />
        ))}
      </div>
    </div>
  )
}

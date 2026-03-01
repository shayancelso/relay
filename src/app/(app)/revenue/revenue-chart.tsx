'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const MONTHLY_ARR_DATA = [
  { month: 'Mar', successful: 2800000, churned: 620000, inTransition: 950000 },
  { month: 'Apr', successful: 3200000, churned: 540000, inTransition: 1100000 },
  { month: 'May', successful: 3600000, churned: 490000, inTransition: 880000 },
  { month: 'Jun', successful: 4100000, churned: 430000, inTransition: 1040000 },
  { month: 'Jul', successful: 4400000, churned: 380000, inTransition: 960000 },
  { month: 'Aug', successful: 4900000, churned: 310000, inTransition: 1150000 },
  { month: 'Sep', successful: 5200000, churned: 270000, inTransition: 1020000 },
  { month: 'Oct', successful: 5600000, churned: 230000, inTransition: 1280000 },
  { month: 'Nov', successful: 6100000, churned: 190000, inTransition: 1100000 },
  { month: 'Dec', successful: 6800000, churned: 160000, inTransition: 980000 },
  { month: 'Jan', successful: 7300000, churned: 140000, inTransition: 1420000 },
  { month: 'Feb', successful: 7900000, churned: 120000, inTransition: 1240000 },
]

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-md text-[12px]">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart() {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">ARR Transition Outcomes</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">12-month revenue flow across all transitions</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block opacity-80" />
              Successfully Transitioned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block opacity-80" />
              In Transition
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-400 inline-block opacity-80" />
              Churned
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={MONTHLY_ARR_DATA}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradSuccessful" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradInTransition" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradChurned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.92 0.01 70)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'oklch(0.55 0.01 50)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 11, fill: 'oklch(0.55 0.01 50)' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomAreaTooltip />} />
            <Area
              type="monotone"
              dataKey="successful"
              name="ARR Successfully Transitioned"
              stackId="1"
              stroke="#34d399"
              strokeWidth={1.5}
              fill="url(#gradSuccessful)"
            />
            <Area
              type="monotone"
              dataKey="inTransition"
              name="ARR Currently In Transition"
              stackId="1"
              stroke="#fbbf24"
              strokeWidth={1.5}
              fill="url(#gradInTransition)"
            />
            <Area
              type="monotone"
              dataKey="churned"
              name="ARR Churned During Transition"
              stackId="1"
              stroke="#f87171"
              strokeWidth={1.5}
              fill="url(#gradChurned)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

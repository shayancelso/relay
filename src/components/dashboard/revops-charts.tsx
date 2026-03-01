'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { formatCurrency, formatStatus, formatSegment } from '@/lib/utils'
import { demoAccounts, getDemoPipeline } from '@/lib/demo-data'

const SEGMENT_COLORS: Record<string, string> = {
  commercial: '#38bdf8',
  corporate: '#a78bfa',
  enterprise: '#fbbf24',
  fins: '#34d399',
  international: '#fb7185',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  pending_approval: '#eab308',
  approved: '#3b82f6',
  intro_sent: '#6366f1',
  meeting_booked: '#a855f7',
  in_progress: '#06b6d4',
  completed: '#22c55e',
  stalled: '#ef4444',
  cancelled: '#6b7280',
}

const shortStatusLabel: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending',
  approved: 'Approved',
  intro_sent: 'Intro Sent',
  meeting_booked: 'Meeting',
  in_progress: 'Active',
  completed: 'Done',
  stalled: 'Stalled',
  cancelled: 'Cancelled',
}

export function RevOpsCharts() {
  const pipeline = getDemoPipeline()

  const segmentData = ['commercial', 'corporate', 'enterprise', 'fins', 'international'].map(seg => {
    const segAccounts = demoAccounts.filter(a => a.segment === seg)
    return {
      name: formatSegment(seg),
      value: segAccounts.reduce((sum, a) => sum + a.arr, 0),
      count: segAccounts.length,
      fill: SEGMENT_COLORS[seg],
    }
  })

  const pipelineData = pipeline.map(p => ({
    ...p,
    label: shortStatusLabel[p.status] || formatStatus(p.status),
    fill: STATUS_COLORS[p.status] || '#6b7280',
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3 card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Transition Pipeline</CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">All Segments</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineData} barSize={24} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">ARR by Segment</CardTitle>
            <Badge variant="outline" className="text-[10px] font-normal">{formatCurrency(demoAccounts.reduce((s, a) => s + a.arr, 0))}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {segmentData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => value != null ? formatCurrency(value) : '—'}
                contentStyle={{
                  borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: '11px', color: 'oklch(0.55 0.01 50)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

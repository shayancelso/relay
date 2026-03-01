'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, LineChart, Line, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// Transition velocity over 12 months
const monthlyData = [
  { month: 'Mar', created: 5, completed: 3, avgDays: 9.2 },
  { month: 'Apr', created: 8, completed: 5, avgDays: 8.8 },
  { month: 'May', created: 12, completed: 7, avgDays: 8.1 },
  { month: 'Jun', created: 6, completed: 9, avgDays: 7.5 },
  { month: 'Jul', created: 10, completed: 8, avgDays: 7.2 },
  { month: 'Aug', created: 15, completed: 11, avgDays: 6.8 },
  { month: 'Sep', created: 9, completed: 12, avgDays: 6.5 },
  { month: 'Oct', created: 13, completed: 10, avgDays: 6.2 },
  { month: 'Nov', created: 7, completed: 8, avgDays: 5.9 },
  { month: 'Dec', created: 18, completed: 14, avgDays: 5.7 },
  { month: 'Jan', created: 11, completed: 13, avgDays: 5.4 },
  { month: 'Feb', created: 14, completed: 11, avgDays: 5.1 },
]

// Bottleneck analysis
const bottleneckData = [
  { stage: 'Draft', days: 0.5, fill: '#9ca3af' },
  { stage: 'Pending Approval', days: 1.8, fill: '#eab308' },
  { stage: 'Approved', days: 0.3, fill: '#3b82f6' },
  { stage: 'Intro Sent', days: 2.4, fill: '#6366f1' },
  { stage: 'Meeting Booked', days: 1.2, fill: '#a855f7' },
  { stage: 'In Progress', days: 3.1, fill: '#06b6d4' },
]

// Retention data (mock)
const retentionData = [
  { month: 'Sep', withRelay: 96, without: 82 },
  { month: 'Oct', withRelay: 97, without: 79 },
  { month: 'Nov', withRelay: 95, without: 81 },
  { month: 'Dec', withRelay: 98, without: 77 },
  { month: 'Jan', withRelay: 97, without: 80 },
  { month: 'Feb', withRelay: 96, without: 78 },
]

export function VelocityCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3 card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Transition Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="createdG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#createdG)" strokeWidth={2} name="Created" />
              <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#completedG)" strokeWidth={2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2 card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Avg. Completion Time (days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[4, 10]} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="avgDays" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} name="Avg Days" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export function BottleneckCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Time Spent per Stage</CardTitle>
            <Badge variant="outline" className="text-[10px]">Avg. days</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bottleneckData} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="d" />
              <YAxis dataKey="stage" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} formatter={(v) => `${v} days`} />
              <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                {bottleneckData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Bottleneck Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { stage: 'In Progress', days: 3.1, insight: 'Longest stage — reps often delay marking complete after customer confirmation. Consider auto-advancing after meeting.', severity: 'high' },
            { stage: 'Intro Sent', days: 2.4, insight: 'Customers take 2+ days to respond to intro emails. Follow-up automation at 48h would reduce this.', severity: 'medium' },
            { stage: 'Pending Approval', days: 1.8, insight: 'Manager approval bottleneck. 60% of delays are from 2 managers. Consider auto-approve for low-ARR transitions.', severity: 'medium' },
          ].map(item => (
            <div key={item.stage} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold">{item.stage}</span>
                <Badge variant="outline" className={cn('text-[9px]', item.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                  {item.days}d avg
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{item.insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function RetentionChart() {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Post-Transition Customer Retention</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">+18% improvement</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={retentionData}>
            <defs>
              <linearGradient id="withRelayG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="withoutG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[70, 100]} unit="%" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="withRelay" stroke="#22c55e" fill="url(#withRelayG)" strokeWidth={2.5} name="With Relay" />
            <Area type="monotone" dataKey="without" stroke="#ef4444" fill="url(#withoutG)" strokeWidth={2} strokeDasharray="5 5" name="Without Relay" />
            <Legend verticalAlign="bottom" iconType="line" formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

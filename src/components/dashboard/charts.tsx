'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

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

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

interface PipelineItem {
  status: string
  count: number
}

interface WorkloadItem {
  id: string
  full_name: string
  capacity: number
  account_count: number
  active_transitions: number
}

export function DashboardCharts({
  pipeline,
  workload,
}: {
  pipeline: PipelineItem[]
  workload: WorkloadItem[]
}) {
  const pipelineData = (pipeline || []).map((p) => ({
    ...p,
    label: formatLabel(p.status),
    fill: STATUS_COLORS[p.status] || '#6b7280',
  }))

  const workloadData = (workload || []).map((w) => ({
    name: w.full_name.split(' ')[0],
    accounts: w.account_count,
    capacity: w.capacity,
    transitions: w.active_transitions,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Transition Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No transitions yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rep Workload</CardTitle>
        </CardHeader>
        <CardContent>
          {workloadData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No team members yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="accounts" fill="#3b82f6" name="Accounts" radius={[0, 4, 4, 0]} />
                <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

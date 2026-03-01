'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const velocityData = [
  { month: 'Sep', completed: 8, started: 12 },
  { month: 'Oct', completed: 11, started: 9 },
  { month: 'Nov', completed: 6, started: 14 },
  { month: 'Dec', completed: 13, started: 7 },
  { month: 'Jan', completed: 9, started: 11 },
  { month: 'Feb', completed: 10, started: 8 },
]

export function LeadershipCharts() {
  return (
    <Card className="lg:col-span-3 card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Pipeline Velocity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={velocityData}>
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="startedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 70)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid oklch(0.92 0.01 70)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#completedGradient)" strokeWidth={2} name="Completed" />
            <Area type="monotone" dataKey="started" stroke="#6366f1" fill="url(#startedGradient)" strokeWidth={2} name="Started" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeTypes,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import {
  Play, Mail, Clock, GitBranch, Calendar, ClipboardList,
  FileText, CheckCircle2, ArrowLeft, Save, Zap, Monitor,
  ChevronDown, Sparkles, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

// ─── Node type definitions ────────────────────────────────────────────────────

type WorkflowNodeType = 'trigger' | 'sendEmail' | 'wait' | 'condition' | 'bookMeeting' | 'createTask' | 'addNote' | 'end'

interface WorkflowNodeData {
  type: WorkflowNodeType
  label: string
  config: Record<string, unknown>
  [key: string]: unknown
}

const NODE_DEFS: Record<WorkflowNodeType, {
  label: string
  icon: typeof Play
  color: string
  borderColor: string
  bgColor: string
  category: 'triggers' | 'actions' | 'logic'
}> = {
  trigger:     { label: 'Trigger',       icon: Play,           color: 'text-emerald-600', borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-50', category: 'triggers' },
  sendEmail:   { label: 'Send Email',    icon: Mail,           color: 'text-blue-600',    borderColor: 'border-l-blue-500',    bgColor: 'bg-blue-50',    category: 'actions' },
  wait:        { label: 'Wait',          icon: Clock,          color: 'text-amber-600',   borderColor: 'border-l-amber-500',   bgColor: 'bg-amber-50',   category: 'actions' },
  condition:   { label: 'Condition',     icon: GitBranch,      color: 'text-violet-600',  borderColor: 'border-l-violet-500',  bgColor: 'bg-violet-50',  category: 'logic' },
  bookMeeting: { label: 'Book Meeting',  icon: Calendar,       color: 'text-indigo-600',  borderColor: 'border-l-indigo-500',  bgColor: 'bg-indigo-50',  category: 'actions' },
  createTask:  { label: 'Create Task',   icon: ClipboardList,  color: 'text-orange-600',  borderColor: 'border-l-orange-500',  bgColor: 'bg-orange-50',  category: 'actions' },
  addNote:     { label: 'Add Note',      icon: FileText,       color: 'text-stone-600',   borderColor: 'border-l-stone-500',   bgColor: 'bg-stone-50',   category: 'actions' },
  end:         { label: 'End',           icon: CheckCircle2,   color: 'text-emerald-600', borderColor: 'border-l-emerald-500', bgColor: 'bg-emerald-50', category: 'logic' },
}

// ─── Custom node component ────────────────────────────────────────────────────

function WorkflowNode({ data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const def = NODE_DEFS[data.type]
  if (!def) return null
  const Icon = def.icon
  const isCondition = data.type === 'condition'
  const isEnd = data.type === 'end'
  const isTrigger = data.type === 'trigger'

  // Build a config preview line
  let preview = ''
  if (data.type === 'sendEmail' && data.config.subject) preview = data.config.subject as string
  else if (data.type === 'wait' && data.config.days) preview = `${data.config.days} day${(data.config.days as number) > 1 ? 's' : ''}`
  else if (data.type === 'condition' && data.config.conditionType) preview = data.config.conditionType as string
  else if (data.type === 'bookMeeting' && data.config.duration) preview = `${data.config.duration} min`
  else if (data.type === 'createTask' && data.config.title) preview = data.config.title as string
  else if (data.type === 'addNote' && data.config.content) preview = (data.config.content as string).slice(0, 40)
  else if (data.type === 'trigger' && data.config.triggerType) preview = data.config.triggerType as string
  else if (data.type === 'end' && data.config.status) preview = data.config.status as string

  return (
    <div
      className={cn(
        'rounded-xl border-l-4 border bg-white shadow-sm min-w-[180px] max-w-[220px] transition-shadow',
        def.borderColor,
        selected ? 'ring-2 ring-foreground/20 shadow-md' : 'hover:shadow-md'
      )}
    >
      {/* Target handle */}
      {!isTrigger && (
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-zinc-300 !border-2 !border-white" />
      )}

      <div className="px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-md p-1', def.bgColor)}>
            <Icon className={cn('h-3.5 w-3.5', def.color)} />
          </div>
          <span className="text-xs font-semibold text-foreground truncate">{data.label}</span>
        </div>
        {preview && (
          <p className="text-[10px] text-muted-foreground truncate pl-7">{preview}</p>
        )}
      </div>

      {/* Source handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white"
            style={{ left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white"
            style={{ left: '70%' }}
          />
          <div className="flex justify-between px-4 pb-1">
            <span className="text-[9px] font-medium text-emerald-600">Yes</span>
            <span className="text-[9px] font-medium text-amber-600">No</span>
          </div>
        </>
      ) : !isEnd ? (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-zinc-300 !border-2 !border-white" />
      ) : null}
    </div>
  )
}

// ─── Dagre layout ─────────────────────────────────────────────────────────────

const NODE_WIDTH = 200
const NODE_HEIGHT = 80

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// ─── Template definitions ─────────────────────────────────────────────────────

interface TemplateDefinition {
  name: string
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
}

function makeNode(id: string, type: WorkflowNodeType, label: string, config: Record<string, unknown> = {}): Node<WorkflowNodeData> {
  return {
    id,
    type: 'workflowNode',
    position: { x: 0, y: 0 },
    data: { type, label, config },
  }
}

function makeEdge(source: string, target: string, sourceHandle?: string, label?: string): Edge {
  return {
    id: `e-${source}-${target}${sourceHandle ? `-${sourceHandle}` : ''}`,
    source,
    target,
    sourceHandle: sourceHandle || undefined,
    type: 'smoothstep',
    animated: true,
    label,
    style: { stroke: sourceHandle === 'yes' ? '#10b981' : sourceHandle === 'no' ? '#f59e0b' : '#94a3b8' },
    markerEnd: { type: MarkerType.ArrowClosed, color: sourceHandle === 'yes' ? '#10b981' : sourceHandle === 'no' ? '#f59e0b' : '#94a3b8' },
  }
}

const TEMPLATE_DATA: Record<string, TemplateDefinition> = {
  'new-account-outreach': {
    name: 'New Account Outreach',
    nodes: [
      makeNode('t1', 'trigger', 'Account Assigned', { triggerType: 'Account Assigned' }),
      makeNode('e1', 'sendEmail', 'Warm Intro', { subject: 'Welcome to the team!', aiGenerated: true }),
      makeNode('w1', 'wait', 'Wait 3 Days', { days: 3 }),
      makeNode('c1', 'condition', 'Email Replied?', { conditionType: 'Email replied' }),
      makeNode('m1', 'bookMeeting', 'Intro Call', { duration: 30, meetingType: 'Intro Call' }),
      makeNode('end1', 'end', 'Complete', { status: 'Completed' }),
      makeNode('e2', 'sendEmail', 'Follow-up #1', { subject: 'Following up on my intro' }),
      makeNode('w2', 'wait', 'Wait 3 Days', { days: 3 }),
      makeNode('c2', 'condition', 'Still No Response?', { conditionType: 'No response' }),
      makeNode('task1', 'createTask', 'Manual Outreach', { title: 'Manual outreach needed' }),
      makeNode('end2', 'end', 'Escalated', { status: 'Escalated' }),
      makeNode('m2', 'bookMeeting', 'Book Meeting', { duration: 30, meetingType: 'Follow-up' }),
      makeNode('end3', 'end', 'Booked', { status: 'Completed' }),
    ],
    edges: [
      makeEdge('t1', 'e1'),
      makeEdge('e1', 'w1'),
      makeEdge('w1', 'c1'),
      makeEdge('c1', 'm1', 'yes', 'Yes'),
      makeEdge('m1', 'end1'),
      makeEdge('c1', 'e2', 'no', 'No'),
      makeEdge('e2', 'w2'),
      makeEdge('w2', 'c2'),
      makeEdge('c2', 'task1', 'yes', 'Yes'),
      makeEdge('task1', 'end2'),
      makeEdge('c2', 'm2', 'no', 'No'),
      makeEdge('m2', 'end3'),
    ],
  },
  'post-handoff-checkin': {
    name: 'Post-Handoff Check-in',
    nodes: [
      makeNode('t1', 'trigger', 'Handoff Complete', { triggerType: 'Transition Completed' }),
      makeNode('w1', 'wait', 'Wait 5 Days', { days: 5 }),
      makeNode('e1', 'sendEmail', 'Check-in Email', { subject: 'How is everything going?' }),
      makeNode('c1', 'condition', 'Response Received?', { conditionType: 'Email replied' }),
      makeNode('n1', 'addNote', 'Log Feedback', { content: 'Record client feedback from check-in' }),
      makeNode('end1', 'end', 'Checked In', { status: 'Completed' }),
      makeNode('w2', 'wait', 'Wait 2 Days', { days: 2 }),
      makeNode('task1', 'createTask', 'Escalate to Manager', { title: 'No response to check-in' }),
      makeNode('end2', 'end', 'Escalated', { status: 'Escalated' }),
    ],
    edges: [
      makeEdge('t1', 'w1'),
      makeEdge('w1', 'e1'),
      makeEdge('e1', 'c1'),
      makeEdge('c1', 'n1', 'yes', 'Yes'),
      makeEdge('n1', 'end1'),
      makeEdge('c1', 'w2', 'no', 'No'),
      makeEdge('w2', 'task1'),
      makeEdge('task1', 'end2'),
    ],
  },
  'renewal-prep-sequence': {
    name: 'Renewal Prep Sequence',
    nodes: [
      makeNode('t1', 'trigger', 'Renewal in 60 Days', { triggerType: 'Renewal Approaching' }),
      makeNode('e1', 'sendEmail', 'Renewal Kickoff', { subject: 'Preparing for your renewal' }),
      makeNode('c1', 'condition', 'Health Score > 70?', { conditionType: 'Health score above threshold', threshold: 70 }),
      makeNode('m1', 'bookMeeting', 'Schedule QBR', { duration: 60, meetingType: 'QBR' }),
      makeNode('end1', 'end', 'On Track', { status: 'Completed' }),
      makeNode('e2', 'sendEmail', 'Follow-up Email', { subject: 'Checking in before renewal' }),
      makeNode('task1', 'createTask', 'Review Account Health', { title: 'Deep dive on at-risk renewal' }),
      makeNode('m2', 'bookMeeting', 'Rescue Meeting', { duration: 45, meetingType: 'Account Review' }),
      makeNode('end2', 'end', 'Reviewed', { status: 'Reviewed' }),
    ],
    edges: [
      makeEdge('t1', 'e1'),
      makeEdge('e1', 'c1'),
      makeEdge('c1', 'm1', 'yes', 'Yes'),
      makeEdge('m1', 'end1'),
      makeEdge('c1', 'e2', 'no', 'No'),
      makeEdge('e2', 'task1'),
      makeEdge('task1', 'm2'),
      makeEdge('m2', 'end2'),
    ],
  },
  'stalled-account-reactivation': {
    name: 'Stalled Account Reactivation',
    nodes: [
      makeNode('t1', 'trigger', 'Health Score Drop', { triggerType: 'Health Score Below Threshold' }),
      makeNode('task1', 'createTask', 'Health Check', { title: 'Review account health signals' }),
      makeNode('e1', 'sendEmail', 'Re-engagement Email', { subject: "We'd love to reconnect", aiGenerated: true }),
      makeNode('w1', 'wait', 'Wait 5 Days', { days: 5 }),
      makeNode('c1', 'condition', 'Any Engagement?', { conditionType: 'Email opened or replied' }),
      makeNode('m1', 'bookMeeting', 'Recovery Call', { duration: 30, meetingType: 'Recovery' }),
      makeNode('end1', 'end', 'Engaged', { status: 'Completed' }),
      makeNode('n1', 'addNote', 'Flag at Risk', { content: 'Account unresponsive to reactivation' }),
      makeNode('end2', 'end', 'At Risk', { status: 'At Risk' }),
    ],
    edges: [
      makeEdge('t1', 'task1'),
      makeEdge('task1', 'e1'),
      makeEdge('e1', 'w1'),
      makeEdge('w1', 'c1'),
      makeEdge('c1', 'm1', 'yes', 'Yes'),
      makeEdge('m1', 'end1'),
      makeEdge('c1', 'n1', 'no', 'No'),
      makeEdge('n1', 'end2'),
    ],
  },
  'enterprise-high-touch': {
    name: 'Enterprise High-Touch',
    nodes: [
      makeNode('t1', 'trigger', 'Enterprise Account Assigned', { triggerType: 'Account Assigned' }),
      makeNode('task1', 'createTask', 'Research Account', { title: 'Deep research on account history' }),
      makeNode('e1', 'sendEmail', 'Personalized Intro', { subject: 'Tailored intro based on research', aiGenerated: true }),
      makeNode('w1', 'wait', 'Wait 2 Days', { days: 2 }),
      makeNode('c1', 'condition', 'Email Opened?', { conditionType: 'Email opened' }),
      makeNode('m1', 'bookMeeting', 'Exec Meeting', { duration: 45, meetingType: 'Executive Intro' }),
      makeNode('w2', 'wait', 'Wait 7 Days', { days: 7 }),
      makeNode('m2', 'bookMeeting', 'QBR Planning', { duration: 60, meetingType: 'QBR' }),
      makeNode('end1', 'end', 'Onboarded', { status: 'Completed' }),
      makeNode('e2', 'sendEmail', 'Follow-up Touch', { subject: 'Value prop follow-up' }),
      makeNode('w3', 'wait', 'Wait 3 Days', { days: 3 }),
      makeNode('task2', 'createTask', 'Phone Outreach', { title: 'Direct phone call to champion' }),
      makeNode('end2', 'end', 'Manual Follow-up', { status: 'Manual' }),
    ],
    edges: [
      makeEdge('t1', 'task1'),
      makeEdge('task1', 'e1'),
      makeEdge('e1', 'w1'),
      makeEdge('w1', 'c1'),
      makeEdge('c1', 'm1', 'yes', 'Yes'),
      makeEdge('m1', 'w2'),
      makeEdge('w2', 'm2'),
      makeEdge('m2', 'end1'),
      makeEdge('c1', 'e2', 'no', 'No'),
      makeEdge('e2', 'w3'),
      makeEdge('w3', 'task2'),
      makeEdge('task2', 'end2'),
    ],
  },
  'quick-commercial-handoff': {
    name: 'Quick Commercial Handoff',
    nodes: [
      makeNode('t1', 'trigger', 'Account Assigned', { triggerType: 'Account Assigned' }),
      makeNode('e1', 'sendEmail', 'Auto Intro', { subject: 'Your new account manager', aiGenerated: true }),
      makeNode('c1', 'condition', 'Email Replied?', { conditionType: 'Email replied' }),
      makeNode('end1', 'end', 'Connected', { status: 'Completed' }),
      makeNode('w1', 'wait', 'Wait 2 Days', { days: 2 }),
      makeNode('e2', 'sendEmail', 'Quick Follow-up', { subject: 'Just checking in' }),
      makeNode('end2', 'end', 'Sequence Done', { status: 'Completed' }),
    ],
    edges: [
      makeEdge('t1', 'e1'),
      makeEdge('e1', 'c1'),
      makeEdge('c1', 'end1', 'yes', 'Yes'),
      makeEdge('c1', 'w1', 'no', 'No'),
      makeEdge('w1', 'e2'),
      makeEdge('e2', 'end2'),
    ],
  },
}

// Fallback for custom workflow IDs
const DEFAULT_TEMPLATE: TemplateDefinition = {
  name: 'New Workflow',
  nodes: [
    makeNode('t1', 'trigger', 'Start', { triggerType: 'Account Assigned' }),
    makeNode('end1', 'end', 'End', { status: 'Completed' }),
  ],
  edges: [makeEdge('t1', 'end1')],
}

// ─── Palette items ────────────────────────────────────────────────────────────

const PALETTE_CATEGORIES = [
  {
    label: 'Triggers',
    items: [{ type: 'trigger' as WorkflowNodeType, label: 'Trigger' }],
  },
  {
    label: 'Actions',
    items: [
      { type: 'sendEmail' as WorkflowNodeType, label: 'Send Email' },
      { type: 'wait' as WorkflowNodeType, label: 'Wait' },
      { type: 'bookMeeting' as WorkflowNodeType, label: 'Book Meeting' },
      { type: 'createTask' as WorkflowNodeType, label: 'Create Task' },
      { type: 'addNote' as WorkflowNodeType, label: 'Add Note' },
    ],
  },
  {
    label: 'Logic',
    items: [
      { type: 'condition' as WorkflowNodeType, label: 'Condition' },
      { type: 'end' as WorkflowNodeType, label: 'End' },
    ],
  },
]

// ─── AI Email generation (demo) ───────────────────────────────────────────────

const AI_TONES = [
  { key: 'professional', label: 'Professional' },
  { key: 'casual', label: 'Casual' },
  { key: 'formal', label: 'Formal' },
] as const

type AiTone = typeof AI_TONES[number]['key']

function buildDemoEmail(prompt: string, tone: AiTone, nodeLabel: string): { subject: string; body: string } {
  // Use the prompt + node label to pick context-aware content
  const p = `${prompt} ${nodeLabel}`.toLowerCase()

  let greeting = 'Hi {{contact_name}},'
  let signoff = 'Best,\n{{sender_name}}'
  if (tone === 'formal') { greeting = 'Dear {{contact_name}},'; signoff = 'Kind regards,\n{{sender_name}}' }
  if (tone === 'casual') { greeting = 'Hey {{contact_name}}!'; signoff = 'Cheers,\n{{sender_name}}' }

  // Pick body based on what the user asked for
  if (p.includes('renewal') || p.includes('qbr') || p.includes('renew')) {
    return {
      subject: "Let's plan ahead for your upcoming renewal",
      body: `${greeting}

Your renewal date is approaching and I wanted to get ahead of it. I've put together a review of the value we've delivered — adoption metrics, ROI highlights, and a few recommendations for next year.

Would you have 45 minutes next week for a QBR? I'll share the deck in advance so we can make the most of our time.

${signoff}`,
    }
  }

  if (p.includes('follow') || p.includes('bump') || p.includes('remind') || p.includes('no response')) {
    return {
      subject: 'Following up on my earlier note',
      body: `${greeting}

I know things get busy — just wanted to float this back to the top of your inbox. I have a few ideas based on your recent usage that I think could save your team real time.

Happy to share over a quick call, or feel free to reply here if that's easier.

${signoff}`,
    }
  }

  if (p.includes('check') || p.includes('how') || p.includes('onboard') || p.includes('transition')) {
    return {
      subject: 'Quick check-in — how are things going?',
      body: `${greeting}

It's been a couple of weeks since the transition and I wanted to make sure everything is running smoothly on your end.

A few things on my radar:
- Your team's adoption is trending well
- There's a feature release next month that aligns with your use case
- I'd love to hear any early feedback

Let me know if anything needs attention.

${signoff}`,
    }
  }

  if (p.includes('reactivat') || p.includes('re-engag') || p.includes('stall') || p.includes('inactive') || p.includes('win back')) {
    return {
      subject: "It's been a while — let's reconnect",
      body: `${greeting}

I noticed we haven't connected in a while and wanted to reach out. A few things have changed since we last spoke that I think would be relevant to your team:

- New automation capabilities that could save 5+ hours/week
- Updated dashboards tailored to your industry
- Early access to features in our next release

Would you be open to a 20-minute call to explore these?

${signoff}`,
    }
  }

  if (p.includes('meeting') || p.includes('call') || p.includes('schedule') || p.includes('book')) {
    return {
      subject: "Let's find time to connect",
      body: `${greeting}

I'd love to set up a call to align on priorities and make sure we're set up for a strong quarter. I have a few topics I'd like to cover, but I'm also keen to hear what's top of mind for you.

Here are a few times that work on my end — feel free to pick one or suggest an alternative:
- Tuesday 2:00–3:00 PM
- Wednesday 10:00–11:00 AM
- Thursday 1:00–2:00 PM

${signoff}`,
    }
  }

  // Default: warm intro
  return {
    subject: 'Introducing myself as your new account manager',
    body: `${greeting}

I'm reaching out as your new account manager. I've spent time reviewing your account history and I'm looking forward to working together.

I'd love to set up a brief intro call this week to learn about your priorities and how I can best support your team. No formal agenda — just a chance to connect.

${signoff}`,
  }
}

function SendEmailFields({
  node,
  updateConfig,
}: {
  node: Node<WorkflowNodeData>
  updateConfig: (key: string, value: unknown) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTone, setAiTone] = useState<AiTone>('professional')
  const [aiPrompt, setAiPrompt] = useState('')
  const [streamedBody, setStreamedBody] = useState<string | null>(null)

  const handleGenerate = useCallback(() => {
    if (!aiPrompt.trim()) {
      toast.error('Describe what the email should say')
      return
    }

    setIsGenerating(true)
    setStreamedBody('')

    const result = buildDemoEmail(aiPrompt, aiTone, node.data.label)
    updateConfig('subject', result.subject)

    let charIndex = 0
    const interval = setInterval(() => {
      charIndex += Math.floor(Math.random() * 3) + 2
      if (charIndex >= result.body.length) {
        charIndex = result.body.length
        clearInterval(interval)
        setIsGenerating(false)
        updateConfig('body', result.body)
        updateConfig('aiGenerated', true)
        setStreamedBody(null)
      }
      setStreamedBody(result.body.slice(0, charIndex))
    }, 18)

    return () => clearInterval(interval)
  }, [aiPrompt, aiTone, node.data.label, updateConfig])

  const displayBody = streamedBody !== null ? streamedBody : (node.data.config.body as string) || ''

  return (
    <>
      {/* AI compose — always visible, primary action */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-foreground p-1">
            <Sparkles className="h-3 w-3 text-background" />
          </div>
          <span className="text-xs font-semibold">AI Compose</span>
        </div>

        {/* Prompt input */}
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe what this email should say&#10;&#10;e.g. Introduce myself as their new AM, mention I reviewed their account, and ask for a 15-min intro call this week"
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground/40"
        />

        {/* Tone + Generate row */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {AI_TONES.map((t) => (
              <button
                key={t.key}
                onClick={() => setAiTone(t.key)}
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  aiTone === t.key
                    ? 'bg-foreground text-background'
                    : 'bg-background border text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !aiPrompt.trim()}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0',
              isGenerating
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : !aiPrompt.trim()
                  ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                  : 'bg-foreground text-background hover:bg-foreground/90'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Writing
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
        <input
          type="text"
          value={(node.data.config.subject as string) || ''}
          onChange={(e) => updateConfig('subject', e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">Body</label>
          {!!node.data.config.aiGenerated && !isGenerating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
              <Sparkles className="h-2.5 w-2.5" />
              AI draft — editable
            </span>
          )}
        </div>
        <textarea
          value={displayBody}
          onChange={(e) => {
            updateConfig('body', e.target.value)
            if (node.data.config.aiGenerated) updateConfig('aiGenerated', false)
          }}
          placeholder="Email body will appear here after generating, or type manually..."
          rows={8}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-colors',
            isGenerating && 'border-foreground/15 bg-muted/30'
          )}
          readOnly={isGenerating}
        />
      </div>
    </>
  )
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  node,
  onUpdate,
}: {
  node: Node<WorkflowNodeData> | null
  onUpdate: (id: string, data: Partial<WorkflowNodeData>) => void
}) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <div>
          <GitBranch className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Select a node to configure</p>
        </div>
      </div>
    )
  }

  const def = NODE_DEFS[node.data.type]
  if (!def) return null
  const Icon = def.icon

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(node.id, {
      ...node.data,
      config: { ...node.data.config, [key]: value },
    })
  }

  const updateLabel = (label: string) => {
    onUpdate(node.id, { ...node.data, label })
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <div className={cn('rounded-md p-1.5', def.bgColor)}>
          <Icon className={cn('h-4 w-4', def.color)} />
        </div>
        <div>
          <p className="text-sm font-semibold">{def.label}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{def.category}</p>
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Node Label</label>
        <input
          type="text"
          value={node.data.label}
          onChange={(e) => updateLabel(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Type-specific fields */}
      {node.data.type === 'trigger' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Trigger Type</label>
          <select
            value={(node.data.config.triggerType as string) || ''}
            onChange={(e) => updateConfig('triggerType', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="Account Assigned">Account Assigned</option>
            <option value="Transition Completed">Transition Completed</option>
            <option value="Renewal Approaching">Renewal Approaching</option>
            <option value="Health Score Below Threshold">Health Score Drop</option>
            <option value="Manual Trigger">Manual Trigger</option>
          </select>
        </div>
      )}

      {node.data.type === 'sendEmail' && (
        <SendEmailFields node={node} updateConfig={updateConfig} />
      )}

      {node.data.type === 'wait' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Wait (days)</label>
          <input
            type="number"
            min={1}
            value={(node.data.config.days as number) || 1}
            onChange={(e) => updateConfig('days', parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      )}

      {node.data.type === 'condition' && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Condition</label>
            <select
              value={(node.data.config.conditionType as string) || ''}
              onChange={(e) => updateConfig('conditionType', e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="Email replied">Email replied</option>
              <option value="Email opened">Email opened</option>
              <option value="Email opened or replied">Email opened or replied</option>
              <option value="No response">No response</option>
              <option value="Health score above threshold">Health score above threshold</option>
              <option value="Meeting booked">Meeting booked</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Threshold Value</label>
            <input
              type="number"
              value={(node.data.config.threshold as number) || ''}
              onChange={(e) => updateConfig('threshold', parseInt(e.target.value) || undefined)}
              placeholder="Optional"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </>
      )}

      {node.data.type === 'bookMeeting' && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
            <select
              value={(node.data.config.duration as number) || 30}
              onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Meeting Type</label>
            <input
              type="text"
              value={(node.data.config.meetingType as string) || ''}
              onChange={(e) => updateConfig('meetingType', e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </>
      )}

      {node.data.type === 'createTask' && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title</label>
            <input
              type="text"
              value={(node.data.config.title as string) || ''}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assignee</label>
            <select
              value={(node.data.config.assignee as string) || ''}
              onChange={(e) => updateConfig('assignee', e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="">Auto-assign</option>
              <option value="incoming_am">Incoming AM</option>
              <option value="outgoing_am">Outgoing AM</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </>
      )}

      {node.data.type === 'addNote' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Note Content</label>
          <textarea
            value={(node.data.config.content as string) || ''}
            onChange={(e) => updateConfig('content', e.target.value)}
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      )}

      {node.data.type === 'end' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Completion Status</label>
          <select
            value={(node.data.config.status as string) || 'Completed'}
            onChange={(e) => updateConfig('status', e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="Completed">Completed</option>
            <option value="Escalated">Escalated</option>
            <option value="At Risk">At Risk</option>
            <option value="Manual">Manual Follow-up</option>
          </select>
        </div>
      )}
    </div>
  )
}

// ─── Main Builder Component ───────────────────────────────────────────────────

function WorkflowBuilder() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(templateId)
  const template = !isUUID ? (TEMPLATE_DATA[templateId] || DEFAULT_TEMPLATE) : DEFAULT_TEMPLATE

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(template.nodes, template.edges),
    [template]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null)
  const [workflowName, setWorkflowName] = useState(template.name)
  const [isActive, setIsActive] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(isUUID ? templateId : null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(isUUID)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReturnType<typeof useRef<null>>['current'] | null>(null)

  const nodeTypes: NodeTypes = useMemo(() => ({
    workflowNode: WorkflowNode,
  }), [])

  // Load saved workflow from DB when ID is a UUID
  useEffect(() => {
    if (!isUUID) return
    fetch(`/api/workflows/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const dbNodes = (data.nodes || []) as Node<WorkflowNodeData>[]
          const dbEdges = (data.edges || []) as Edge[]
          if (dbNodes.length > 0) {
            setNodes(dbNodes)
            setEdges(dbEdges)
          }
          setWorkflowName(data.name || 'Untitled')
          setIsActive(data.status === 'active')
          setSavedId(data.id)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [templateId, isUUID, setNodes, setEdges])

  // Update selected node when nodes change
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find((n) => n.id === selectedNode.id) as Node<WorkflowNodeData> | undefined
      if (updated) setSelectedNode(updated)
    }
  }, [nodes, selectedNode])

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        style: { stroke: connection.sourceHandle === 'yes' ? '#10b981' : connection.sourceHandle === 'no' ? '#f59e0b' : '#94a3b8' },
        markerEnd: { type: MarkerType.ArrowClosed, color: connection.sourceHandle === 'yes' ? '#10b981' : connection.sourceHandle === 'no' ? '#f59e0b' : '#94a3b8' },
        label: connection.sourceHandle === 'yes' ? 'Yes' : connection.sourceHandle === 'no' ? 'No' : undefined,
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<WorkflowNodeData>)
    },
    []
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onNodeUpdate = useCallback(
    (id: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
      )
    },
    [setNodes]
  )

  // Drag and drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType
      if (!type) return

      const def = NODE_DEFS[type]
      if (!def) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      // Get the position from the drop point
      const position = {
        x: event.clientX - bounds.left - NODE_WIDTH / 2,
        y: event.clientY - bounds.top - NODE_HEIGHT / 2,
      }

      const newNode: Node<WorkflowNodeData> = {
        id: `${type}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          type,
          label: def.label,
          config: {},
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const onDragStart = (event: React.DragEvent, type: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-60px)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-2.5 shrink-0">
        <button
          onClick={() => router.push('/workflows')}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-border" />

        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1 max-w-[300px]"
        />

        <Badge variant="outline" className={cn('text-[10px] shrink-0', isActive && 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
          {isActive ? 'Active' : savedId ? 'Saved' : 'Draft'}
        </Badge>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true)
              try {
                const payload = {
                  name: workflowName,
                  description: null,
                  template_id: templateId,
                  nodes,
                  edges,
                  status: isActive ? 'active' : 'draft',
                }
                if (savedId) {
                  await fetch(`/api/workflows/${savedId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                } else {
                  const res = await fetch('/api/workflows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  const data = await res.json()
                  if (data.id) setSavedId(data.id)
                }
                toast.success('Workflow saved')
              } catch {
                toast.error('Failed to save workflow')
              } finally {
                setIsSaving(false)
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={async () => {
              const newStatus = !isActive
              setIsActive(newStatus)
              if (savedId) {
                await fetch(`/api/workflows/${savedId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus ? 'active' : 'draft' }),
                })
              }
              toast.success(newStatus ? 'Workflow activated' : 'Workflow deactivated')
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-foreground text-background hover:bg-foreground/90'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            {isActive ? 'Active' : 'Activate'}
          </button>
          {savedId && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/workflows/${savedId}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                  })
                  const data = await res.json()
                  if (data.success) {
                    toast.success('Test run started')
                  } else {
                    toast.error(data.error || 'Failed to start run')
                  }
                } catch {
                  toast.error('Failed to start run')
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              Test Run
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node palette */}
        <div className="w-[200px] border-r bg-muted/30 overflow-y-auto shrink-0">
          <div className="p-3 space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Node Palette
            </p>
            {PALETTE_CATEGORIES.map((category) => (
              <div key={category.label}>
                <p className="text-[10px] font-medium text-muted-foreground/60 mb-1.5 uppercase tracking-wide">
                  {category.label}
                </p>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const def = NODE_DEFS[item.type]
                    const Icon = def.icon
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 cursor-grab active:cursor-grabbing hover:border-foreground/20 hover:shadow-sm transition-all"
                      >
                        <div className={cn('rounded p-1', def.bgColor)}>
                          <Icon className={cn('h-3 w-3', def.color)} />
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={setReactFlowInstance as (instance: unknown) => void}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
            className="bg-muted/10"
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <MiniMap
              nodeStrokeWidth={3}
              className="!bg-white !border !rounded-lg !shadow-sm"
              maskColor="rgba(0,0,0,0.08)"
            />
            <Controls className="!bg-white !border !rounded-lg !shadow-sm" />
          </ReactFlow>
        </div>

        {/* Properties panel */}
        <div className="w-[300px] border-l bg-background overflow-hidden shrink-0">
          <PropertiesPanel
            node={selectedNode}
            onUpdate={onNodeUpdate}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Page with responsive gate ────────────────────────────────────────────────

export default function WorkflowBuilderPage() {
  return (
    <>
      {/* Mobile gate */}
      <div className="lg:hidden flex flex-col items-center justify-center h-[60vh] p-8 text-center">
        <Monitor className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Best Experienced on Desktop</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The visual workflow builder requires a larger screen for the best experience.
          Please switch to a desktop browser to use this feature.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>

      {/* Desktop builder */}
      <div className="hidden lg:block h-[calc(100vh-60px)]">
        <ReactFlowProvider>
          <WorkflowBuilder />
        </ReactFlowProvider>
      </div>
    </>
  )
}

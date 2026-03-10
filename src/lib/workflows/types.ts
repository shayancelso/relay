// Workflow node/edge shapes as stored in the JSONB columns (mirrors frontend WorkflowNodeData)

export type WorkflowNodeType = 'trigger' | 'sendEmail' | 'wait' | 'condition' | 'bookMeeting' | 'createTask' | 'addNote' | 'end'

export interface WorkflowNodeDef {
  id: string
  type: string // 'workflowNode'
  data: {
    type: WorkflowNodeType
    label: string
    config: Record<string, unknown>
  }
  position: { x: number; y: number }
}

export interface WorkflowEdgeDef {
  id: string
  source: string
  target: string
  sourceHandle?: string // 'yes' | 'no' | undefined
  label?: string
}

export interface ExecutionContext {
  run_id: string
  workflow_id: string
  org_id: string
  account_id: string
  account: {
    id: string
    name: string
    health_score: number
    primary_contact_email: string | null
    primary_contact_name: string | null
  }
  stepState: Record<string, unknown> // accumulated state from prior steps
}

export interface ExecutorResult {
  output: Record<string, unknown>
  nextHandle?: 'yes' | 'no'  // only set by condition nodes
  sleepDays?: number          // only set by wait nodes
  terminal?: boolean          // only set by end nodes
}

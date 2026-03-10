import type { WorkflowNodeDef, WorkflowEdgeDef } from './types'

export function findTriggerNode(nodes: WorkflowNodeDef[]): WorkflowNodeDef | null {
  return nodes.find((n) => n.data.type === 'trigger') || null
}

export function getNodeById(nodeId: string, nodes: WorkflowNodeDef[]): WorkflowNodeDef | null {
  return nodes.find((n) => n.id === nodeId) || null
}

export function findNextNodeIds(
  currentNodeId: string,
  edges: WorkflowEdgeDef[],
  branchHandle?: 'yes' | 'no'
): string[] {
  return edges
    .filter((e) => {
      if (e.source !== currentNodeId) return false
      if (branchHandle) return e.sourceHandle === branchHandle
      return true
    })
    .map((e) => e.target)
}

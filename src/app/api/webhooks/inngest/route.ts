import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { detectStalledTransitions, sendTransitionEmailJob } from '@/lib/inngest/functions'
import { executeWorkflow } from '@/lib/inngest/workflow-engine'
import {
  onAccountAssigned,
  onTransitionCompleted,
  onRenewalApproaching,
  onHealthScoreDropped,
} from '@/lib/inngest/workflow-triggers'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    detectStalledTransitions,
    sendTransitionEmailJob,
    executeWorkflow,
    onAccountAssigned,
    onTransitionCompleted,
    onRenewalApproaching,
    onHealthScoreDropped,
  ],
})

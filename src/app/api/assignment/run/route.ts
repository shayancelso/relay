import { NextResponse } from 'next/server'
import { runAssignmentEngine } from '@/lib/assignment/engine'
import type { Account, User, AssignmentRule } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      accounts,
      available_reps,
      rep_account_counts,
      rep_current_accounts,
      rules,
    } = body

    const countMap = new Map<string, number>(
      Object.entries(rep_account_counts || {}) as [string, number][]
    )
    const accountsMap = new Map<string, Account[]>(
      Object.entries(rep_current_accounts || {}) as [string, Account[]][]
    )

    const recommendations = runAssignmentEngine(
      accounts as Account[],
      available_reps as User[],
      countMap,
      accountsMap,
      rules as AssignmentRule[],
    )

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('Assignment engine error:', err)
    return NextResponse.json(
      { error: 'Failed to run assignment engine' },
      { status: 500 }
    )
  }
}

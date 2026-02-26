'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/types'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()
      if (!profile) { setLoading(false); return }

      const { data } = await supabase
        .from('accounts')
        .select('*, current_owner:users!accounts_current_owner_id_fkey(id, full_name)')
        .eq('org_id', profile.org_id)
        .order('arr', { ascending: false })

      setAccounts(data || [])
      setLoading(false)
    }

    load()
  }, [])

  return { accounts, loading }
}

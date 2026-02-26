'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transition } from '@/types'

export function useTransitions() {
  const [transitions, setTransitions] = useState<Transition[]>([])
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
        .from('transitions')
        .select(`
          *,
          account:accounts(id, name, arr, health_score),
          from_owner:users!transitions_from_owner_id_fkey(id, full_name),
          to_owner:users!transitions_to_owner_id_fkey(id, full_name)
        `)
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })

      setTransitions(data || [])
      setLoading(false)
    }

    load()
  }, [])

  return { transitions, loading }
}

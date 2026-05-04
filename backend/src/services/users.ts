import supabase from './supabase'

import type { User } from '../types'

export async function listUsers(organization_id: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as User[]
}
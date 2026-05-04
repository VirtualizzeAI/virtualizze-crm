import supabase from './supabase'

import type { Deal } from '../types'

interface ListDealsInput {
  organization_id: string
  pipeline_id?: string
  stage_id?: string
}

interface CreateDealInput {
  organization_id: string
  pipeline_id: string
  stage_id: string
  name: string
  value?: number
  description?: string | null
  contact_id?: string | null
}

interface MoveDealInput {
  organization_id: string
  deal_id: string
  stage_id: string
  position: number
}

export async function listDeals(input: ListDealsInput): Promise<Deal[]> {
  let query = supabase
    .from('deals')
    .select('*')
    .eq('organization_id', input.organization_id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (input.pipeline_id) {
    query = query.eq('pipeline_id', input.pipeline_id)
  }

  if (input.stage_id) {
    query = query.eq('stage_id', input.stage_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Deal[]
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .insert({
      organization_id: input.organization_id,
      pipeline_id: input.pipeline_id,
      stage_id: input.stage_id,
      name: input.name,
      value: input.value ?? 0,
      description: input.description ?? null,
      contact_id: input.contact_id ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Deal
}

export async function moveDeal(input: MoveDealInput): Promise<Deal | null> {
  const { data, error } = await supabase
    .from('deals')
    .update({
      stage_id: input.stage_id,
      position: input.position,
    })
    .eq('organization_id', input.organization_id)
    .eq('id', input.deal_id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as Deal | null) ?? null
}
import supabase from './supabase'

import type { Pipeline, PipelineStage } from '../types'

interface CreatePipelineInput {
  organization_id: string
  name: string
  description?: string | null
}

interface CreatePipelineStageInput {
  organization_id: string
  pipeline_id: string
  name: string
  position: number
  color?: string | null
}

export async function listPipelines(organization_id: string): Promise<Pipeline[]> {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Pipeline[]
}

export async function createPipeline(input: CreatePipelineInput): Promise<Pipeline> {
  const { data, error } = await supabase
    .from('pipelines')
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      description: input.description ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Pipeline
}

export async function listPipelineStages(organization_id: string, pipeline_id: string): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('pipeline_id', pipeline_id)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as PipelineStage[]
}

export async function createPipelineStage(input: CreatePipelineStageInput): Promise<PipelineStage> {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert({
      organization_id: input.organization_id,
      pipeline_id: input.pipeline_id,
      name: input.name,
      position: input.position,
      color: input.color ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PipelineStage
}
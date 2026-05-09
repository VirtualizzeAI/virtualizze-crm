import supabase from './supabase'

import type { Pipeline, PipelineStage } from '../types'

interface CreatePipelineInput {
  organization_id: string
  name: string
  description?: string | null
}

interface UpdatePipelineInput {
  organization_id: string
  pipeline_id: string
  name?: string
  description?: string | null
}

interface CreatePipelineStageInput {
  organization_id: string
  pipeline_id: string
  name: string
  position: number
  color?: string | null
  description?: string | null
}

interface UpdatePipelineStageInput {
  organization_id: string
  pipeline_id: string
  stage_id: string
  name?: string
  position?: number
  color?: string | null
  description?: string | null
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

export async function updatePipeline(input: UpdatePipelineInput): Promise<Pipeline | null> {
  const payload: {
    name?: string
    description?: string | null
  } = {}

  if (typeof input.name !== 'undefined') {
    payload.name = input.name
  }

  if (typeof input.description !== 'undefined') {
    payload.description = input.description
  }

  const { data, error } = await supabase
    .from('pipelines')
    .update(payload)
    .eq('organization_id', input.organization_id)
    .eq('id', input.pipeline_id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as Pipeline | null) ?? null
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
      description: input.description ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PipelineStage
}

export async function updatePipelineStage(input: UpdatePipelineStageInput): Promise<PipelineStage | null> {
  const payload: {
    name?: string
    position?: number
    color?: string | null
    description?: string | null
  } = {}

  if (typeof input.name !== 'undefined') {
    payload.name = input.name
  }

  if (typeof input.position !== 'undefined') {
    payload.position = input.position
  }

  if (typeof input.color !== 'undefined') {
    payload.color = input.color
  }

  if (typeof input.description !== 'undefined') {
    payload.description = input.description
  }

  const { data, error } = await supabase
    .from('pipeline_stages')
    .update(payload)
    .eq('organization_id', input.organization_id)
    .eq('pipeline_id', input.pipeline_id)
    .eq('id', input.stage_id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as PipelineStage | null) ?? null
}

interface DeletePipelineStageOptions {
  /** If provided, deals in the deleted stage are moved here instead of being deleted. */
  transferToStageId?: string
}

export async function deletePipelineStage(
  organization_id: string,
  pipeline_id: string,
  stage_id: string,
  options: DeletePipelineStageOptions = {},
): Promise<void> {
  if (options.transferToStageId) {
    // Move deals to the target stage before deleting
    const { error: moveError } = await supabase
      .from('deals')
      .update({ stage_id: options.transferToStageId })
      .eq('organization_id', organization_id)
      .eq('stage_id', stage_id)

    if (moveError) {
      throw new Error(moveError.message)
    }
  } else {
    // Delete all deals in this stage first to satisfy FK constraint
    const { error: dealsError } = await supabase
      .from('deals')
      .delete()
      .eq('organization_id', organization_id)
      .eq('stage_id', stage_id)

    if (dealsError) {
      throw new Error(dealsError.message)
    }
  }

  const { error } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('organization_id', organization_id)
    .eq('pipeline_id', pipeline_id)
    .eq('id', stage_id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deletePipeline(organization_id: string, pipeline_id: string): Promise<void> {
  // Step 1: fetch all stage IDs belonging to this pipeline
  const { data: stages, error: stagesListError } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('pipeline_id', pipeline_id)

  if (stagesListError) {
    throw new Error(stagesListError.message)
  }

  const stageIds = (stages ?? []).map((s: { id: string }) => s.id)

  // Step 2: delete all deals that reference any of these stages
  // (filtering by stage_id guarantees FK constraint is satisfied)
  if (stageIds.length > 0) {
    const { error: dealsError } = await supabase
      .from('deals')
      .delete()
      .in('stage_id', stageIds)

    if (dealsError) {
      throw new Error(dealsError.message)
    }
  }

  // Step 3: delete all stages (no deals reference them anymore)
  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('organization_id', organization_id)
    .eq('pipeline_id', pipeline_id)

  if (stagesError) {
    throw new Error(stagesError.message)
  }

  // Step 4: delete the pipeline itself
  const { error } = await supabase
    .from('pipelines')
    .delete()
    .eq('organization_id', organization_id)
    .eq('id', pipeline_id)

  if (error) {
    throw new Error(error.message)
  }
}
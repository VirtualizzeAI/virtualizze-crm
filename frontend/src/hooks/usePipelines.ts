import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { getDeals } from '../api/deals'
import {
  createPipeline,
  createPipelineStage,
  deletePipeline,
  deletePipelineStage,
  getPipelines,
  getPipelineStages,
  updatePipeline,
  updatePipelineStage,
} from '../api/pipelines'
import type {
  CreatePipelinePayload,
  CreatePipelineStagePayload,
  DeletePipelineStagePayload,
  UpdatePipelinePayload,
  UpdatePipelineStagePayload,
} from '../api/pipelines'
import type { Pipeline } from '../lib/types'

export interface PipelineSummary {
  pipelineId: string
  stageCount: number
  dealCount: number
  totalValue: number
  isLoading: boolean
}

export function usePipelinesQuery() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: () => getPipelines(),
  })
}

export function usePipelineStagesQuery(pipelineId: string | null) {
  return useQuery({
    queryKey: ['pipelines', pipelineId, 'stages'],
    queryFn: () => getPipelineStages(pipelineId as string),
    enabled: Boolean(pipelineId),
  })
}

export function useCreatePipelineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePipelinePayload) => createPipeline(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
  })
}

export function useUpdatePipelineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdatePipelinePayload) => updatePipeline(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
  })
}

export function useCreatePipelineStageMutation(pipelineId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<CreatePipelineStagePayload, 'pipelineId'>) =>
      createPipelineStage({ pipelineId: pipelineId as string, ...payload }),
    onSuccess: async () => {
      if (pipelineId) {
        await queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'stages'] })
      }
    },
  })
}

export function useUpdatePipelineStageMutation(pipelineId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<UpdatePipelineStagePayload, 'pipelineId'>) =>
      updatePipelineStage({ pipelineId: pipelineId as string, ...payload }),
    onSuccess: async () => {
      if (pipelineId) {
        await queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'stages'] })
      }
    },
  })
}

export function useDeletePipelineStageMutation(pipelineId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<DeletePipelineStagePayload, 'pipelineId'>) =>
      deletePipelineStage({ pipelineId: pipelineId as string, ...payload }),
    onSuccess: async () => {
      if (pipelineId) {
        await queryClient.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'stages'] })
        await queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
      }
    },
  })
}

export function useDeletePipelineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pipelineId: string) => deletePipeline(pipelineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
  })
}

export function usePipelineSummaries(pipelines: Pipeline[]) {
  const stageResults = useQueries({
    queries: pipelines.map((pipeline) => ({
      queryKey: ['pipelines', pipeline.id, 'stages'],
      queryFn: () => getPipelineStages(pipeline.id),
      enabled: Boolean(pipeline.id),
    })),
  })

  const dealResults = useQueries({
    queries: pipelines.map((pipeline) => ({
      queryKey: ['deals', pipeline.id],
      queryFn: () => getDeals(pipeline.id),
      enabled: Boolean(pipeline.id),
    })),
  })

  return pipelines.map((pipeline, index) => {
    const stages = stageResults[index]?.data ?? []
    const allDeals = dealResults[index]?.data ?? []
    const validStageIds = new Set(stages.map((s) => s.id))
    const deals = allDeals.filter((d) => validStageIds.has(d.stage_id))

    return {
      pipelineId: pipeline.id,
      stageCount: stages.length,
      dealCount: deals.length,
      totalValue: deals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0),
      isLoading: (stageResults[index]?.isLoading || dealResults[index]?.isLoading) ?? false,
    } satisfies PipelineSummary
  })
}
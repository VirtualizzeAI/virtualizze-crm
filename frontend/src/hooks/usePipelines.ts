import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createPipeline, createPipelineStage, getPipelines, getPipelineStages } from '../api/pipelines'
import type { CreatePipelinePayload, CreatePipelineStagePayload } from '../api/pipelines'

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
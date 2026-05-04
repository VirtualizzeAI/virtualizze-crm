import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createDeal, getDeals, moveDeal } from '../api/deals'
import type { CreateDealPayload, MoveDealPayload } from '../api/deals'

export function useDealsQuery(pipelineId: string | null) {
  return useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: () => getDeals(pipelineId as string),
    enabled: Boolean(pipelineId),
  })
}

export function useCreateDealMutation(pipelineId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<CreateDealPayload, 'pipeline_id'>) =>
      createDeal({ pipeline_id: pipelineId as string, ...payload }),
    onSuccess: async () => {
      if (pipelineId) {
        await queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
      }
    },
  })
}

export function useMoveDealMutation(pipelineId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MoveDealPayload) => moveDeal(payload),
    onSuccess: async () => {
      if (pipelineId) {
        await queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
      }
    },
  })
}
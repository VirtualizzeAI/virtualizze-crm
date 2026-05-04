import api from '../lib/axios'
import type { Deal } from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiEntityResponse<T> {
  data: T
}

export interface CreateDealPayload {
  pipeline_id: string
  stage_id: string
  name: string
  value?: number
  description?: string | null
}

export interface MoveDealPayload {
  id: string
  stage_id: string
  position: number
}

export async function getDeals(pipelineId: string): Promise<Deal[]> {
  const response = await api.get<ApiListResponse<Deal>>('/deals', {
    params: { pipeline_id: pipelineId },
  })
  return response.data.data
}

export async function createDeal(payload: CreateDealPayload): Promise<Deal> {
  const response = await api.post<ApiEntityResponse<Deal>>('/deals', payload)
  return response.data.data
}

export async function moveDeal(payload: MoveDealPayload): Promise<Deal> {
  const response = await api.patch<ApiEntityResponse<Deal>>(`/deals/${payload.id}/move`, {
    stage_id: payload.stage_id,
    position: payload.position,
  })
  return response.data.data
}
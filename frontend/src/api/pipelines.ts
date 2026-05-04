import api from '../lib/axios'
import type { Pipeline, PipelineStage } from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiEntityResponse<T> {
  data: T
}

export interface CreatePipelinePayload {
  name: string
  description?: string | null
}

export interface CreatePipelineStagePayload {
  pipelineId: string
  name: string
  position: number
  color?: string | null
}

export async function getPipelines(): Promise<Pipeline[]> {
  const response = await api.get<ApiListResponse<Pipeline>>('/pipelines')
  return response.data.data
}

export async function createPipeline(payload: CreatePipelinePayload): Promise<Pipeline> {
  const response = await api.post<ApiEntityResponse<Pipeline>>('/pipelines', payload)
  return response.data.data
}

export async function getPipelineStages(pipelineId: string): Promise<PipelineStage[]> {
  const response = await api.get<ApiListResponse<PipelineStage>>(`/pipelines/${pipelineId}/stages`)
  return response.data.data
}

export async function createPipelineStage(payload: CreatePipelineStagePayload): Promise<PipelineStage> {
  const { pipelineId, ...body } = payload
  const response = await api.post<ApiEntityResponse<PipelineStage>>(`/pipelines/${pipelineId}/stages`, body)
  return response.data.data
}
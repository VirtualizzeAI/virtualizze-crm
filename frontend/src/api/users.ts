import api from '../lib/axios'
import type { UserSummary } from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

export async function getUsers(): Promise<UserSummary[]> {
  const response = await api.get<ApiListResponse<UserSummary>>('/users')
  return response.data.data
}
import api from '../lib/axios'
import type { AuthProfile, AuthSession, LoginRequest } from '../lib/types'

interface ApiResponse<T> {
  data: T
}

export async function login(payload: LoginRequest): Promise<AuthSession> {
  const response = await api.post<ApiResponse<AuthSession>>('/auth/login', payload)
  return response.data.data
}

export async function me(): Promise<AuthProfile> {
  const response = await api.get<ApiResponse<AuthProfile>>('/auth/me')
  return response.data.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
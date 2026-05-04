import api from '../lib/axios'
import type { Team, TeamAccessType, TeamMember } from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiEntityResponse<T> {
  data: T
}

export interface CreateTeamPayload {
  name: string
  description?: string | null
  access_type: TeamAccessType
}

export interface UpdateTeamPayload extends CreateTeamPayload {
  id: string
}

export interface AddTeamMemberPayload {
  teamId: string
  user_id: string
  role: 'leader' | 'member'
}

export async function getTeams(): Promise<Team[]> {
  const response = await api.get<ApiListResponse<Team>>('/teams')
  return response.data.data
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  const response = await api.post<ApiEntityResponse<Team>>('/teams', payload)
  return response.data.data
}

export async function updateTeam(payload: UpdateTeamPayload): Promise<Team> {
  const { id, ...data } = payload
  const response = await api.put<ApiEntityResponse<Team>>(`/teams/${id}`, data)
  return response.data.data
}

export async function removeTeam(id: string): Promise<void> {
  await api.delete(`/teams/${id}`)
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const response = await api.get<ApiListResponse<TeamMember>>(`/teams/${teamId}/members`)
  return response.data.data
}

export async function addTeamMember(payload: AddTeamMemberPayload): Promise<TeamMember> {
  const response = await api.post<ApiEntityResponse<TeamMember>>(`/teams/${payload.teamId}/members`, {
    user_id: payload.user_id,
    role: payload.role,
  })

  return response.data.data
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`)
}
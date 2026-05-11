import api from '../lib/axios'
import type { Task, TaskPriority, TaskStatus } from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiEntityResponse<T> {
  data: T
}

export interface GetTasksParams {
  search?: string
  status?: TaskStatus
  responsible_id?: string
  contact_id?: string
  due?: 'overdue' | 'today' | 'upcoming' | 'no_due'
}

export interface CreateTaskPayload {
  name: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  responsible_id?: string | null
  contact_id?: string | null
  due_date?: string | null
  attachment_urls?: string[]
}

export interface UpdateTaskPayload {
  id: string
  name?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  responsible_id?: string | null
  contact_id?: string | null
  due_date?: string | null
  attachment_urls?: string[]
}

export async function getTasks(params?: GetTasksParams): Promise<Task[]> {
  const response = await api.get<ApiListResponse<Task>>('/tasks', {
    params,
  })

  return response.data.data
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await api.post<ApiEntityResponse<Task>>('/tasks', payload)
  return response.data.data
}

export async function updateTask(payload: UpdateTaskPayload): Promise<Task> {
  const { id, ...data } = payload
  const response = await api.put<ApiEntityResponse<Task>>(`/tasks/${id}`, data)
  return response.data.data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

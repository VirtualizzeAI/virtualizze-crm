import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTask, deleteTask, getTasks, updateTask } from '../api/tasks'
import type { CreateTaskPayload, GetTasksParams, UpdateTaskPayload } from '../api/tasks'

export function useTasksQuery(params?: GetTasksParams) {
  return useQuery({
    queryKey: ['tasks', params ?? {}],
    queryFn: () => getTasks(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTaskPayload) => updateTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

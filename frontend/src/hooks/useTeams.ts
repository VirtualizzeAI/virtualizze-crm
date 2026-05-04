import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addTeamMember,
  createTeam,
  getTeamMembers,
  getTeams,
  removeTeam,
  removeTeamMember,
  updateTeam,
} from '../api/teams'
import type { AddTeamMemberPayload, CreateTeamPayload, UpdateTeamPayload } from '../api/teams'

export function useTeamsQuery() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  })
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTeamPayload) => updateTeam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeTeam(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useTeamMembersQuery(teamId: string | null) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => getTeamMembers(teamId as string),
    enabled: Boolean(teamId),
  })
}

export function useAddTeamMemberMutation(teamId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<AddTeamMemberPayload, 'teamId'>) =>
      addTeamMember({ ...payload, teamId: teamId as string }),
    onSuccess: async () => {
      if (teamId) {
        await queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] })
      }
    },
  })
}

export function useRemoveTeamMemberMutation(teamId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeTeamMember(teamId as string, userId),
    onSuccess: async () => {
      if (teamId) {
        await queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] })
      }
    },
  })
}
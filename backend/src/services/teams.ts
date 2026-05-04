import supabase from './supabase'

import type { Team, TeamAccessType } from '../types'

interface CreateTeamInput {
  organization_id: string
  name: string
  description?: string | null
  access_type: TeamAccessType
}

interface UpdateTeamInput {
  organization_id: string
  id: string
  name?: string
  description?: string | null
  access_type?: TeamAccessType
}

interface AddTeamMemberInput {
  organization_id: string
  team_id: string
  user_id: string
  role: 'leader' | 'member'
}

interface TeamMemberRow {
  id: string
  organization_id: string
  team_id: string
  user_id: string
  role: 'leader' | 'member'
  created_at: string
  user: {
    id: string
    name: string
    role: string
    avatar_url: string | null
  } | null
}

function normalizeTeamMemberRow(row: {
  id: string
  organization_id: string
  team_id: string
  user_id: string
  role: 'leader' | 'member'
  created_at: string
  user:
    | {
        id: string
        name: string
        role: string
        avatar_url: string | null
      }
    | Array<{
        id: string
        name: string
        role: string
        avatar_url: string | null
      }>
    | null
}): TeamMemberRow {
  const user = Array.isArray(row.user) ? (row.user[0] ?? null) : row.user

  return {
    id: row.id,
    organization_id: row.organization_id,
    team_id: row.team_id,
    user_id: row.user_id,
    role: row.role,
    created_at: row.created_at,
    user,
  }
}

export async function listTeams(organization_id: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Team[]
}

export async function getTeamById(organization_id: string, id: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as Team | null) ?? null
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      description: input.description ?? null,
      access_type: input.access_type,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Team
}

export async function updateTeam(input: UpdateTeamInput): Promise<Team | null> {
  const updatePayload: {
    name?: string
    description?: string | null
    access_type?: TeamAccessType
  } = {}

  if (typeof input.name !== 'undefined') {
    updatePayload.name = input.name
  }

  if (typeof input.description !== 'undefined') {
    updatePayload.description = input.description
  }

  if (typeof input.access_type !== 'undefined') {
    updatePayload.access_type = input.access_type
  }

  const { data, error } = await supabase
    .from('teams')
    .update(updatePayload)
    .eq('organization_id', input.organization_id)
    .eq('id', input.id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as Team | null) ?? null
}

export async function deleteTeam(organization_id: string, id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('teams')
    .delete({ count: 'exact' })
    .eq('organization_id', organization_id)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  return (count ?? 0) > 0
}

export async function listTeamMembers(organization_id: string, team_id: string): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, organization_id, team_id, user_id, role, created_at, user:users(id, name, role, avatar_url)')
    .eq('organization_id', organization_id)
    .eq('team_id', team_id)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Array<{
    id: string
    organization_id: string
    team_id: string
    user_id: string
    role: 'leader' | 'member'
    created_at: string
    user:
      | {
          id: string
          name: string
          role: string
          avatar_url: string | null
        }
      | Array<{
          id: string
          name: string
          role: string
          avatar_url: string | null
        }>
      | null
  }>).map(normalizeTeamMemberRow)
}

export async function addTeamMember(input: AddTeamMemberInput): Promise<TeamMemberRow> {
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('organization_id', input.organization_id)
    .eq('id', input.team_id)
    .maybeSingle()

  if (!team) {
    throw new Error('Equipe não encontrada')
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', input.organization_id)
    .eq('id', input.user_id)
    .maybeSingle()

  if (!user) {
    throw new Error('Usuário não encontrado na organização')
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      organization_id: input.organization_id,
      team_id: input.team_id,
      user_id: input.user_id,
      role: input.role,
    })
    .select('id, organization_id, team_id, user_id, role, created_at, user:users(id, name, role, avatar_url)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeTeamMemberRow(data as {
    id: string
    organization_id: string
    team_id: string
    user_id: string
    role: 'leader' | 'member'
    created_at: string
    user:
      | {
          id: string
          name: string
          role: string
          avatar_url: string | null
        }
      | Array<{
          id: string
          name: string
          role: string
          avatar_url: string | null
        }>
      | null
  })
}

export async function removeTeamMember(
  organization_id: string,
  team_id: string,
  user_id: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from('team_members')
    .delete({ count: 'exact' })
    .eq('organization_id', organization_id)
    .eq('team_id', team_id)
    .eq('user_id', user_id)

  if (error) {
    throw new Error(error.message)
  }

  return (count ?? 0) > 0
}
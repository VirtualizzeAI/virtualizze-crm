import { useState } from 'react'

import { TeamForm, TeamList, TeamMembersPanel } from '../components/teams'
import { useCreateTeamMutation, useDeleteTeamMutation, useTeamsQuery, useUpdateTeamMutation } from '../hooks'
import type { Team, TeamAccessType } from '../lib/types'

export default function TeamsPage() {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [membersTeam, setMembersTeam] = useState<Team | null>(null)

  const teamsQuery = useTeamsQuery()
  const createTeamMutation = useCreateTeamMutation()
  const updateTeamMutation = useUpdateTeamMutation()
  const deleteTeamMutation = useDeleteTeamMutation()

  const isSubmitting = createTeamMutation.isPending || updateTeamMutation.isPending

  const handleSubmit = async (values: {
    name: string
    description: string | null
    access_type: TeamAccessType
  }) => {
    if (editingTeam) {
      await updateTeamMutation.mutateAsync({ id: editingTeam.id, ...values })
      setEditingTeam(null)
      return
    }

    await createTeamMutation.mutateAsync(values)
  }

  const handleDelete = async (teamId: string) => {
    await deleteTeamMutation.mutateAsync(teamId)

    if (editingTeam?.id === teamId) {
      setEditingTeam(null)
    }

    if (membersTeam?.id === teamId) {
      setMembersTeam(null)
    }
  }

  const mutationError = createTeamMutation.error || updateTeamMutation.error || deleteTeamMutation.error

  if (teamsQuery.isLoading) {
    return (
      <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
        <p className="text-sm text-ink/70">Carregando equipes...</p>
      </section>
    )
  }

  if (teamsQuery.isError) {
    return (
      <section className="rounded-xl border border-coral/30 bg-coral/10 p-8 shadow-panel">
        <p className="text-sm text-coral">Não foi possível carregar equipes.</p>
        <button
          type="button"
          onClick={() => void teamsQuery.refetch()}
          className="mt-3 rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  const teams = teamsQuery.data ?? []

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <TeamForm
          team={editingTeam}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingTeam(null)}
        />

        {mutationError ? (
          <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
            Ocorreu um erro ao salvar alterações de equipe.
          </p>
        ) : null}

        <TeamMembersPanel selectedTeam={membersTeam} />
      </div>

      {teams.length === 0 ? (
        <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Nenhuma equipe cadastrada</h2>
          <p className="mt-2 text-sm text-ink/65">Crie a primeira equipe para começar a organizar o atendimento.</p>
        </section>
      ) : (
        <TeamList
          teams={teams}
          deletingTeamId={deleteTeamMutation.isPending ? deleteTeamMutation.variables ?? null : null}
          onEdit={setEditingTeam}
          onDelete={handleDelete}
          onManageMembers={setMembersTeam}
        />
      )}
    </div>
  )
}
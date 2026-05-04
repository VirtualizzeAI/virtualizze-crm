import { useMemo, useState } from 'react'

import {
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useTeamMembersQuery,
  useUsersQuery,
} from '../../hooks'
import type { Team } from '../../lib/types'

interface TeamMembersPanelProps {
  selectedTeam: Team | null
}

export function TeamMembersPanel({ selectedTeam }: TeamMembersPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [role, setRole] = useState<'leader' | 'member'>('member')

  const usersQuery = useUsersQuery()
  const membersQuery = useTeamMembersQuery(selectedTeam?.id ?? null)
  const addMemberMutation = useAddTeamMemberMutation(selectedTeam?.id ?? null)
  const removeMemberMutation = useRemoveTeamMemberMutation(selectedTeam?.id ?? null)

  const availableUsers = useMemo(() => {
    const users = usersQuery.data ?? []
    const members = membersQuery.data ?? []
    const memberIds = new Set(members.map((member) => member.user_id))
    return users.filter((user) => !memberIds.has(user.id))
  }, [membersQuery.data, usersQuery.data])

  const handleAdd = async () => {
    if (!selectedTeam || !selectedUserId) {
      return
    }

    await addMemberMutation.mutateAsync({ user_id: selectedUserId, role })
    setSelectedUserId('')
    setRole('member')
  }

  if (!selectedTeam) {
    return (
      <section className="rounded-xl border border-black/10 bg-white/85 p-5 shadow-panel">
        <h3 className="text-base font-semibold text-ink">Membros da equipe</h3>
        <p className="mt-2 text-sm text-ink/65">Selecione uma equipe na lista para gerenciar os membros.</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white/85 p-5 shadow-panel">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-ink">Membros de {selectedTeam.name}</h3>
        <p className="text-sm text-ink/65">Adicione ou remova membros da equipe selecionada.</p>
      </header>

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_120px]">
        <select
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          <option value="">Selecione um usuário</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        <select value={role} onChange={(event) => setRole(event.target.value as 'leader' | 'member')} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
          <option value="member">Membro</option>
          <option value="leader">Líder</option>
        </select>

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!selectedUserId || addMemberMutation.isPending}
          className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addMemberMutation.isPending ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>

      {membersQuery.isLoading ? <p className="text-sm text-ink/65">Carregando membros...</p> : null}

      {membersQuery.isError ? (
        <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          Não foi possível carregar os membros da equipe.
        </p>
      ) : null}

      <ul className="space-y-2">
        {(membersQuery.data ?? []).map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-ink">{member.user?.name ?? member.user_id}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{member.role}</p>
            </div>

            <button
              type="button"
              onClick={() => void removeMemberMutation.mutateAsync(member.user_id)}
              disabled={removeMemberMutation.isPending}
              className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-1 text-xs font-semibold text-coral disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
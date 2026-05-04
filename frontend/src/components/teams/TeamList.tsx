import type { Team } from '../../lib/types'

interface TeamListProps {
  teams: Team[]
  deletingTeamId: string | null
  onEdit: (team: Team) => void
  onDelete: (teamId: string) => Promise<void>
  onManageMembers: (team: Team) => void
}

const accessTypeLabels: Record<Team['access_type'], string> = {
  all_contacts: 'Todos os contatos',
  assigned_only: 'Apenas atribuídos',
  team_only: 'Somente equipe',
}

export function TeamList({ teams, deletingTeamId, onEdit, onDelete, onManageMembers }: TeamListProps) {
  return (
    <section className="rounded-xl border border-black/10 bg-white/85 p-5 shadow-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-ink">Equipes cadastradas</h2>
        <p className="text-sm text-ink/65">Gerencie equipes operacionais e seus níveis de acesso.</p>
      </header>

      <ul className="space-y-3">
        {teams.map((team) => (
          <li key={team.id} className="rounded-lg border border-black/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-ink">{team.name}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-pine">
                  {accessTypeLabels[team.access_type]}
                </p>
                <p className="mt-2 text-sm text-ink/70">{team.description || 'Sem descrição'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onManageMembers(team)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80"
                >
                  Membros
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(team)}
                  className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(team.id)}
                  disabled={deletingTeamId === team.id}
                  className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingTeamId === team.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
import type { Task } from '../../lib/types'

interface TaskListProps {
  tasks: Task[]
  selectedTaskId: string | null
  onSelectTask: (task: Task) => void
}

const statusLabels: Record<Task['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
}

const priorityLabels: Record<Task['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

function formatDate(date: string | null): string {
  if (!date) {
    return 'Sem vencimento'
  }

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return 'Sem vencimento'
  }

  return parsed.toLocaleDateString('pt-BR')
}

export function TaskList({ tasks, selectedTaskId, onSelectTask }: TaskListProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-panel">
      <header className="border-b border-black/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">Tarefas</h2>
        <p className="text-sm text-ink/65">Selecione uma tarefa para visualizar ou editar.</p>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-paper/60 text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
              <th scope="col" className="px-5 py-3">
                Nome
              </th>
              <th scope="col" className="px-5 py-3">
                Responsável
              </th>
              <th scope="col" className="px-5 py-3">
                Cliente
              </th>
              <th scope="col" className="px-5 py-3">
                Vencimento
              </th>
              <th scope="col" className="px-5 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`cursor-pointer border-b border-black/5 transition hover:bg-pine/5 ${
                  selectedTaskId === task.id ? 'bg-pine/10' : 'bg-white'
                }`}
              >
                <td className="px-5 py-3">
                  <p className="font-semibold text-ink">{task.name}</p>
                  <p className="mt-1 text-xs text-ink/60">Prioridade {priorityLabels[task.priority]}</p>
                </td>
                <td className="px-5 py-3 text-ink/80">{task.responsible?.name ?? 'Não definido'}</td>
                <td className="px-5 py-3 text-ink/80">{task.contact?.name ?? 'Não vinculado'}</td>
                <td className="px-5 py-3 text-ink/80">{formatDate(task.due_date)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex rounded-full border border-black/10 bg-paper px-2 py-1 text-xs font-semibold text-ink/80">
                    {statusLabels[task.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

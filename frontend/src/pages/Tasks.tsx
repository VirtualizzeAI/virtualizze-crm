import { useEffect, useMemo, useState } from 'react'

import { Filter, Plus, Search } from 'lucide-react'

import { TaskForm, TaskList } from '../components/tasks'
import {
  useContactsQuery,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
  useUsersQuery,
} from '../hooks'
import type { Task, TaskPriority, TaskStatus } from '../lib/types'

export default function TasksPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [search, statusFilter],
  )

  const tasksQuery = useTasksQuery(queryParams)
  const usersQuery = useUsersQuery()
  const contactsQuery = useContactsQuery()

  const createTaskMutation = useCreateTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()

  const tasks = tasksQuery.data ?? []
  const users = usersQuery.data ?? []
  const contacts = contactsQuery.data ?? []

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  const isSubmitting = createTaskMutation.isPending || updateTaskMutation.isPending

  const mutationError = createTaskMutation.error || updateTaskMutation.error || deleteTaskMutation.error

  const handleSubmit = async (values: {
    name: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    responsible_id: string | null
    contact_id: string | null
    due_date: string | null
    attachment_urls: string[]
  }) => {
    if (selectedTask) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        ...values,
      })

      setIsTaskModalOpen(false)
      setSelectedTaskId(null)

      return
    }

    await createTaskMutation.mutateAsync(values)
    setIsTaskModalOpen(false)
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync(taskId)
    setIsTaskModalOpen(false)
    setSelectedTaskId(null)
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id)
    setIsTaskModalOpen(true)
  }

  const handleCreateMode = () => {
    setSelectedTaskId(null)
    setIsTaskModalOpen(true)
  }

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false)
    setSelectedTaskId(null)
  }

  if ((!tasksQuery.data && tasksQuery.isLoading) || (!usersQuery.data && usersQuery.isLoading)) {
    return (
      <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
        <p className="text-sm text-ink/70">Carregando tarefas...</p>
      </section>
    )
  }

  if (tasksQuery.isError || usersQuery.isError || contactsQuery.isError) {
    return (
      <section className="rounded-xl border border-coral/30 bg-coral/10 p-8 shadow-panel">
        <p className="text-sm text-coral">Não foi possível carregar tarefas.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void tasksQuery.refetch()}
            className="rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
          >
            Recarregar tarefas
          </button>
          <button
            type="button"
            onClick={() => void usersQuery.refetch()}
            className="rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
          >
            Recarregar usuários
          </button>
          <button
            type="button"
            onClick={() => void contactsQuery.refetch()}
            className="rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
          >
            Recarregar clientes
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/85 p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Buscar tarefa</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/45" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Pesquisar tarefas"
                className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-pine"
              />
            </span>
          </label>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Filtros</p>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/80"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Abrir filtros'}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Nova tarefa</p>
            <button
              type="button"
              onClick={handleCreateMode}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-pine/30 bg-pine px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Criar tarefa
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-3 grid gap-3 border-t border-black/10 pt-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluída</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>

      {mutationError ? (
        <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          Ocorreu um erro ao salvar alterações de tarefa.
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Nenhuma tarefa cadastrada</h2>
          <p className="mt-2 text-sm text-ink/65">Crie a primeira tarefa para organizar o trabalho da equipe.</p>
        </section>
      ) : (
        <TaskList tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={handleSelectTask} />
      )}

      {isTaskModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-6"
          onClick={handleCloseTaskModal}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <TaskForm
              task={selectedTask}
              users={users}
              contacts={contacts}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onDelete={handleDeleteTask}
              onCancelEdit={handleCloseTaskModal}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
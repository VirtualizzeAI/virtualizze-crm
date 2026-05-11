import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import type { Contact, Task, TaskPriority, TaskStatus, UserSummary } from '../../lib/types'

interface TaskFormValues {
  name: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  responsible_id: string | null
  contact_id: string | null
  due_date: string | null
  attachment_urls: string[]
}

interface TaskFormProps {
  task: Task | null
  users: UserSummary[]
  contacts: Contact[]
  isSubmitting: boolean
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancelEdit: () => void
  onDelete: (taskId: string) => Promise<void>
}

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluída' },
]

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

function normalizeEditorValue(value: string): string | null {
  const plainText = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) {
    return null
  }

  return value
}

export function TaskForm({ task, users, contacts, isSubmitting, onSubmit, onCancelEdit, onDelete }: TaskFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [responsibleId, setResponsibleId] = useState('')
  const [contactId, setContactId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([''])
  const editorRef = useRef<HTMLDivElement | null>(null)

  const isEditing = Boolean(task)

  useEffect(() => {
    setName(task?.name ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? 'pending')
    setPriority(task?.priority ?? 'medium')
    setResponsibleId(task?.responsible_id ?? '')
    setContactId(task?.contact_id ?? '')
    setDueDate(task?.due_date ?? '')
    setAttachmentUrls(task?.attachment_urls?.length ? task.attachment_urls : [''])
  }, [task])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== description) {
      editorRef.current.innerHTML = description
    }
  }, [description])

  const validAttachmentUrls = useMemo(
    () => attachmentUrls.map((item) => item.trim()).filter((item) => item.length > 0),
    [attachmentUrls],
  )

  const handleCommand = (command: 'bold' | 'insertUnorderedList') => {
    editorRef.current?.focus()
    document.execCommand(command)
  }

  const handleInsertTodo = () => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, '<div>☐ Novo item</div>')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await onSubmit({
      name: name.trim(),
      description: normalizeEditorValue(description),
      status,
      priority,
      responsible_id: responsibleId || null,
      contact_id: contactId || null,
      due_date: dueDate || null,
      attachment_urls: validAttachmentUrls,
    })

    if (!isEditing) {
      setName('')
      setDescription('')
      setStatus('pending')
      setPriority('medium')
      setResponsibleId('')
      setContactId('')
      setDueDate('')
      setAttachmentUrls([''])
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white/85 p-5 shadow-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</h2>
        <p className="text-sm text-ink/65">Nome, descrição, responsável, cliente, vencimento e anexos.</p>
      </header>

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Retornar proposta comercial"
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            required
            minLength={2}
          />
        </label>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Descrição</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCommand('bold')}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/80"
            >
              Negrito
            </button>
            <button
              type="button"
              onClick={handleInsertTodo}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/80"
            >
              To-do
            </button>
            <button
              type="button"
              onClick={() => handleCommand('insertUnorderedList')}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/80"
            >
              Lista
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={(event) => setDescription((event.target as HTMLDivElement).innerHTML)}
            className="min-h-28 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Responsável</span>
            <select
              value={responsibleId}
              onChange={(event) => setResponsibleId(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            >
              <option value="">Não definido</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Cliente</span>
            <select
              value={contactId}
              onChange={(event) => setContactId(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            >
              <option value="">Não vinculado</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Vencimento</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Prioridade</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Anexos (links)</span>
            <button
              type="button"
              onClick={() => setAttachmentUrls((current) => [...current, ''])}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/80"
            >
              Adicionar link
            </button>
          </div>

          {attachmentUrls.map((url, index) => (
            <div key={`attachment-${index}`} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(event) => {
                  const next = [...attachmentUrls]
                  next[index] = event.target.value
                  setAttachmentUrls(next)
                }}
                placeholder="https://..."
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
              <button
                type="button"
                onClick={() => {
                  if (attachmentUrls.length === 1) {
                    setAttachmentUrls([''])
                    return
                  }

                  setAttachmentUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }}
                className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg border border-pine/30 bg-pine px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar tarefa'}
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/80"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!task) {
                    return
                  }

                  void onDelete(task.id)
                }}
                className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-2 text-sm font-semibold text-coral"
              >
                Excluir tarefa
              </button>
            </>
          ) : null}
        </div>
      </form>
    </section>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Team, TeamAccessType } from '../../lib/types'

const TeamFormSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres'),
  description: z.string().optional(),
  access_type: z.enum(['all_contacts', 'assigned_only', 'team_only']),
})

type TeamFormData = z.infer<typeof TeamFormSchema>

interface TeamFormProps {
  team: Team | null
  isSubmitting: boolean
  onSubmit: (values: { name: string; description: string | null; access_type: TeamAccessType }) => Promise<void>
  onCancelEdit: () => void
}

const accessTypeOptions: Array<{ value: TeamAccessType; label: string }> = [
  { value: 'all_contacts', label: 'Todos os contatos' },
  { value: 'assigned_only', label: 'Apenas atribuídos' },
  { value: 'team_only', label: 'Somente equipe' },
]

export function TeamForm({ team, isSubmitting, onSubmit, onCancelEdit }: TeamFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(TeamFormSchema),
    defaultValues: {
      name: '',
      description: '',
      access_type: 'team_only',
    },
  })

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        description: team.description ?? '',
        access_type: team.access_type,
      })
      return
    }

    reset({
      name: '',
      description: '',
      access_type: 'team_only',
    })
  }, [team, reset])

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      description: values.description?.trim() ? values.description : null,
    })

    if (!team) {
      reset({
        name: '',
        description: '',
        access_type: 'team_only',
      })
    }
  })

  return (
    <form className="rounded-xl border border-black/10 bg-white/85 p-5 shadow-panel" onSubmit={submit}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{team ? 'Editar equipe' : 'Nova equipe'}</h2>
        <p className="text-sm text-ink/65">Configure o nome, o escopo de acesso e uma descrição opcional.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="team-name">
            Nome
          </label>
          <input
            id="team-name"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-pine"
            {...register('name')}
          />
          {errors.name ? <p className="mt-1 text-xs text-coral">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="team-access">
            Tipo de acesso
          </label>
          <select
            id="team-access"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-pine"
            {...register('access_type')}
          >
            {accessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink" htmlFor="team-description">
            Descrição
          </label>
          <textarea
            id="team-description"
            rows={3}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-pine"
            {...register('description')}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : team ? 'Salvar alterações' : 'Criar equipe'}
        </button>

        {team ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-ink/80"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  )
}
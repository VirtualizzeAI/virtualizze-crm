import { useEffect, useMemo, useState } from 'react'

import { KanbanBoard } from '../components/crm'
import {
  useCreateDealMutation,
  useCreatePipelineMutation,
  useCreatePipelineStageMutation,
  useDealsQuery,
  useMoveDealMutation,
  usePipelinesQuery,
  usePipelineStagesQuery,
} from '../hooks'

export default function CRMPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [newDealName, setNewDealName] = useState('')
  const [newDealValue, setNewDealValue] = useState('')
  const [newDealStageId, setNewDealStageId] = useState('')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')

  const pipelinesQuery = usePipelinesQuery()
  const createPipelineMutation = useCreatePipelineMutation()

  const stagesQuery = usePipelineStagesQuery(selectedPipelineId)
  const createStageMutation = useCreatePipelineStageMutation(selectedPipelineId)

  const dealsQuery = useDealsQuery(selectedPipelineId)
  const createDealMutation = useCreateDealMutation(selectedPipelineId)
  const moveDealMutation = useMoveDealMutation(selectedPipelineId)

  const pipelines = pipelinesQuery.data ?? []
  const stages = stagesQuery.data ?? []
  const deals = dealsQuery.data ?? []

  const filteredDeals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const parsedMin = minValue.trim() ? Number(minValue.replace(',', '.')) : null
    const parsedMax = maxValue.trim() ? Number(maxValue.replace(',', '.')) : null

    return deals.filter((deal) => {
      if (stageFilter !== 'all' && deal.stage_id !== stageFilter) {
        return false
      }

      if (normalizedSearch) {
        const haystack = `${deal.name} ${deal.description ?? ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }

      const dealValue = Number(deal.value ?? 0)

      if (parsedMin !== null && dealValue < parsedMin) {
        return false
      }

      if (parsedMax !== null && dealValue > parsedMax) {
        return false
      }

      return true
    })
  }, [deals, maxValue, minValue, search, stageFilter])

  const visibleStages = useMemo(() => {
    if (stageFilter === 'all') {
      return stages
    }

    return stages.filter((stage) => stage.id === stageFilter)
  }, [stageFilter, stages])

  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id)
    }
  }, [pipelines, selectedPipelineId])

  useEffect(() => {
    if (!newDealStageId && stages.length > 0) {
      setNewDealStageId(stages[0].id)
    }
  }, [newDealStageId, stages])

  const nextStagePosition = useMemo(() => {
    if (stages.length === 0) {
      return 0
    }

    return Math.max(...stages.map((stage) => stage.position)) + 1
  }, [stages])

  const handleCreatePipeline = async () => {
    const name = newPipelineName.trim()
    if (!name) {
      return
    }

    const created = await createPipelineMutation.mutateAsync({ name })
    setNewPipelineName('')
    setSelectedPipelineId(created.id)
  }

  const handleCreateStage = async () => {
    const name = newStageName.trim()
    if (!selectedPipelineId || !name) {
      return
    }

    await createStageMutation.mutateAsync({
      name,
      position: nextStagePosition,
    })
    setNewStageName('')
  }

  const handleCreateDeal = async () => {
    const name = newDealName.trim()
    if (!selectedPipelineId || !newDealStageId || !name) {
      return
    }

    await createDealMutation.mutateAsync({
      stage_id: newDealStageId,
      name,
      value: newDealValue.trim() ? Number(newDealValue.replace(',', '.')) : 0,
    })

    setNewDealName('')
    setNewDealValue('')
  }

  const handleMoveDeal = async (dealId: string, stageId: string) => {
    const position = deals.filter((deal) => deal.stage_id === stageId).length
    await moveDealMutation.mutateAsync({ id: dealId, stage_id: stageId, position })
  }

  const handleClearFilters = () => {
    setSearch('')
    setStageFilter('all')
    setMinValue('')
    setMaxValue('')
  }

  if (pipelinesQuery.isLoading) {
    return (
      <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
        <p className="text-sm text-ink/70">Carregando CRM...</p>
      </section>
    )
  }

  if (pipelinesQuery.isError) {
    return (
      <section className="rounded-xl border border-coral/30 bg-coral/10 p-8 shadow-panel">
        <p className="text-sm text-coral">Não foi possível carregar pipelines.</p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Filtros do Kanban</h2>
            <p className="text-sm text-ink/65">Use busca e filtros para localizar rapidamente negócios no funil.</p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/75"
          >
            Limpar filtros
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Pesquisar negócio</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder="Nome ou descrição"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Etapa</label>
            <select
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value="all">Todas as etapas</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Valor mínimo</label>
            <input
              value={minValue}
              onChange={(event) => setMinValue(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Valor máximo</label>
            <input
              value={maxValue}
              onChange={(event) => setMaxValue(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder="10000,00"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white/85 p-4 shadow-panel">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Pipeline ativo</label>
            <select
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={selectedPipelineId ?? ''}
              onChange={(event) => setSelectedPipelineId(event.target.value || null)}
            >
              <option value="">Selecione</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[260px] flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Novo pipeline</label>
            <div className="flex gap-2">
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                placeholder="Ex.: Vendas B2B"
                value={newPipelineName}
                onChange={(event) => setNewPipelineName(event.target.value)}
              />
              <button
                type="button"
                onClick={() => void handleCreatePipeline()}
                disabled={createPipelineMutation.isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Criar
              </button>
            </div>
          </div>
        </div>

        {selectedPipelineId ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Nova etapa</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Ex.: Proposta"
                  value={newStageName}
                  onChange={(event) => setNewStageName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateStage()}
                  disabled={createStageMutation.isPending || !selectedPipelineId}
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Adicionar etapa
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Novo negócio</label>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_150px_100px]">
                <input
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Nome do negócio"
                  value={newDealName}
                  onChange={(event) => setNewDealName(event.target.value)}
                />
                <input
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                  placeholder="Valor"
                  value={newDealValue}
                  onChange={(event) => setNewDealValue(event.target.value)}
                />
                <select
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={newDealStageId}
                  onChange={(event) => setNewDealStageId(event.target.value)}
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleCreateDeal()}
                  disabled={createDealMutation.isPending || stages.length === 0}
                  className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink/65">Crie um pipeline para começar a montar seu Kanban.</p>
        )}
      </section>

      {selectedPipelineId ? (
        stagesQuery.isLoading || dealsQuery.isLoading ? (
          <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
            <p className="text-sm text-ink/70">Carregando etapas e negócios...</p>
          </section>
        ) : stages.length === 0 ? (
          <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Nenhuma etapa cadastrada</h2>
            <p className="mt-2 text-sm text-ink/65">Adicione a primeira etapa para começar a movimentar negócios no Kanban.</p>
          </section>
        ) : (
          <KanbanBoard
            stages={visibleStages}
            deals={filteredDeals}
            movingDealId={moveDealMutation.isPending ? moveDealMutation.variables?.id ?? null : null}
            onMoveDeal={handleMoveDeal}
          />
        )
      ) : null}
    </div>
  )
}
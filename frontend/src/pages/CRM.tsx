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
  useUpdateDealMutation,
  useUpdatePipelineStageMutation,
} from '../hooks'

export default function CRMPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [newDealName, setNewDealName] = useState('')
  const [newDealValue, setNewDealValue] = useState('')
  const [newDealDescription, setNewDealDescription] = useState('')
  const [newDealStageId, setNewDealStageId] = useState('')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [showManagePipelines, setShowManagePipelines] = useState(false)

  const pipelinesQuery = usePipelinesQuery()
  const createPipelineMutation = useCreatePipelineMutation()

  const stagesQuery = usePipelineStagesQuery(selectedPipelineId)
  const createStageMutation = useCreatePipelineStageMutation(selectedPipelineId)
  const updateStageMutation = useUpdatePipelineStageMutation(selectedPipelineId)

  const dealsQuery = useDealsQuery(selectedPipelineId)
  const createDealMutation = useCreateDealMutation(selectedPipelineId)
  const moveDealMutation = useMoveDealMutation(selectedPipelineId)
  const updateDealMutation = useUpdateDealMutation(selectedPipelineId)

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
    if (stages.length === 0) {
      setNewDealStageId('')
      return
    }

    const selectedStageExists = stages.some((stage) => stage.id === newDealStageId)
    if (!selectedStageExists) {
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

  const handleCreateStage = async (name = 'Nova etapa') => {
    const trimmedName = name.trim()
    if (!selectedPipelineId || !trimmedName) {
      return
    }

    await createStageMutation.mutateAsync({
      name: trimmedName,
      position: nextStagePosition,
    })
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
      description: newDealDescription.trim() ? newDealDescription.trim() : null,
    })

    setNewDealName('')
    setNewDealValue('')
    setNewDealDescription('')
    setShowNewDealModal(false)
  }

  const handleMoveDeal = async (dealId: string, stageId: string, position: number) => {
    await moveDealMutation.mutateAsync({ id: dealId, stage_id: stageId, position })
  }

  const handleUpdateStageConfig = async (payload: {
    stageId: string
    name: string
    color: string | null
  }) => {
    await updateStageMutation.mutateAsync({
      stageId: payload.stageId,
      name: payload.name,
      color: payload.color,
    })
  }

  const handleUpdateDeal = async (payload: {
    id: string
    stage_id: string
    name: string
    value: number
    description: string | null
    status: 'open' | 'won' | 'lost'
  }) => {
    await updateDealMutation.mutateAsync(payload)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStageFilter('all')
    setMinValue('')
    setMaxValue('')
  }

  const handleCreateDealAtStage = (stageId: string) => {
    setNewDealStageId(stageId)
    setShowNewDealModal(true)
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
      {/* Barra de controle principal */}
      <section className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-panel">
        <div className="flex flex-wrap items-center gap-3">
          {/* Seleção de Pipeline */}
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-ink/70">Pipeline</label>
            <select
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-medium"
              value={selectedPipelineId ?? ''}
              onChange={(event) => setSelectedPipelineId(event.target.value || null)}
            >
              <option value="">Selecione um pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Pesquisa */}
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-ink/70">Buscar negócio</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              placeholder="Pesquisar negócios..."
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                showFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-black/10 bg-white text-ink/75 hover:bg-slate-50'
              }`}
            >
              Filtros
            </button>

            <button
              type="button"
              onClick={() => setShowNewDealModal(true)}
              disabled={!selectedPipelineId}
              className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink/75 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Novo Negócio
            </button>

            <button
              type="button"
              onClick={() => setShowManagePipelines(!showManagePipelines)}
              className="rounded-lg border border-black/10 bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
            >
              Gerenciar Pipelines
            </button>
          </div>
        </div>

        {/* Painel de Filtros Expandível */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-black/10 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Filtros Avançados</h3>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-ink/60 hover:text-ink"
              >
                Limpar filtros
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Etapa</label>
                <select
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
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
                <label className="mb-1 block text-xs font-semibold text-ink/70">Valor mínimo</label>
                <input
                  value={minValue}
                  onChange={(event) => setMinValue(event.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Valor máximo</label>
                <input
                  value={maxValue}
                  onChange={(event) => setMaxValue(event.target.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="10000,00"
                />
              </div>
            </div>
          </div>
        )}

        {/* Painel Gerenciar Pipelines */}
        {showManagePipelines && (
          <div className="mt-4 space-y-4 rounded-lg border border-black/10 bg-blue-50 p-4">
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink">Criar Novo Pipeline</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                  placeholder="Ex.: Vendas B2B, Vendas Varejo..."
                  value={newPipelineName}
                  onChange={(event) => setNewPipelineName(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleCreatePipeline()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleCreatePipeline()}
                  disabled={createPipelineMutation.isPending || !newPipelineName.trim()}
                  className="rounded-lg bg-ink px-6 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createPipelineMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold text-ink">Pipelines Existentes</h3>
              <div className="space-y-2">
                {pipelines.length === 0 ? (
                  <p className="text-sm text-ink/60">Nenhum pipeline cadastrado ainda.</p>
                ) : (
                  pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2"
                    >
                      <span className="text-sm font-medium text-ink">{pipeline.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPipelineId(pipeline.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {showNewDealModal && selectedPipelineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-xl border border-black/10 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">+ Novo Negócio</h3>
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-ink/60 hover:bg-slate-100 hover:text-ink"
              >
                Fechar
              </button>
            </div>

            {stages.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Você precisa criar uma etapa antes de cadastrar um negócio.
              </div>
            ) : (
              <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/70">Nome do negócio</label>
                    <input
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      placeholder="Nome do negócio"
                      value={newDealName}
                      onChange={(event) => setNewDealName(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/70">Valor</label>
                      <input
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                        placeholder="Valor"
                        value={newDealValue}
                        onChange={(event) => setNewDealValue(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink/70">Etapa</label>
                      <select
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                        value={newDealStageId}
                        onChange={(event) => setNewDealStageId(event.target.value)}
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink/70">Descrição</label>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      placeholder="Descrição (opcional)"
                      value={newDealDescription}
                      onChange={(event) => setNewDealDescription(event.target.value)}
                    />
                  </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewDealModal(false)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreateDeal()}
                disabled={stages.length === 0 || createDealMutation.isPending || !newDealName.trim()}
                className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createDealMutation.isPending ? 'Criando...' : 'Criar Negócio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {selectedPipelineId ? (
        stagesQuery.isLoading || dealsQuery.isLoading ? (
          <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
            <p className="text-sm text-ink/70">Carregando etapas e negócios...</p>
          </section>
        ) : stages.length === 0 ? (
          <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Nenhuma etapa cadastrada</h2>
            <p className="mt-2 text-sm text-ink/65">Crie sua primeira etapa para começar a montar seu Kanban.</p>
            <button
              type="button"
              onClick={() => void handleCreateStage()}
              disabled={createStageMutation.isPending}
              className="mt-4 rounded-xl border border-white/70 bg-white/40 px-4 py-2 text-sm font-semibold text-ink/75 backdrop-blur-md transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createStageMutation.isPending ? 'Criando etapa...' : '+ Nova etapa'}
            </button>
          </section>
        ) : (
          <KanbanBoard
            stages={visibleStages}
            workflowStages={stages}
            deals={filteredDeals}
            movingDealId={moveDealMutation.isPending ? moveDealMutation.variables?.id ?? null : null}
            onMoveDeal={handleMoveDeal}
            onUpdateDeal={handleUpdateDeal}
            updatingDealId={updateDealMutation.isPending ? updateDealMutation.variables?.id ?? null : null}
            onUpdateStageConfig={handleUpdateStageConfig}
            updatingStageId={updateStageMutation.isPending ? updateStageMutation.variables?.stageId ?? null : null}
            onCreateDealAtStage={handleCreateDealAtStage}
            creatingDealStageId={createDealMutation.isPending ? createDealMutation.variables?.stage_id ?? null : null}
            onQuickCreateStage={handleCreateStage}
            isCreatingStage={createStageMutation.isPending}
          />
        )
      ) : (
        <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Bem-vindo ao CRM</h2>
          <p className="mt-2 text-sm text-ink/65">
            Selecione um pipeline no menu acima ou clique em "Gerenciar Pipelines" para criar um novo.
          </p>
        </section>
      )}
    </div>
  )
}
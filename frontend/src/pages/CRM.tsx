import { useEffect, useMemo, useState } from 'react'

import { KanbanBoard } from '../components/crm'
import {
  useCreateDealMutation,
  useCreatePipelineMutation,
  useCreatePipelineStageMutation,
  useDealsQuery,
  useDeletePipelineMutation,
  useDeletePipelineStageMutation,
  useMoveDealMutation,
  usePipelinesQuery,
  usePipelineStagesQuery,
  usePipelineSummaries,
  useUpdateDealMutation,
  useUpdatePipelineMutation,
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
  const [selectedManagePipelineId, setSelectedManagePipelineId] = useState<string | null>(null)
  const [manageStageNameDrafts, setManageStageNameDrafts] = useState<Record<string, string>>({})
  const [managePipelineNameDraft, setManagePipelineNameDraft] = useState('')

  // Delete stage confirm modal
  const [deleteStageTarget, setDeleteStageTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteStageTransferTo, setDeleteStageTransferTo] = useState<string>('')
  const [deleteStageOption, setDeleteStageOption] = useState<'transfer' | 'delete'>('transfer')

  // Delete pipeline confirm modal
  const [deletePipelineTarget, setDeletePipelineTarget] = useState<{ id: string; name: string } | null>(null)

  const pipelinesQuery = usePipelinesQuery()
  const createPipelineMutation = useCreatePipelineMutation()
  const updatePipelineMutation = useUpdatePipelineMutation()

  const stagesQuery = usePipelineStagesQuery(selectedPipelineId)
  const createStageMutation = useCreatePipelineStageMutation(selectedPipelineId)
  const updateStageMutation = useUpdatePipelineStageMutation(selectedPipelineId)

  const managePipelineStagesQuery = usePipelineStagesQuery(selectedManagePipelineId)
  const createManageStageMutation = useCreatePipelineStageMutation(selectedManagePipelineId)
  const updateManageStageMutation = useUpdatePipelineStageMutation(selectedManagePipelineId)
  const deleteManageStageMutation = useDeletePipelineStageMutation(selectedManagePipelineId)
  const deletePipelineMutation = useDeletePipelineMutation()

  const dealsQuery = useDealsQuery(selectedPipelineId)
  const createDealMutation = useCreateDealMutation(selectedPipelineId)
  const moveDealMutation = useMoveDealMutation(selectedPipelineId)
  const updateDealMutation = useUpdateDealMutation(selectedPipelineId)

  const managePipelineStages = managePipelineStagesQuery.data ?? []
  const managePipelineDealsQuery = useDealsQuery(selectedManagePipelineId)
  const managePipelineDeals = managePipelineDealsQuery.data ?? []

  const pipelines = pipelinesQuery.data ?? []
  const stages = stagesQuery.data ?? []
  const deals = dealsQuery.data ?? []
  const pipelineSummaries = usePipelineSummaries(pipelines)
  const selectedManagePipeline = pipelines.find((pipeline) => pipeline.id === selectedManagePipelineId) ?? null

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

  const manageStageStats = useMemo(() => {
    const grouped = new Map<string, { dealCount: number; totalValue: number }>()

    managePipelineStages.forEach((stage) => {
      grouped.set(stage.id, { dealCount: 0, totalValue: 0 })
    })

    managePipelineDeals.forEach((deal) => {
      const current = grouped.get(deal.stage_id)
      if (!current) return // ignora deals em etapas deletadas/inválidas
      grouped.set(deal.stage_id, {
        dealCount: current.dealCount + 1,
        totalValue: current.totalValue + Number(deal.value ?? 0),
      })
    })

    return grouped
  }, [managePipelineDeals, managePipelineStages])

  const manageActiveDealCount = useMemo(
    () => managePipelineStages.reduce((total, stage) => total + (manageStageStats.get(stage.id)?.dealCount ?? 0), 0),
    [managePipelineStages, manageStageStats],
  )

  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id)
    }
  }, [pipelines, selectedPipelineId])

  useEffect(() => {
    if (!showManagePipelines) {
      return
    }

    if (!selectedManagePipelineId && pipelines.length > 0) {
      setSelectedManagePipelineId(pipelines[0].id)
    }
  }, [pipelines, selectedManagePipelineId, showManagePipelines])

  useEffect(() => {
    setManagePipelineNameDraft(selectedManagePipeline?.name ?? '')
  }, [selectedManagePipeline])

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

  useEffect(() => {
    const nextDrafts: Record<string, string> = {}

    managePipelineStages.forEach((stage) => {
      nextDrafts[stage.id] = stage.name
    })

    setManageStageNameDrafts(nextDrafts)
  }, [managePipelineStages])

  const nextStagePosition = useMemo(() => {
    if (stages.length === 0) {
      return 0
    }

    return Math.max(...stages.map((stage) => stage.position)) + 1
  }, [stages])

  const nextManageStagePosition = useMemo(() => {
    if (managePipelineStages.length === 0) {
      return 0
    }

    return Math.max(...managePipelineStages.map((stage) => stage.position)) + 1
  }, [managePipelineStages])

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

  const handleCreateManageStage = async () => {
    const name = 'Nova etapa'
    if (!selectedManagePipelineId) {
      return
    }

    await createManageStageMutation.mutateAsync({
      name,
      position: nextManageStagePosition,
    })
  }

  const handleSaveManagePipelineName = async () => {
    const nextName = managePipelineNameDraft.trim()
    if (!selectedManagePipelineId || !nextName) {
      return
    }

    await updatePipelineMutation.mutateAsync({
      pipelineId: selectedManagePipelineId,
      name: nextName,
    })
  }

  const handleSaveManageStageName = async (stageId: string) => {
    if (!selectedManagePipelineId) {
      return
    }

    const nextName = manageStageNameDrafts[stageId]?.trim()
    if (!nextName) {
      return
    }

    await updateManageStageMutation.mutateAsync({
      stageId,
      name: nextName,
    })
  }

  const handleDeleteStage = (stageId: string, stageName: string) => {
    setDeleteStageTarget({ id: stageId, name: stageName })
    // default: transfer to first other stage if available
    const otherStage = managePipelineStages.find((s) => s.id !== stageId)
    setDeleteStageTransferTo(otherStage?.id ?? '')
    setDeleteStageOption(otherStage ? 'transfer' : 'delete')
  }

  const handleConfirmDeleteStage = async () => {
    if (!deleteStageTarget) return
    await deleteManageStageMutation.mutateAsync({
      stageId: deleteStageTarget.id,
      transferToStageId: deleteStageOption === 'transfer' && deleteStageTransferTo ? deleteStageTransferTo : undefined,
    })
    setDeleteStageTarget(null)
  }

  const handleDeletePipeline = (pipelineId: string, pipelineName: string) => {
    setDeletePipelineTarget({ id: pipelineId, name: pipelineName })
  }

  const handleConfirmDeletePipeline = async () => {
    if (!deletePipelineTarget) return
    await deletePipelineMutation.mutateAsync(deletePipelineTarget.id)
    if (selectedManagePipelineId === deletePipelineTarget.id) setSelectedManagePipelineId(null)
    if (selectedPipelineId === deletePipelineTarget.id) setSelectedPipelineId(null)
    setDeletePipelineTarget(null)
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

  const handleOpenManagePipelines = () => {
    setShowManagePipelines(true)

    if (!selectedManagePipelineId && pipelines.length > 0) {
      setSelectedManagePipelineId(pipelines[0].id)
    }
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
              value={selectedPipelineId ?? pipelines[0]?.id ?? ''}
              onChange={(event) => setSelectedPipelineId(event.target.value || null)}
            >
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
              onClick={handleOpenManagePipelines}
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

        {showManagePipelines && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowManagePipelines(false)
              }
            }}
          >
            <div className="flex h-[85vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
              <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-black/10 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">Gerenciar Pipelines</h3>
                    <p className="text-sm text-ink/60">Crie pipelines e acompanhe etapas e negócios.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManagePipelines(false)}
                    className="rounded-md px-2 py-1 text-sm font-semibold text-ink/60 hover:bg-slate-100 hover:text-ink"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
                  <h4 className="text-sm font-bold text-ink">Criar Nova Pipeline</h4>
                  <input
                    className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    placeholder="Ex.: Vendas B2B, Vendas Varejo..."
                    value={newPipelineName}
                    onChange={(event) => setNewPipelineName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void handleCreatePipeline()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreatePipeline()}
                    disabled={createPipelineMutation.isPending || !newPipelineName.trim()}
                    className="mt-3 w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createPipelineMutation.isPending ? 'Criando...' : 'Criar Nova Pipeline'}
                  </button>
                </div>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                  <h4 className="text-sm font-bold text-ink">Pipelines Existentes</h4>
                  {pipelines.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-black/10 bg-white px-3 py-4 text-sm text-ink/60">
                      Nenhum pipeline cadastrado ainda.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {pipelines.map((pipeline) => {
                      const summary = pipelineSummaries.find((s) => s.pipelineId === pipeline.id)
                      const isSelected = selectedManagePipelineId === pipeline.id

                      return (
                        <div
                          key={pipeline.id}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-black/10 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setSelectedManagePipelineId(pipeline.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-ink">{pipeline.name}</span>
                              <span className="text-xs font-semibold text-ink/60">{summary?.isLoading ? '...' : `${summary?.stageCount ?? 0} etapas`}</span>
                            </div>
                            <p className="mt-1 text-xs text-ink/60">
                              {summary?.isLoading
                                ? 'Carregando resumo...'
                                : `${summary?.dealCount ?? 0} negócios • ${new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(summary?.totalValue ?? 0)}`}
                            </p>
                          </button>
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeletePipeline(pipeline.id, pipeline.name)}
                              disabled={deletePipelineMutation.isPending && deletePipelineMutation.variables === pipeline.id}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              {deletePipelineMutation.isPending && deletePipelineMutation.variables === pipeline.id
                                ? 'Apagando...'
                                : 'Apagar pipeline'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    </div>
                  )}
                </div>
              </aside>

              <section className="flex min-w-0 flex-1 flex-col p-5">
                {!selectedManagePipeline ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-black/10 bg-slate-50 text-sm text-ink/60">
                    Selecione um pipeline para ver suas etapas.
                  </div>
                ) : managePipelineStagesQuery.isLoading || managePipelineDealsQuery.isLoading ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-black/10 bg-slate-50 text-sm text-ink/70">
                    Carregando etapas e negócios...
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-4">
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-xs font-semibold text-ink/70">Nome da pipeline</label>
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                              value={managePipelineNameDraft}
                              onChange={(event) => setManagePipelineNameDraft(event.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveManagePipelineName()}
                              disabled={
                                updatePipelineMutation.isPending ||
                                !managePipelineNameDraft.trim() ||
                                managePipelineNameDraft.trim() === selectedManagePipeline.name
                              }
                              className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/75 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatePipelineMutation.isPending ? 'Salvando...' : 'Salvar pipeline'}
                            </button>
                          </div>
                          <p className="text-sm text-ink/60">
                            {managePipelineStages.length} etapas • {manageActiveDealCount} negócios
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCreateManageStage()}
                          disabled={createManageStageMutation.isPending}
                          className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {createManageStageMutation.isPending ? 'Criando...' : '+ Nova etapa'}
                        </button>
                      </div>
                    </div>

                    <div className="grid flex-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                      {managePipelineStages.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-5 text-sm text-ink/60">
                          Nenhuma etapa cadastrada para este pipeline.
                        </div>
                      ) : (
                        managePipelineStages.map((stage) => {
                          const stats = manageStageStats.get(stage.id) ?? { dealCount: 0, totalValue: 0 }

                          return (
                            <div key={stage.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <label className="mb-1 block text-xs font-semibold text-ink/70">Nome da etapa</label>
                                  <input
                                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                    value={manageStageNameDrafts[stage.id] ?? stage.name}
                                    onChange={(event) =>
                                      setManageStageNameDrafts((current) => ({
                                        ...current,
                                        [stage.id]: event.target.value,
                                      }))
                                    }
                                  />
                                </div>

                                <div className="pt-6">
                                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-ink/70">
                                    {stats.dealCount} negócios
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm font-semibold text-ink">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  stats.totalValue,
                                )}
                              </p>

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStage(stage.id, manageStageNameDrafts[stage.id] ?? stage.name)}
                                  disabled={deleteManageStageMutation.isPending && deleteManageStageMutation.variables?.stageId === stage.id}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deleteManageStageMutation.isPending && deleteManageStageMutation.variables?.stageId === stage.id
                                    ? 'Apagando...'
                                    : 'Apagar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleSaveManageStageName(stage.id)}
                                  disabled={updateManageStageMutation.isPending && updateManageStageMutation.variables?.stageId === stage.id}
                                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/75 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {updateManageStageMutation.isPending && updateManageStageMutation.variables?.stageId === stage.id
                                    ? 'Salvando...'
                                    : 'Salvar nome'}
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </section>

      {/* Modal de confirmar apagar etapa */}
      {deleteStageTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteStageTarget(null)
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-2xl">
            <div className="rounded-t-2xl bg-red-600 px-5 py-4">
              <h3 className="text-base font-bold text-white">Apagar etapa "{deleteStageTarget.name}"</h3>
              <p className="mt-1 text-sm text-red-100">Esta ação não pode ser desfeita.</p>
            </div>

            <div className="space-y-3 p-5">
              {managePipelineStages.filter((s) => s.id !== deleteStageTarget.id).length > 0 ? (
                <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 hover:bg-slate-50">
                    <input
                      type="radio"
                      className="mt-0.5 accent-red-600"
                      checked={deleteStageOption === 'transfer'}
                      onChange={() => setDeleteStageOption('transfer')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">Transferir negócios para outra etapa</p>
                      <select
                        className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm disabled:opacity-40"
                        value={deleteStageTransferTo}
                        onChange={(e) => { setDeleteStageTransferTo(e.target.value); setDeleteStageOption('transfer') }}
                        disabled={deleteStageOption !== 'transfer'}
                      >
                        {managePipelineStages
                          .filter((s) => s.id !== deleteStageTarget.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 hover:bg-slate-50">
                    <input
                      type="radio"
                      className="mt-0.5 accent-red-600"
                      checked={deleteStageOption === 'delete'}
                      onChange={() => setDeleteStageOption('delete')}
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink">Apagar todos os negócios desta etapa</p>
                      <p className="text-xs text-ink/60">Os negócios serão removidos permanentemente.</p>
                    </div>
                  </label>
                </>
              ) : (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  Não há outras etapas neste pipeline. Todos os negócios desta etapa serão apagados.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-4">
              <button
                type="button"
                onClick={() => setDeleteStageTarget(null)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/75 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteStage()}
                disabled={deleteManageStageMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteManageStageMutation.isPending ? 'Apagando...' : 'Confirmar e apagar etapa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmar apagar pipeline */}
      {deletePipelineTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeletePipelineTarget(null)
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-2xl">
            <div className="rounded-t-2xl bg-red-600 px-5 py-4">
              <h3 className="text-base font-bold text-white">Apagar pipeline "{deletePipelineTarget.name}"</h3>
              <p className="mt-1 text-sm text-red-100">Esta ação é permanente e irreversível.</p>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">Ao confirmar, serão removidos permanentemente:</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-600">
                  <li>Todas as etapas deste pipeline</li>
                  <li>Todos os negócios vinculados a este pipeline</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-4">
              <button
                type="button"
                onClick={() => setDeletePipelineTarget(null)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/75 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeletePipeline()}
                disabled={deletePipelineMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletePipelineMutation.isPending ? 'Apagando...' : 'Confirmar e apagar pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewDealModal && selectedPipelineId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewDealModal(false)
            }
          }}
        >
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
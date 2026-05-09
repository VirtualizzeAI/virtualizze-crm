import { useEffect, useMemo, useState } from 'react'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { DealCard } from './DealCard'
import { KanbanColumn } from './KanbanColumn'

import type { Deal, PipelineStage } from '../../lib/types'

interface KanbanBoardProps {
  stages: PipelineStage[]
  workflowStages: PipelineStage[]
  deals: Deal[]
  movingDealId: string | null
  onMoveDeal: (dealId: string, stageId: string, position: number) => Promise<void>
  onUpdateDeal: (payload: {
    id: string
    stage_id: string
    name: string
    value: number
    description: string | null
    status: Deal['status']
  }) => Promise<void>
  updatingDealId: string | null
  onUpdateStageConfig: (payload: { stageId: string; name: string; color: string | null }) => Promise<void>
  updatingStageId: string | null
  onCreateDealAtStage: (stageId: string) => void
  creatingDealStageId: string | null
  onQuickCreateStage: () => Promise<void>
  isCreatingStage: boolean
}

function sortDealsByPosition(items: Deal[]) {
  return [...items].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
}

export function KanbanBoard({
  stages,
  workflowStages,
  deals,
  movingDealId,
  onMoveDeal,
  onUpdateDeal,
  updatingDealId,
  onUpdateStageConfig,
  updatingStageId,
  onCreateDealAtStage,
  creatingDealStageId,
  onQuickCreateStage,
  isCreatingStage,
}: KanbanBoardProps) {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals)
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [detailName, setDetailName] = useState('')
  const [detailValue, setDetailValue] = useState('')
  const [detailDescription, setDetailDescription] = useState('')
  const [detailStageId, setDetailStageId] = useState('')
  const [detailStatus, setDetailStatus] = useState<Deal['status']>('open')
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [stageName, setStageName] = useState('')
  const [stageColor, setStageColor] = useState('#94a3b8')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 8,
      },
    }),
  )

  useEffect(() => {
    setLocalDeals(deals)
  }, [deals])

  useEffect(() => {
    if (!selectedDealId) {
      return
    }

    const selectedDeal = deals.find((deal) => deal.id === selectedDealId)
    if (!selectedDeal) {
      setSelectedDealId(null)
      return
    }

    setDetailName(selectedDeal.name)
    setDetailValue(String(selectedDeal.value ?? 0))
    setDetailDescription(selectedDeal.description ?? '')
    setDetailStageId(selectedDeal.stage_id)
    setDetailStatus(selectedDeal.status)
  }, [deals, selectedDealId])

  const dealsByStage = useMemo(() => {
    const grouped = new Map<string, Deal[]>()

    stages.forEach((stage) => {
      grouped.set(stage.id, [])
    })

    localDeals.forEach((deal) => {
      const current = grouped.get(deal.stage_id) ?? []
      current.push(deal)
      grouped.set(deal.stage_id, current)
    })

    return grouped
  }, [localDeals, stages])

  const getStageIdFromOver = (overId: string): string | null => {
    if (overId.startsWith('stage:')) {
      return overId.replace('stage:', '')
    }

    const overDeal = localDeals.find((deal) => deal.id === overId)
    return overDeal?.stage_id ?? null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDealId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDealId(null)

    if (!over) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeDeal = localDeals.find((deal) => deal.id === activeId)
    if (!activeDeal) {
      return
    }

    const targetStageId = getStageIdFromOver(overId)
    if (!targetStageId) {
      return
    }

    const remainingDeals = localDeals.filter((deal) => deal.id !== activeDeal.id)
    const targetStageDeals = sortDealsByPosition(remainingDeals.filter((deal) => deal.stage_id === targetStageId))

    let targetPosition = targetStageDeals.length

    if (!overId.startsWith('stage:')) {
      const overIndex = targetStageDeals.findIndex((deal) => deal.id === overId)
      if (overIndex >= 0) {
        targetPosition = overIndex
      }
    }

    const movedDeal: Deal = {
      ...activeDeal,
      stage_id: targetStageId,
      position: targetPosition,
    }

    const mergedTargetStageDeals = [...targetStageDeals]
    mergedTargetStageDeals.splice(targetPosition, 0, movedDeal)

    const normalizedTargetStageDeals = mergedTargetStageDeals.map((deal, index) => ({
      ...deal,
      position: index,
    }))

    const sourceStageDeals = sortDealsByPosition(
      remainingDeals.filter((deal) => deal.stage_id === activeDeal.stage_id),
    ).map((deal, index) => ({
      ...deal,
      position: index,
    }))

    const untouchedDeals = remainingDeals.filter(
      (deal) => deal.stage_id !== targetStageId && deal.stage_id !== activeDeal.stage_id,
    )

    const nextDeals = [
      ...untouchedDeals,
      ...(targetStageId === activeDeal.stage_id ? [] : sourceStageDeals),
      ...normalizedTargetStageDeals,
    ]

    setLocalDeals(nextDeals)

    await onMoveDeal(activeDeal.id, targetStageId, targetPosition)
  }

  const activeDeal = activeDealId ? localDeals.find((deal) => deal.id === activeDealId) : null
  const selectedDeal = selectedDealId ? deals.find((deal) => deal.id === selectedDealId) ?? null : null
  const selectedStage = selectedStageId ? workflowStages.find((stage) => stage.id === selectedStageId) ?? null : null

  const openDealDetails = (deal: Deal) => {
    setSelectedDealId(deal.id)
    setDetailName(deal.name)
    setDetailValue(String(deal.value ?? 0))
    setDetailDescription(deal.description ?? '')
    setDetailStageId(deal.stage_id)
    setDetailStatus(deal.status)
  }

  const openStageConfig = (stage: PipelineStage) => {
    setSelectedStageId(stage.id)
    setStageName(stage.name)
    setStageColor(stage.color ?? '#94a3b8')
  }

  const handleSaveDealDetails = async () => {
    if (!selectedDeal) {
      return
    }

    const parsedValue = Number(detailValue.replace(',', '.'))
    await onUpdateDeal({
      id: selectedDeal.id,
      stage_id: detailStageId,
      name: detailName.trim(),
      value: Number.isFinite(parsedValue) ? parsedValue : 0,
      description: detailDescription.trim() ? detailDescription.trim() : null,
      status: detailStatus,
    })
    setSelectedDealId(null)
  }

  const handleSaveStageConfig = async () => {
    if (!selectedStage) {
      return
    }

    await onUpdateStageConfig({
      stageId: selectedStage.id,
      name: stageName.trim(),
      color: stageColor,
    })
    setSelectedStageId(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={sortDealsByPosition(dealsByStage.get(stage.id) ?? [])}
                allStages={workflowStages}
                movingDealId={movingDealId}
                activeDealId={activeDealId}
                onMoveDeal={onMoveDeal}
                onOpenDealDetails={openDealDetails}
                onOpenStageConfig={openStageConfig}
                onCreateDealAtStage={onCreateDealAtStage}
                isCreatingDeal={creatingDealStageId === stage.id}
              />
            ))}

            <section className="flex w-[280px] shrink-0 items-center justify-center rounded-md border border-white/70 bg-white/35 p-4 backdrop-blur-md transition hover:bg-white/55">
              <button
                type="button"
                onClick={() => void onQuickCreateStage()}
                disabled={isCreatingStage}
                className="w-full rounded-lg border border-slate-300/70 bg-white/55 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingStage ? 'Criando etapa...' : '+ Nova etapa'}
              </button>
            </section>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <div className="rotate-3 opacity-90 shadow-2xl">
              <DealCard
                deal={activeDeal}
                stages={workflowStages}
                isMoving={false}
                onMove={() => Promise.resolve()}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedDeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDealId(null)
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-xl border border-black/10 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Detalhes do Negócio</h3>
              <button
                type="button"
                onClick={() => setSelectedDealId(null)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-ink/60 hover:bg-slate-100 hover:text-ink"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-ink/70">Nome</label>
                <input
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={detailName}
                  onChange={(event) => setDetailName(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Valor</label>
                <input
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={detailValue}
                  onChange={(event) => setDetailValue(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Etapa</label>
                <select
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={detailStageId}
                  onChange={(event) => setDetailStageId(event.target.value)}
                >
                  {workflowStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Status</label>
                <select
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={detailStatus}
                  onChange={(event) => setDetailStatus(event.target.value as Deal['status'])}
                >
                  <option value="open">Aberto</option>
                  <option value="won">Ganho</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-ink/70">Descrição</label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={detailDescription}
                  onChange={(event) => setDetailDescription(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">ID</label>
                <input
                  className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  value={selectedDeal.id}
                  readOnly
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Criado em</label>
                <input
                  className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  value={new Date(selectedDeal.created_at).toLocaleString('pt-BR')}
                  readOnly
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDealId(null)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveDealDetails()}
                disabled={
                  !detailName.trim() ||
                  !detailStageId ||
                  updatingDealId === selectedDeal.id
                }
                className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingDealId === selectedDeal.id ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedStageId(null)
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Configurar etapa</h3>
              <button
                type="button"
                onClick={() => setSelectedStageId(null)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-ink/60 hover:bg-slate-100 hover:text-ink"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Nome da etapa</label>
                <input
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  value={stageName}
                  onChange={(event) => setStageName(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/70">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stageColor}
                    onChange={(event) => setStageColor(event.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-black/10 bg-white p-1"
                  />
                  <input
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    value={stageColor}
                    onChange={(event) => setStageColor(event.target.value)}
                    placeholder="#94a3b8"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedStageId(null)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSaveStageConfig()}
                disabled={!stageName.trim() || updatingStageId === selectedStage.id}
                className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStageId === selectedStage.id ? 'Salvando...' : 'Salvar etapa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
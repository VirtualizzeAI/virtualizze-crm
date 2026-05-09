import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { SortableDealCard } from './SortableDealCard'

import type { Deal, PipelineStage } from '../../lib/types'

interface KanbanColumnProps {
  stage: PipelineStage
  deals: Deal[]
  allStages: PipelineStage[]
  movingDealId: string | null
  activeDealId: string | null
  onMoveDeal: (dealId: string, stageId: string, position: number) => Promise<void>
  onOpenDealDetails: (deal: Deal) => void
  onOpenStageConfig: (stage: PipelineStage) => void
  onCreateDealAtStage: (stageId: string) => void
  isCreatingDeal: boolean
}

export function KanbanColumn({
  stage,
  deals,
  allStages,
  movingDealId,
  activeDealId,
  onMoveDeal,
  onOpenDealDetails,
  onOpenStageConfig,
  onCreateDealAtStage,
  isCreatingDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` })

  const total = deals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0)
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(total)
  const dealsLabel = deals.length === 1 ? 'Negócio' : 'Negócios'

  const columnClassName = `flex h-[72vh] w-[280px] shrink-0 flex-col rounded-md border p-2 transition-all duration-200 ${
    isOver ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-slate-200 bg-slate-100'
  }`

  return (
    <section ref={setNodeRef} className={columnClassName}>
      <header className="sticky top-0 z-10 rounded-md border border-slate-200 bg-white px-2 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: stage.color ?? '#94a3b8' }}
              />
              <h3 className="truncate text-sm font-bold text-slate-900">{stage.name}</h3>
            </div>
            <p className="text-[13px] font-semibold text-slate-900">
              {formattedTotal} <span className="font-normal text-slate-600">• {deals.length} {dealsLabel}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenStageConfig(stage)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Configurar
          </button>
        </div>
      </header>

      <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
        {deals.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">Este estágio está vazio</p> : null}

        <SortableContext items={deals.map((deal) => deal.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              stages={allStages}
              isMoving={movingDealId === deal.id}
              isDragging={activeDealId === deal.id}
              onMove={onMoveDeal}
              onOpenDetails={onOpenDealDetails}
            />
          ))}
        </SortableContext>
      </div>

      <div className="mt-2 pt-2">
        <button
          type="button"
          onClick={() => onCreateDealAtStage(stage.id)}
          disabled={isCreatingDeal}
          className="w-full rounded-md border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingDeal ? 'Abrindo...' : '+ Novo negócio'}
        </button>
      </div>
    </section>
  )
}
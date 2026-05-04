import { DealCard } from './DealCard'

import type { Deal, PipelineStage } from '../../lib/types'

interface KanbanColumnProps {
  stage: PipelineStage
  deals: Deal[]
  allStages: PipelineStage[]
  movingDealId: string | null
  onMoveDeal: (dealId: string, stageId: string) => Promise<void>
}

export function KanbanColumn({ stage, deals, allStages, movingDealId, onMoveDeal }: KanbanColumnProps) {
  const total = deals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0)
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(total)
  const dealsLabel = deals.length === 1 ? 'Negócio' : 'Negócios'

  return (
    <section className="w-[280px] shrink-0 rounded-md border border-slate-200 bg-slate-100 p-2">
      <header className="rounded-md border border-slate-200 bg-white px-2 py-2">
        <h3 className="truncate text-sm font-bold text-slate-900">{stage.name}</h3>
        <p className="text-[13px] font-semibold text-slate-900">
          {formattedTotal} <span className="font-normal text-slate-600">• {deals.length} {dealsLabel}</span>
        </p>
      </header>

      <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-white px-2 py-2 text-sm text-slate-500">
        Add a Description for this stage
      </div>

      <div className="mt-2 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
        {deals.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">Este estágio está vazio</p> : null}

        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            stages={allStages}
            isMoving={movingDealId === deal.id}
            onMove={onMoveDeal}
          />
        ))}
      </div>
    </section>
  )
}
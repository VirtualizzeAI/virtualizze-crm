import type { Deal, PipelineStage } from '../../lib/types'

interface DealCardProps {
  deal: Deal
  stages: PipelineStage[]
  isMoving: boolean
  onMove: (dealId: string, stageId: string, position: number) => Promise<void>
}

export function DealCard({ deal, stages, isMoving, onMove }: DealCardProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(deal.value ?? 0))

  const currentStageIndex = stages.findIndex((stage) => stage.id === deal.stage_id)
  const previousStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null

  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <h4 className="truncate text-sm font-bold uppercase tracking-tight text-slate-900">{deal.name}</h4>
      <p className="mt-1 truncate text-sm text-slate-700">{deal.description || deal.name}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">{formattedValue}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-no-open="true"
          onClick={(event) => {
            event.stopPropagation()
            if (previousStage) {
              void onMove(deal.id, previousStage.id, 0)
            }
          }}
          disabled={isMoving || !previousStage}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          data-no-open="true"
          onClick={(event) => {
            event.stopPropagation()
            if (nextStage) {
              void onMove(deal.id, nextStage.id, 0)
            }
          }}
          disabled={isMoving || !nextStage}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Avançar
        </button>
      </div>
    </article>
  )
}
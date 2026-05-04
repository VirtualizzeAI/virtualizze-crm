import type { Deal, PipelineStage } from '../../lib/types'

interface DealCardProps {
  deal: Deal
  stages: PipelineStage[]
  isMoving: boolean
  onMove: (dealId: string, stageId: string) => Promise<void>
}

export function DealCard({ deal, stages, isMoving, onMove }: DealCardProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(deal.value ?? 0))

  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <h4 className="truncate text-sm font-bold uppercase tracking-tight text-slate-900">{deal.name}</h4>
      <p className="mt-1 truncate text-sm text-slate-700">{deal.description || deal.name}</p>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">{formattedValue}</p>

      <div className="mt-3 flex items-center gap-2">
        <select
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          value={deal.stage_id}
          onChange={(event) => {
            const nextStageId = event.target.value
            if (nextStageId !== deal.stage_id) {
              void onMove(deal.id, nextStageId)
            }
          }}
          disabled={isMoving}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}
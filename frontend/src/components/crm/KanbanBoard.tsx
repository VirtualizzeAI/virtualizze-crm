import { KanbanColumn } from './KanbanColumn'

import type { Deal, PipelineStage } from '../../lib/types'

interface KanbanBoardProps {
  stages: PipelineStage[]
  deals: Deal[]
  movingDealId: string | null
  onMoveDeal: (dealId: string, stageId: string) => Promise<void>
}

export function KanbanBoard({ stages, deals, movingDealId, onMoveDeal }: KanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter((deal) => deal.stage_id === stage.id)}
            allStages={stages}
            movingDealId={movingDealId}
            onMoveDeal={onMoveDeal}
          />
        ))}
      </div>
    </div>
  )
}
import { useRef } from 'react'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

import { DealCard } from './DealCard'

import type { Deal, PipelineStage } from '../../lib/types'

interface SortableDealCardProps {
  deal: Deal
  stages: PipelineStage[]
  isMoving: boolean
  isDragging: boolean
  onMove: (dealId: string, stageId: string, position: number) => Promise<void>
  onOpenDetails: (deal: Deal) => void
}

export function SortableDealCard({
  deal,
  stages,
  isMoving,
  isDragging,
  onMove,
  onOpenDetails,
}: SortableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: deal.id,
    data: {
      type: 'deal',
      dealId: deal.id,
      stageId: deal.stage_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const pressStartRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const longPressMs = 220
  const moveTolerance = 8

  const handlePointerDownCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    pressStartRef.current = {
      time: Date.now(),
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handlePointerUpCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || isDragging) {
      return
    }

    const startedAt = pressStartRef.current
    pressStartRef.current = null

    const target = event.target as HTMLElement | null
    if (target?.closest('[data-no-open="true"]')) {
      return
    }

    const elapsed = Date.now() - startedAt.time
    const deltaX = Math.abs(event.clientX - startedAt.x)
    const deltaY = Math.abs(event.clientY - startedAt.y)
    const moved = deltaX > moveTolerance || deltaY > moveTolerance

    if (elapsed < longPressMs && !moved) {
      onOpenDetails(deal)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerUpCapture={handlePointerUpCapture}
    >
      <DealCard
        deal={deal}
        stages={stages}
        isMoving={isMoving}
        onMove={(dealId, stageId) => onMove(dealId, stageId, 0)}
      />
    </div>
  )
}
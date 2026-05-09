import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import {
  createPipeline,
  createPipelineStage,
  deletePipeline,
  deletePipelineStage,
  listPipelines,
  listPipelineStages,
  updatePipeline,
  updatePipelineStage,
} from '../services/pipelines'

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

const StageParamsSchema = z.object({
  id: z.string().uuid(),
  stageId: z.string().uuid(),
})

const CreatePipelineSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
})

const UpdatePipelineSchema = CreatePipelineSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Informe ao menos um campo para atualização',
)

const CreatePipelineStageSchema = z.object({
  name: z.string().min(2),
  position: z.number().int().min(0),
  color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

const UpdatePipelineStageSchema = CreatePipelineStageSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Informe ao menos um campo para atualização',
)

const DeleteStageBodySchema = z.object({
  transfer_to_stage_id: z.string().uuid().optional(),
})

const pipelinesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = await listPipelines(request.user.organization_id)
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message })
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const body = CreatePipelineSchema.parse(request.body)
      const data = await createPipeline({ organization_id: request.user.organization_id, ...body })
      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const body = UpdatePipelineSchema.parse(request.body)
      const data = await updatePipeline({
        organization_id: request.user.organization_id,
        pipeline_id: id,
        ...body,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Pipeline nao encontrada' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.get('/:id/stages', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const data = await listPipelineStages(request.user.organization_id, id)
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/:id/stages', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const body = CreatePipelineStageSchema.parse(request.body)
      const data = await createPipelineStage({
        organization_id: request.user.organization_id,
        pipeline_id: id,
        ...body,
      })
      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id/stages/:stageId', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id, stageId } = StageParamsSchema.parse(request.params)
      const body = UpdatePipelineStageSchema.parse(request.body)
      const data = await updatePipelineStage({
        organization_id: request.user.organization_id,
        pipeline_id: id,
        stage_id: stageId,
        ...body,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Etapa nao encontrada' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id/stages/:stageId', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id, stageId } = StageParamsSchema.parse(request.params)
      const body = DeleteStageBodySchema.parse(request.body ?? {})
      await deletePipelineStage(request.user.organization_id, id, stageId, {
        transferToStageId: body.transfer_to_stage_id,
      })
      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      await deletePipeline(request.user.organization_id, id)
      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })
}

export default pipelinesRoutes
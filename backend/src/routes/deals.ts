import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { createDeal, listDeals, moveDeal, updateDeal } from '../services/deals'

const QuerySchema = z.object({
  pipeline_id: z.string().uuid().optional(),
  stage_id: z.string().uuid().optional(),
})

const CreateDealSchema = z.object({
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  name: z.string().min(2),
  value: z.number().nonnegative().optional(),
  description: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
})

const MoveParamsSchema = z.object({
  id: z.string().uuid(),
})

const MoveBodySchema = z.object({
  stage_id: z.string().uuid(),
  position: z.number().int().min(0).default(0),
})

const UpdateParamsSchema = z.object({
  id: z.string().uuid(),
})

const UpdateDealSchema = z
  .object({
    stage_id: z.string().uuid().optional(),
    name: z.string().min(2).optional(),
    value: z.number().nonnegative().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['open', 'won', 'lost']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  })

const dealsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = QuerySchema.parse(request.query)
      const data = await listDeals({ organization_id: request.user.organization_id, ...query })
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const body = CreateDealSchema.parse(request.body)
      const data = await createDeal({ organization_id: request.user.organization_id, ...body })
      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.patch('/:id/move', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = MoveParamsSchema.parse(request.params)
      const body = MoveBodySchema.parse(request.body)
      const data = await moveDeal({
        organization_id: request.user.organization_id,
        deal_id: id,
        stage_id: body.stage_id,
        position: body.position,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Negócio não encontrado' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = UpdateParamsSchema.parse(request.params)
      const body = UpdateDealSchema.parse(request.body)
      const data = await updateDeal({
        organization_id: request.user.organization_id,
        deal_id: id,
        ...body,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Negócio não encontrado' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })
}

export default dealsRoutes
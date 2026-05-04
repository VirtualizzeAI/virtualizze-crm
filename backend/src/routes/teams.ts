import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
} from '../services/teams'

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

const MembersParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
})

const CreateTeamSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  access_type: z.enum(['all_contacts', 'assigned_only', 'team_only']),
})

const UpdateTeamSchema = CreateTeamSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Informe ao menos um campo para atualização',
)

const AddTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['leader', 'member']).default('member'),
})

const teamsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = await listTeams(request.user.organization_id)
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message })
    }
  })

  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const data = await getTeamById(request.user.organization_id, id)

      if (!data) {
        return reply.code(404).send({ error: 'Equipe não encontrada' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const body = CreateTeamSchema.parse(request.body)
      const data = await createTeam({ organization_id: request.user.organization_id, ...body })
      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const body = UpdateTeamSchema.parse(request.body)
      const data = await updateTeam({ organization_id: request.user.organization_id, id, ...body })

      if (!data) {
        return reply.code(404).send({ error: 'Equipe não encontrada' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const deleted = await deleteTeam(request.user.organization_id, id)

      if (!deleted) {
        return reply.code(404).send({ error: 'Equipe não encontrada' })
      }

      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.get('/:id/members', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const data = await listTeamMembers(request.user.organization_id, id)
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/:id/members', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ParamsSchema.parse(request.params)
      const body = AddTeamMemberSchema.parse(request.body)
      const data = await addTeamMember({
        organization_id: request.user.organization_id,
        team_id: id,
        user_id: body.user_id,
        role: body.role,
      })
      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id/members/:userId', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id, userId } = MembersParamsSchema.parse(request.params)
      const deleted = await removeTeamMember(request.user.organization_id, id, userId)

      if (!deleted) {
        return reply.code(404).send({ error: 'Membro não encontrado na equipe' })
      }

      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })
}

export default teamsRoutes
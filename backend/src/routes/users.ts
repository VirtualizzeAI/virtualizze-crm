import type { FastifyPluginAsync } from 'fastify'

import { listUsers } from '../services/users'

const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const data = await listUsers(request.user.organization_id)
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message })
    }
  })
}

export default usersRoutes
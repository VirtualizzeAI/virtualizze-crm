import fp from 'fastify-plugin'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AuthenticatedUser } from '../types'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser
    user: AuthenticatedUser
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authPlugin = fp(async (app) => {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await request.jwtVerify<AuthenticatedUser>()

      if (!user.organization_id) {
        reply.code(401).send({ error: 'Invalid token payload' })
        return
      }

      request.user = user
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})

export default authPlugin
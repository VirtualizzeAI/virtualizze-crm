import type { FastifyPluginAsync } from 'fastify'

const webhooksRoutes: FastifyPluginAsync = async (app) => {
  app.post('/evolution/:instanceId', async (_request, reply) => {
    reply.code(501).send({ error: 'Evolution webhook handler not implemented yet' })
  })

  app.get('/meta', async (_request, reply) => {
    reply.code(501).send({ error: 'Meta webhook verification not implemented yet' })
  })

  app.post('/meta', async (_request, reply) => {
    reply.code(501).send({ error: 'Meta webhook handler not implemented yet' })
  })
}

export default webhooksRoutes
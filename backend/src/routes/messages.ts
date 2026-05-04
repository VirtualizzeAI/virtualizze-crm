import type { FastifyPluginAsync } from 'fastify'

const messagesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'Messages route placeholder' }
  })
}

export default messagesRoutes
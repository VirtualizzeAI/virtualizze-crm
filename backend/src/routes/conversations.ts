import type { FastifyPluginAsync } from 'fastify'

const conversationsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'Conversations route placeholder' }
  })
}

export default conversationsRoutes
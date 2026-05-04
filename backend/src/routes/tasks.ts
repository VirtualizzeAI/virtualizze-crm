import type { FastifyPluginAsync } from 'fastify'

const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'Tasks route placeholder' }
  })
}

export default tasksRoutes
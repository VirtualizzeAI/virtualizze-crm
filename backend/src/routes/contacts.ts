import type { FastifyPluginAsync } from 'fastify'

const contactsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'Contacts route placeholder' }
  })
}

export default contactsRoutes
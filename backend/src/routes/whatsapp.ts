import type { FastifyPluginAsync } from 'fastify'

const whatsappRoutes: FastifyPluginAsync = async (app) => {
  app.get('/instances', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'WhatsApp route placeholder' }
  })
}

export default whatsappRoutes
import type { FastifyPluginAsync } from 'fastify'

const productsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return { data: [], message: 'Products route placeholder' }
  })
}

export default productsRoutes
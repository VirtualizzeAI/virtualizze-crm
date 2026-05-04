import 'dotenv/config'

import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import Fastify from 'fastify'

import authPlugin from './plugins/auth'
import authRoutes from './routes/auth'
import contactsRoutes from './routes/contacts'
import conversationsRoutes from './routes/conversations'
import dealsRoutes from './routes/deals'
import messagesRoutes from './routes/messages'
import pipelinesRoutes from './routes/pipelines'
import productsRoutes from './routes/products'
import tasksRoutes from './routes/tasks'
import teamsRoutes from './routes/teams'
import usersRoutes from './routes/users'
import webhooksRoutes from './routes/webhooks'
import whatsappRoutes from './routes/whatsapp'

const buildServer = () => {
  const app = Fastify({ logger: true })

  app.register(cors, {
    origin: true,
    credentials: true,
  })

  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'development-secret',
  })

  app.register(multipart)
  app.register(authPlugin)

  app.get('/health', async () => ({ status: 'ok' }))

  app.register(authRoutes, { prefix: '/auth' })
  app.register(pipelinesRoutes, { prefix: '/pipelines' })
  app.register(dealsRoutes, { prefix: '/deals' })
  app.register(contactsRoutes, { prefix: '/contacts' })
  app.register(teamsRoutes, { prefix: '/teams' })
  app.register(usersRoutes, { prefix: '/users' })
  app.register(tasksRoutes, { prefix: '/tasks' })
  app.register(productsRoutes, { prefix: '/products' })
  app.register(conversationsRoutes, { prefix: '/conversations' })
  app.register(messagesRoutes, { prefix: '/messages' })
  app.register(whatsappRoutes, { prefix: '/whatsapp' })
  app.register(webhooksRoutes, { prefix: '/webhooks' })

  return app
}

const start = async () => {
  const app = buildServer()

  try {
    const port = Number(process.env.PORT ?? 3333)
    await app.listen({ port, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

void start()

export { buildServer }
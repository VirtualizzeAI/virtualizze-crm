import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { createTask, deleteTask, listTasks, updateTask } from '../services/tasks'

const TaskParamsSchema = z.object({
  id: z.string().uuid(),
})

const ListTasksQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
  responsible_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  due: z.enum(['overdue', 'today', 'upcoming', 'no_due']).optional(),
})

const CreateTaskSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  responsible_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  due_date: z.string().date().nullable().optional(),
  attachment_urls: z.array(z.string().url()).optional(),
})

const UpdateTaskSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    responsible_id: z.string().uuid().nullable().optional(),
    contact_id: z.string().uuid().nullable().optional(),
    due_date: z.string().date().nullable().optional(),
    attachment_urls: z.array(z.string().url()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  })

const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = ListTasksQuerySchema.parse(request.query)
      const data = await listTasks({
        organization_id: request.user.organization_id,
        search: query.search,
        status: query.status,
        responsible_id: query.responsible_id,
        contact_id: query.contact_id,
        due: query.due,
      })

      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const body = CreateTaskSchema.parse(request.body)
      const data = await createTask({
        organization_id: request.user.organization_id,
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        responsible_id: body.responsible_id,
        contact_id: body.contact_id,
        due_date: body.due_date,
        attachment_urls: body.attachment_urls,
      })

      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = TaskParamsSchema.parse(request.params)
      const body = UpdateTaskSchema.parse(request.body)
      const data = await updateTask({
        organization_id: request.user.organization_id,
        task_id: id,
        ...body,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Tarefa não encontrada' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = TaskParamsSchema.parse(request.params)
      const deleted = await deleteTask(request.user.organization_id, id)

      if (!deleted) {
        return reply.code(404).send({ error: 'Tarefa não encontrada' })
      }

      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })
}

export default tasksRoutes
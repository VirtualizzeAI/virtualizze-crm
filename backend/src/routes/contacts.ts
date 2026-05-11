import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import {
  addContactAttachment,
  addContactNote,
  createContact,
  deleteContact,
  getContactDetails,
  listContacts,
  updateContact,
  upsertContactCustomFields,
} from '../services/contacts'

const ContactParamsSchema = z.object({
  id: z.string().uuid(),
})

const ListContactsQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['PF', 'PJ']).optional(),
  assigned_user_id: z.string().uuid().optional(),
  unassigned: z.coerce.boolean().optional(),
})

const CreateContactSchema = z.object({
  type: z.enum(['PF', 'PJ']).nullable().optional(),
  name: z.string().min(2),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  description: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  street_number: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
  created_by_type: z.enum(['user', 'automation']).default('user'),
})

const UpdateContactSchema = z
  .object({
    type: z.enum(['PF', 'PJ']).nullable().optional(),
    name: z.string().min(2).optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    description: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    street_number: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    assigned_user_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  })

const CustomFieldsSchema = z.object({
  fields: z.array(
    z.object({
      field_key: z.string().min(1),
      field_value: z.string().nullable().optional(),
    }),
  ),
})

const AddNoteSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  attachment_url: z.string().url().nullable().optional(),
  created_by_type: z.enum(['user', 'automation']).default('user'),
})

const AddAttachmentSchema = z.object({
  file_name: z.string().min(2),
  file_url: z.string().url(),
  created_by_type: z.enum(['user', 'automation']).default('user'),
})

const contactsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = ListContactsQuerySchema.parse(request.query)
      const data = await listContacts({
        organization_id: request.user.organization_id,
        search: query.search,
        type: query.type,
        assigned_user_id: query.assigned_user_id,
        unassigned: query.unassigned,
      })
      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(500).send({ error: (error as Error).message })
    }
  })

  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const data = await getContactDetails(request.user.organization_id, id)

      if (!data) {
        return reply.code(404).send({ error: 'Contato não encontrado' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const body = CreateContactSchema.parse(request.body)
      const data = await createContact({
        organization_id: request.user.organization_id,
        actor_type: body.created_by_type,
        actor_user_id: body.created_by_type === 'automation' ? null : request.user.sub,
        type: body.type,
        name: body.name,
        phone: body.phone,
        email: body.email,
        description: body.description,
        street: body.street,
        street_number: body.street_number,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
        country: body.country,
        complement: body.complement,
        reference: body.reference,
        assigned_user_id: body.assigned_user_id,
      })

      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const body = UpdateContactSchema.parse(request.body)

      const data = await updateContact({
        organization_id: request.user.organization_id,
        contact_id: id,
        actor_type: 'user',
        actor_user_id: request.user.sub,
        ...body,
      })

      if (!data) {
        return reply.code(404).send({ error: 'Contato não encontrado' })
      }

      return reply.send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const deleted = await deleteContact(request.user.organization_id, id)

      if (!deleted) {
        return reply.code(404).send({ error: 'Contato não encontrado' })
      }

      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.put('/:id/custom-fields', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const body = CustomFieldsSchema.parse(request.body)

      const data = await upsertContactCustomFields({
        organization_id: request.user.organization_id,
        contact_id: id,
        fields: body.fields,
        actor_type: 'user',
        actor_user_id: request.user.sub,
      })

      return reply.send({ data, total: data.length })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/:id/notes', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const body = AddNoteSchema.parse(request.body)
      const data = await addContactNote({
        organization_id: request.user.organization_id,
        contact_id: id,
        title: body.title,
        content: body.content,
        attachment_url: body.attachment_url,
        actor_type: body.created_by_type,
        actor_user_id: body.created_by_type === 'automation' ? null : request.user.sub,
      })

      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })

  app.post('/:id/attachments', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = ContactParamsSchema.parse(request.params)
      const body = AddAttachmentSchema.parse(request.body)
      const data = await addContactAttachment({
        organization_id: request.user.organization_id,
        contact_id: id,
        file_name: body.file_name,
        file_url: body.file_url,
        actor_type: body.created_by_type,
        actor_user_id: body.created_by_type === 'automation' ? null : request.user.sub,
      })

      return reply.code(201).send({ data })
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message })
    }
  })
}

export default contactsRoutes
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

import { supabaseAdmin, supabaseAuth } from '../services/supabase'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'supervisor', 'agent']).default('agent'),
})

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (request, reply) => {
    const { email, password } = LoginSchema.parse(request.body)

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user || !authData.session) {
      return reply.code(401).send({ error: 'Credenciais inválidas' })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url, role, organization_id')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return reply.code(404).send({ error: 'Perfil de usuário não encontrado' })
    }

    const token = app.jwt.sign({
      sub: profile.id,
      email: authData.user.email,
      role: profile.role,
      organization_id: profile.organization_id,
    })

    return reply.send({
      data: {
        token,
        organization_id: profile.organization_id,
        user: {
          id: profile.id,
          name: profile.name,
          email: authData.user.email,
          role: profile.role,
          avatar_url: profile.avatar_url,
        },
      },
    })
  })

  app.post('/logout', { preHandler: [app.authenticate] }, async (_request, reply) => {
    return reply.code(204).send()
  })

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { sub, organization_id } = request.user

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, name, avatar_url, role')
      .eq('id', sub)
      .eq('organization_id', organization_id)
      .single()

    if (error || !profile) {
      return reply.code(404).send({ error: 'Usuário não encontrado' })
    }

    return {
      data: {
        organization_id,
        user: {
          ...profile,
          email: request.user.email ?? '',
        },
      },
    }
  })

  app.post('/invite', { preHandler: [app.authenticate] }, async (request, reply) => {
    const currentUserRole = request.user.role

    if (currentUserRole !== 'admin') {
      return reply.code(403).send({ error: 'Apenas admins podem convidar usuários' })
    }

    const { email, role, name } = InviteSchema.parse(request.body)

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: request.user.organization_id,
        role,
        name,
      },
    })

    if (error) {
      return reply.code(400).send({ error: error.message })
    }

    return reply.code(201).send({
      data: {
        invited_user_id: data.user?.id ?? null,
        email,
        role,
      },
    })
  })
}

export default authRoutes
import supabase from './supabase'

import type { Task } from '../types'

interface TaskSummary extends Task {
  responsible: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  contact: {
    id: string
    name: string
    phone: string | null
  } | null
}

interface ListTasksInput {
  organization_id: string
  search?: string
  status?: Task['status']
  responsible_id?: string
  contact_id?: string
  due?: 'overdue' | 'today' | 'upcoming' | 'no_due'
}

interface CreateTaskInput {
  organization_id: string
  name: string
  description?: string | null
  status: Task['status']
  priority: Task['priority']
  responsible_id?: string | null
  contact_id?: string | null
  due_date?: string | null
  attachment_urls?: string[]
}

interface UpdateTaskInput {
  organization_id: string
  task_id: string
  name?: string
  description?: string | null
  status?: Task['status']
  priority?: Task['priority']
  responsible_id?: string | null
  contact_id?: string | null
  due_date?: string | null
  attachment_urls?: string[]
}

function normalizeAttachmentUrls(values?: string[]): string[] {
  if (!values) {
    return []
  }

  return values.map((value) => value.trim()).filter((value) => value.length > 0)
}

export async function listTasks(input: ListTasksInput): Promise<TaskSummary[]> {
  let query = supabase
    .from('tasks')
    .select('*, responsible:users(id,name,avatar_url), contact:contacts(id,name,phone)')
    .eq('organization_id', input.organization_id)
    .order('created_at', { ascending: false })

  const normalizedSearch = input.search?.trim()
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/,/g, ' ')
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  if (input.status) {
    query = query.eq('status', input.status)
  }

  if (input.responsible_id) {
    query = query.eq('responsible_id', input.responsible_id)
  }

  if (input.contact_id) {
    query = query.eq('contact_id', input.contact_id)
  }

  if (input.due === 'overdue') {
    query = query.lt('due_date', new Date().toISOString().slice(0, 10))
  }

  if (input.due === 'today') {
    query = query.eq('due_date', new Date().toISOString().slice(0, 10))
  }

  if (input.due === 'upcoming') {
    query = query.gt('due_date', new Date().toISOString().slice(0, 10))
  }

  if (input.due === 'no_due') {
    query = query.is('due_date', null)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as TaskSummary[]).map((item) => ({
    ...item,
    attachment_urls: Array.isArray(item.attachment_urls) ? item.attachment_urls : [],
  }))
}

export async function createTask(input: CreateTaskInput): Promise<TaskSummary> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      responsible_id: input.responsible_id ?? null,
      contact_id: input.contact_id ?? null,
      due_date: input.due_date ?? null,
      attachment_urls: normalizeAttachmentUrls(input.attachment_urls),
    })
    .select('*, responsible:users(id,name,avatar_url), contact:contacts(id,name,phone)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const task = data as TaskSummary
  return {
    ...task,
    attachment_urls: Array.isArray(task.attachment_urls) ? task.attachment_urls : [],
  }
}

export async function updateTask(input: UpdateTaskInput): Promise<TaskSummary | null> {
  const patch: Partial<Task> = {}

  if (typeof input.name !== 'undefined') {
    patch.name = input.name
  }

  if (typeof input.description !== 'undefined') {
    patch.description = input.description
  }

  if (typeof input.status !== 'undefined') {
    patch.status = input.status
  }

  if (typeof input.priority !== 'undefined') {
    patch.priority = input.priority
  }

  if (typeof input.responsible_id !== 'undefined') {
    patch.responsible_id = input.responsible_id
  }

  if (typeof input.contact_id !== 'undefined') {
    patch.contact_id = input.contact_id
  }

  if (typeof input.due_date !== 'undefined') {
    patch.due_date = input.due_date
  }

  if (typeof input.attachment_urls !== 'undefined') {
    patch.attachment_urls = normalizeAttachmentUrls(input.attachment_urls)
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('organization_id', input.organization_id)
    .eq('id', input.task_id)
    .select('*, responsible:users(id,name,avatar_url), contact:contacts(id,name,phone)')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const task = data as TaskSummary
  return {
    ...task,
    attachment_urls: Array.isArray(task.attachment_urls) ? task.attachment_urls : [],
  }
}

export async function deleteTask(organization_id: string, task_id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('organization_id', organization_id)
    .eq('id', task_id)
    .select('id')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).length > 0
}

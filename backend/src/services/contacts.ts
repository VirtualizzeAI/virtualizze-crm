import supabase from './supabase'

import type {
  Contact,
  ContactAttachment,
  ContactCreatedByType,
  ContactCustomField,
  ContactDealSummary,
  ContactDetails,
  ContactNote,
  ContactProductHistoryItem,
  ContactTimelineEvent,
} from '../types'

interface ContactBaseInput {
  organization_id: string
  actor_type: ContactCreatedByType
  actor_user_id: string | null
}

interface ListContactsInput {
  organization_id: string
  search?: string
  type?: Contact['type']
  assigned_user_id?: string
  unassigned?: boolean
}

interface CreateContactInput extends ContactBaseInput {
  type?: Contact['type']
  name: string
  phone?: string | null
  email?: string | null
  description?: string | null
  street?: string | null
  street_number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  complement?: string | null
  reference?: string | null
  assigned_user_id?: string | null
}

interface UpdateContactInput extends ContactBaseInput {
  contact_id: string
  type?: Contact['type']
  name?: string
  phone?: string | null
  email?: string | null
  description?: string | null
  street?: string | null
  street_number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  complement?: string | null
  reference?: string | null
  assigned_user_id?: string | null
}

interface UpsertCustomFieldsInput extends ContactBaseInput {
  contact_id: string
  fields: Array<{ field_key: string; field_value?: string | null }>
}

interface AddContactNoteInput extends ContactBaseInput {
  contact_id: string
  title: string
  content: string
  attachment_url?: string | null
}

interface AddContactAttachmentInput extends ContactBaseInput {
  contact_id: string
  file_name: string
  file_url: string
}

interface TimelineInput extends ContactBaseInput {
  contact_id: string
  event_type: ContactTimelineEvent['event_type']
  description: string
  metadata?: Record<string, string | number | boolean | null>
}

interface ProductRow {
  deal_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  created_at: string
  deal_name: string
  product_name: string
  product_unit: string | null
}

function asContactList(data: unknown): Contact[] {
  return (data ?? []) as Contact[]
}

function asCustomFields(data: unknown): ContactCustomField[] {
  return (data ?? []) as ContactCustomField[]
}

function asContactNotes(data: unknown): ContactNote[] {
  return (data ?? []) as ContactNote[]
}

function asContactAttachments(data: unknown): ContactAttachment[] {
  return (data ?? []) as ContactAttachment[]
}

function asContactTimeline(data: unknown): ContactTimelineEvent[] {
  return (data ?? []) as ContactTimelineEvent[]
}

function asDeals(data: unknown): ContactDealSummary[] {
  return (data ?? []) as ContactDealSummary[]
}

async function createTimelineEvent(input: TimelineInput): Promise<void> {
  const { error } = await supabase.from('contact_timeline_events').insert({
    organization_id: input.organization_id,
    contact_id: input.contact_id,
    event_type: input.event_type,
    description: input.description,
    actor_type: input.actor_type,
    actor_user_id: input.actor_user_id,
    metadata: input.metadata ?? {},
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function getProductHistory(organization_id: string, contact_id: string): Promise<ContactProductHistoryItem[]> {
  const { data: dealsData, error: dealsError } = await supabase
    .from('deals')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('contact_id', contact_id)

  if (dealsError) {
    throw new Error(dealsError.message)
  }

  const dealIds = ((dealsData ?? []) as Array<{ id: string }>).map((item) => item.id)

  if (dealIds.length === 0) {
    return []
  }

  const { data: rows, error } = await supabase
    .from('deal_products')
    .select(
      'deal_id, product_id, quantity, unit_price, discount, subtotal, created_at, deal:deals!inner(name), product:products!inner(name, unit)',
    )
    .eq('organization_id', organization_id)
    .in('deal_id', dealIds)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((rows ?? []) as Array<{
    deal_id: string
    product_id: string
    quantity: number
    unit_price: number
    discount: number
    subtotal: number
    created_at: string
    deal: { name: string } | Array<{ name: string }> | null
    product: { name: string; unit: string | null } | Array<{ name: string; unit: string | null }> | null
  }>).reduce<ContactProductHistoryItem[]>((acc, row) => {
    const deal = Array.isArray(row.deal) ? (row.deal[0] ?? null) : row.deal
    const product = Array.isArray(row.product) ? (row.product[0] ?? null) : row.product

    if (!deal || !product) {
      return acc
    }

    acc.push({
      deal_id: row.deal_id,
      deal_name: deal.name,
      product_id: row.product_id,
      product_name: product.name,
      unit: product.unit,
      quantity: Number(row.quantity),
      unit_price: Number(row.unit_price),
      discount: Number(row.discount),
      subtotal: Number(row.subtotal),
      created_at: row.created_at,
    })

    return acc
  }, [])
}

export async function listContacts(input: ListContactsInput): Promise<Contact[]> {
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', input.organization_id)
    .order('updated_at', { ascending: false })

  const normalizedSearch = input.search?.trim()
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/,/g, ' ')
    query = query.or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  if (input.type) {
    query = query.eq('type', input.type)
  }

  if (input.unassigned) {
    query = query.is('assigned_user_id', null)
  } else if (input.assigned_user_id) {
    query = query.eq('assigned_user_id', input.assigned_user_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return asContactList(data)
}

export async function getContactDetails(organization_id: string, contact_id: string): Promise<ContactDetails | null> {
  const { data: contactData, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('id', contact_id)
    .maybeSingle()

  if (contactError) {
    throw new Error(contactError.message)
  }

  if (!contactData) {
    return null
  }

  const [customFieldsRes, notesRes, attachmentsRes, timelineRes, linkedDealsRes, productHistory] = await Promise.all([
    supabase
      .from('contact_custom_fields')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: true }),
    supabase
      .from('contact_notes')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_attachments')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_timeline_events')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('deals')
      .select('id, name, stage_id, status, value, created_at')
      .eq('organization_id', organization_id)
      .eq('contact_id', contact_id)
      .order('created_at', { ascending: false }),
    getProductHistory(organization_id, contact_id),
  ])

  if (customFieldsRes.error) {
    throw new Error(customFieldsRes.error.message)
  }

  if (notesRes.error) {
    throw new Error(notesRes.error.message)
  }

  if (attachmentsRes.error) {
    throw new Error(attachmentsRes.error.message)
  }

  if (timelineRes.error) {
    throw new Error(timelineRes.error.message)
  }

  if (linkedDealsRes.error) {
    throw new Error(linkedDealsRes.error.message)
  }

  return {
    contact: contactData as Contact,
    custom_fields: asCustomFields(customFieldsRes.data),
    notes: asContactNotes(notesRes.data),
    attachments: asContactAttachments(attachmentsRes.data),
    timeline: asContactTimeline(timelineRes.data),
    linked_deals: asDeals(linkedDealsRes.data),
    product_history: productHistory,
  }
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      organization_id: input.organization_id,
      type: input.type ?? null,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      description: input.description ?? null,
      street: input.street ?? null,
      street_number: input.street_number ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      complement: input.complement ?? null,
      reference: input.reference ?? null,
      assigned_user_id: input.assigned_user_id ?? null,
      created_by_type: input.actor_type,
      created_by_user_id: input.actor_user_id,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const contact = data as Contact

  await createTimelineEvent({
    organization_id: input.organization_id,
    contact_id: contact.id,
    actor_type: input.actor_type,
    actor_user_id: input.actor_user_id,
    event_type: 'contact_created',
    description: `Contato ${contact.name} criado`,
  })

  return contact
}

export async function updateContact(input: UpdateContactInput): Promise<Contact | null> {
  const { data: previous, error: previousError } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', input.organization_id)
    .eq('id', input.contact_id)
    .maybeSingle()

  if (previousError) {
    throw new Error(previousError.message)
  }

  if (!previous) {
    return null
  }

  const patch: Partial<Contact> = {}

  if (typeof input.type !== 'undefined') {
    patch.type = input.type
  }

  if (typeof input.name !== 'undefined') {
    patch.name = input.name
  }

  if (typeof input.phone !== 'undefined') {
    patch.phone = input.phone
  }

  if (typeof input.email !== 'undefined') {
    patch.email = input.email
  }

  if (typeof input.description !== 'undefined') {
    patch.description = input.description
  }

  if (typeof input.street !== 'undefined') {
    patch.street = input.street
  }

  if (typeof input.street_number !== 'undefined') {
    patch.street_number = input.street_number
  }

  if (typeof input.neighborhood !== 'undefined') {
    patch.neighborhood = input.neighborhood
  }

  if (typeof input.city !== 'undefined') {
    patch.city = input.city
  }

  if (typeof input.state !== 'undefined') {
    patch.state = input.state
  }

  if (typeof input.country !== 'undefined') {
    patch.country = input.country
  }

  if (typeof input.complement !== 'undefined') {
    patch.complement = input.complement
  }

  if (typeof input.reference !== 'undefined') {
    patch.reference = input.reference
  }

  if (typeof input.assigned_user_id !== 'undefined') {
    patch.assigned_user_id = input.assigned_user_id
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(patch)
    .eq('organization_id', input.organization_id)
    .eq('id', input.contact_id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const contact = (data as Contact | null) ?? null

  if (!contact) {
    return null
  }

  const trackedFields: Array<
    keyof Pick<
      Contact,
      | 'name'
      | 'phone'
      | 'email'
      | 'description'
      | 'street'
      | 'street_number'
      | 'neighborhood'
      | 'city'
      | 'state'
      | 'country'
      | 'complement'
      | 'reference'
      | 'assigned_user_id'
    >
  > = [
    'name',
    'phone',
    'email',
    'description',
    'street',
    'street_number',
    'neighborhood',
    'city',
    'state',
    'country',
    'complement',
    'reference',
    'assigned_user_id',
  ]

  await Promise.all(
    trackedFields
      .filter((field) => previous[field] !== contact[field])
      .map((field) =>
        createTimelineEvent({
          organization_id: input.organization_id,
          contact_id: input.contact_id,
          actor_type: input.actor_type,
          actor_user_id: input.actor_user_id,
          event_type: 'contact_updated',
          description: `Campo ${field} atualizado de ${String(previous[field] ?? 'vazio')} para ${String(contact[field] ?? 'vazio')}`,
          metadata: {
            field,
            old_value: String(previous[field] ?? ''),
            new_value: String(contact[field] ?? ''),
          },
        }),
      ),
  )

  return contact
}

export async function deleteContact(organization_id: string, contact_id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('contacts')
    .delete({ count: 'exact' })
    .eq('organization_id', organization_id)
    .eq('id', contact_id)

  if (error) {
    throw new Error(error.message)
  }

  return (count ?? 0) > 0
}

export async function upsertContactCustomFields(input: UpsertCustomFieldsInput): Promise<ContactCustomField[]> {
  const normalizedFields = input.fields
    .map((field) => ({
      field_key: field.field_key.trim(),
      field_value: field.field_value?.trim() ? field.field_value.trim() : null,
    }))
    .filter((field) => field.field_key.length > 0)

  const { data: existingData, error: existingError } = await supabase
    .from('contact_custom_fields')
    .select('*')
    .eq('organization_id', input.organization_id)
    .eq('contact_id', input.contact_id)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existing = asCustomFields(existingData)
  const previousMap = new Map(existing.map((item) => [item.field_key, item.field_value ?? '']))

  const { error: deleteError } = await supabase
    .from('contact_custom_fields')
    .delete()
    .eq('organization_id', input.organization_id)
    .eq('contact_id', input.contact_id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  if (normalizedFields.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('contact_custom_fields')
    .insert(
      normalizedFields.map((field) => ({
        organization_id: input.organization_id,
        contact_id: input.contact_id,
        field_key: field.field_key,
        field_value: field.field_value,
      })),
    )
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  const saved = asCustomFields(data)

  await Promise.all(
    saved
      .filter((field) => previousMap.get(field.field_key) !== (field.field_value ?? ''))
      .map((field) =>
        createTimelineEvent({
          organization_id: input.organization_id,
          contact_id: input.contact_id,
          actor_type: input.actor_type,
          actor_user_id: input.actor_user_id,
          event_type: 'custom_field_updated',
          description: `Campo personalizado ${field.field_key} atualizado`,
          metadata: {
            field: field.field_key,
            old_value: previousMap.get(field.field_key) ?? '',
            new_value: field.field_value ?? '',
          },
        }),
      ),
  )

  return saved
}

export async function addContactNote(input: AddContactNoteInput): Promise<ContactNote> {
  const { data, error } = await supabase
    .from('contact_notes')
    .insert({
      organization_id: input.organization_id,
      contact_id: input.contact_id,
      title: input.title,
      content: input.content,
      attachment_url: input.attachment_url ?? null,
      created_by_type: input.actor_type,
      created_by_user_id: input.actor_user_id,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const note = data as ContactNote

  await createTimelineEvent({
    organization_id: input.organization_id,
    contact_id: input.contact_id,
    actor_type: input.actor_type,
    actor_user_id: input.actor_user_id,
    event_type: 'note_created',
    description: `Nota ${note.title} criada`,
  })

  if (note.attachment_url) {
    const { error: attachmentError } = await supabase.from('contact_attachments').insert({
      organization_id: input.organization_id,
      contact_id: input.contact_id,
      note_id: note.id,
      file_name: note.title,
      file_url: note.attachment_url,
      source: 'note',
      uploaded_by_user_id: input.actor_user_id,
    })

    if (attachmentError) {
      throw new Error(attachmentError.message)
    }
  }

  return note
}

export async function addContactAttachment(input: AddContactAttachmentInput): Promise<ContactAttachment> {
  const { data, error } = await supabase
    .from('contact_attachments')
    .insert({
      organization_id: input.organization_id,
      contact_id: input.contact_id,
      file_name: input.file_name,
      file_url: input.file_url,
      source: 'standalone',
      uploaded_by_user_id: input.actor_user_id,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createTimelineEvent({
    organization_id: input.organization_id,
    contact_id: input.contact_id,
    actor_type: input.actor_type,
    actor_user_id: input.actor_user_id,
    event_type: 'attachment_added',
    description: `Anexo ${input.file_name} adicionado`,
  })

  return data as ContactAttachment
}

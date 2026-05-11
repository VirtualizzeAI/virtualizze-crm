import api from '../lib/axios'
import type {
  Contact,
  ContactAttachment,
  ContactCreatedByType,
  ContactCustomField,
  ContactDetails,
  ContactNote,
  ContactType,
} from '../lib/types'

interface ApiListResponse<T> {
  data: T[]
  total: number
}

interface ApiEntityResponse<T> {
  data: T
}

export interface GetContactsParams {
  search?: string
  type?: ContactType
  assigned_user_id?: string
  unassigned?: boolean
}

export interface CreateContactPayload {
  type?: ContactType | null
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
  created_by_type?: ContactCreatedByType
}

export interface UpdateContactPayload {
  id: string
  type?: ContactType | null
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

export interface SaveContactCustomFieldsPayload {
  contactId: string
  fields: Array<{
    field_key: string
    field_value?: string | null
  }>
}

export interface CreateContactNotePayload {
  contactId: string
  title: string
  content: string
  attachment_url?: string | null
  created_by_type?: ContactCreatedByType
}

export interface CreateContactAttachmentPayload {
  contactId: string
  file_name: string
  file_url: string
  created_by_type?: ContactCreatedByType
}

export async function getContacts(params?: GetContactsParams): Promise<Contact[]> {
  const response = await api.get<ApiListResponse<Contact>>('/contacts', {
    params,
  })
  return response.data.data
}

export async function getContactDetails(id: string): Promise<ContactDetails> {
  const response = await api.get<ApiEntityResponse<ContactDetails>>(`/contacts/${id}`)
  return response.data.data
}

export async function createContact(payload: CreateContactPayload): Promise<Contact> {
  const response = await api.post<ApiEntityResponse<Contact>>('/contacts', payload)
  return response.data.data
}

export async function updateContact(payload: UpdateContactPayload): Promise<Contact> {
  const { id, ...data } = payload
  const response = await api.put<ApiEntityResponse<Contact>>(`/contacts/${id}`, data)
  return response.data.data
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/contacts/${id}`)
}

export async function saveContactCustomFields(payload: SaveContactCustomFieldsPayload): Promise<ContactCustomField[]> {
  const response = await api.put<ApiListResponse<ContactCustomField>>(`/contacts/${payload.contactId}/custom-fields`, {
    fields: payload.fields,
  })

  return response.data.data
}

export async function createContactNote(payload: CreateContactNotePayload): Promise<ContactNote> {
  const response = await api.post<ApiEntityResponse<ContactNote>>(`/contacts/${payload.contactId}/notes`, {
    title: payload.title,
    content: payload.content,
    attachment_url: payload.attachment_url,
    created_by_type: payload.created_by_type ?? 'user',
  })

  return response.data.data
}

export async function createContactAttachment(payload: CreateContactAttachmentPayload): Promise<ContactAttachment> {
  const response = await api.post<ApiEntityResponse<ContactAttachment>>(`/contacts/${payload.contactId}/attachments`, {
    file_name: payload.file_name,
    file_url: payload.file_url,
    created_by_type: payload.created_by_type ?? 'user',
  })

  return response.data.data
}

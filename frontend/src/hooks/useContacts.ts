import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createContact,
  createContactAttachment,
  createContactNote,
  deleteContact,
  getContactDetails,
  getContacts,
  saveContactCustomFields,
  updateContact,
} from '../api/contacts'
import type {
  CreateContactAttachmentPayload,
  CreateContactNotePayload,
  CreateContactPayload,
  GetContactsParams,
  SaveContactCustomFieldsPayload,
  UpdateContactPayload,
} from '../api/contacts'

export function useContactsQuery(params?: GetContactsParams) {
  return useQuery({
    queryKey: ['contacts', params ?? {}],
    queryFn: () => getContacts(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

export function useContactDetailsQuery(contactId: string | null) {
  return useQuery({
    queryKey: ['contacts', contactId],
    queryFn: () => getContactDetails(contactId as string),
    enabled: Boolean(contactId),
  })
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateContactPayload) => updateContact(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
      await queryClient.invalidateQueries({ queryKey: ['contacts', data.id] })
    },
  })
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useSaveContactCustomFieldsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaveContactCustomFieldsPayload) => saveContactCustomFields(payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
    },
  })
}

export function useCreateContactNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateContactNotePayload) => createContactNote(payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
    },
  })
}

export function useCreateContactAttachmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateContactAttachmentPayload) => createContactAttachment(payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
    },
  })
}

import { useEffect, useMemo, useState } from 'react'

import { Filter, Plus, Search, Settings2 } from 'lucide-react'

import { ContactDetailsPanel, ContactForm, ContactList } from '../components/contacts'
import {
  useContactDetailsQuery,
  useContactsQuery,
  useCreateContactAttachmentMutation,
  useCreateContactMutation,
  useCreateContactNoteMutation,
  useDeleteContactMutation,
  useSaveContactCustomFieldsMutation,
  useUpdateContactMutation,
  useUsersQuery,
} from '../hooks'
import { useAuthStore } from '../stores/authStore'
import type { Contact, ContactType } from '../lib/types'

const CUSTOM_FIELDS_STORAGE_KEY = 'contacts:custom-field-definitions'

export default function ContactsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showEditMode, setShowEditMode] = useState(false)
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<string[]>([])
  const [newCustomFieldName, setNewCustomFieldName] = useState('')

  const [filterType, setFilterType] = useState<'all' | ContactType>('all')
  const [filterResponsible, setFilterResponsible] = useState<'all' | string>('all')

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const rawValue = window.localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY)

    if (!rawValue) {
      return
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown

      if (Array.isArray(parsed)) {
        setCustomFieldDefinitions(parsed.filter((item): item is string => typeof item === 'string'))
      }
    } catch {
      setCustomFieldDefinitions([])
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(customFieldDefinitions))
  }, [customFieldDefinitions])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput])

  const contactsQueryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      type: filterType === 'all' ? undefined : filterType,
      assigned_user_id: filterResponsible !== 'all' && filterResponsible !== 'none' ? filterResponsible : undefined,
      unassigned: filterResponsible === 'none' ? true : undefined,
    }),
    [filterResponsible, filterType, search],
  )

  const contactsQuery = useContactsQuery(contactsQueryParams)
  const usersQuery = useUsersQuery()
  const detailsQuery = useContactDetailsQuery(selectedContactId)

  const createContactMutation = useCreateContactMutation()
  const updateContactMutation = useUpdateContactMutation()
  const deleteContactMutation = useDeleteContactMutation()
  const saveCustomFieldsMutation = useSaveContactCustomFieldsMutation()
  const addNoteMutation = useCreateContactNoteMutation()
  const addAttachmentMutation = useCreateContactAttachmentMutation()

  const users = usersQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null

  const isSubmittingContact = createContactMutation.isPending || updateContactMutation.isPending

  const mutationError =
    createContactMutation.error ||
    updateContactMutation.error ||
    deleteContactMutation.error ||
    saveCustomFieldsMutation.error ||
    addNoteMutation.error ||
    addAttachmentMutation.error

  const handleCreateContact = async (values: {
    type: ContactType | null
    name: string
    phone: string | null
    email: string | null
    description: string | null
    street: string | null
    street_number: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    country: string | null
    complement: string | null
    reference: string | null
    assigned_user_id: string | null
    custom_fields: Array<{ field_key: string; field_value?: string | null }>
  }) => {
    const created = await createContactMutation.mutateAsync({
      type: values.type,
      name: values.name,
      phone: values.phone,
      email: values.email,
      description: values.description,
      street: values.street,
      street_number: values.street_number,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      country: values.country,
      complement: values.complement,
      reference: values.reference,
      assigned_user_id: values.assigned_user_id,
      created_by_type: 'user',
    })

    const normalizedFields = values.custom_fields
      .map((field) => ({
        field_key: field.field_key.trim(),
        field_value: field.field_value?.trim() ? field.field_value.trim() : null,
      }))
      .filter((field) => field.field_key.length > 0)

    if (normalizedFields.length > 0) {
      await saveCustomFieldsMutation.mutateAsync({
        contactId: created.id,
        fields: normalizedFields,
      })
    }

    setSelectedContactId(created.id)
    setShowCreateModal(false)
  }

  const handleUpdateContact = async (values: {
    type: ContactType | null
    name: string
    phone: string | null
    email: string | null
    description: string | null
    street: string | null
    street_number: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    country: string | null
    complement: string | null
    reference: string | null
    assigned_user_id: string | null
    custom_fields: Array<{ field_key: string; field_value?: string | null }>
  }) => {
    if (!selectedContact) {
      return
    }

    await updateContactMutation.mutateAsync({
      id: selectedContact.id,
      type: values.type,
      name: values.name,
      phone: values.phone,
      email: values.email,
      description: values.description,
      street: values.street,
      street_number: values.street_number,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      country: values.country,
      complement: values.complement,
      reference: values.reference,
      assigned_user_id: values.assigned_user_id,
    })

    setShowEditMode(false)
  }

  const handleDeleteSelectedContact = async () => {
    if (!selectedContactId) {
      return
    }

    await deleteContactMutation.mutateAsync(selectedContactId)
    setSelectedContactId(null)
    setShowEditMode(false)
  }

  const handleAddCustomFieldDefinition = () => {
    const normalized = newCustomFieldName.trim()

    if (!normalized) {
      return
    }

    setCustomFieldDefinitions((current) => {
      if (current.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
        return current
      }

      return [...current, normalized]
    })

    setNewCustomFieldName('')
  }

  const handleRemoveCustomFieldDefinition = (fieldName: string) => {
    setCustomFieldDefinitions((current) => current.filter((item) => item !== fieldName))
  }

  if ((!contactsQuery.data && contactsQuery.isLoading) || (!usersQuery.data && usersQuery.isLoading)) {
    return (
      <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
        <p className="text-sm text-ink/70">Carregando contatos...</p>
      </section>
    )
  }

  if (contactsQuery.isError || usersQuery.isError) {
    return (
      <section className="rounded-xl border border-coral/30 bg-coral/10 p-8 shadow-panel">
        <p className="text-sm text-coral">Não foi possível carregar a base de contatos.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void contactsQuery.refetch()}
            className="rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
          >
            Recarregar contatos
          </button>
          <button
            type="button"
            onClick={() => void usersQuery.refetch()}
            className="rounded-lg border border-coral/40 px-3 py-2 text-xs font-semibold text-coral"
          >
            Recarregar usuários
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white/85 p-4 shadow-panel">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Buscar contato</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink/45" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Pesquisar contatos"
                className="w-full rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-pine"
              />
            </span>
          </label>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Filtros</p>
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/80"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Abrir filtros'}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Adicionar contato</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-pine/30 bg-pine px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Novo contato
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Configurações</p>
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/80"
            >
              <Settings2 className="h-4 w-4" />
              Opções
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-3 grid gap-3 rounded-lg border border-black/10 bg-white p-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
              Tipo
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value as 'all' | ContactType)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              >
                <option value="all">Todos</option>
                <option value="PF">PF</option>
                <option value="PJ">PJ</option>
              </select>
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
              Responsável
              <select
                value={filterResponsible}
                onChange={(event) => setFilterResponsible(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              >
                <option value="all">Todos</option>
                <option value="none">Sem responsável</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {showSettings ? (
          <div className="mt-3 space-y-3 rounded-lg border border-black/10 bg-white p-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/70">Campos personalizados globais</h3>
              <p className="mt-1 text-sm text-ink/65">
                Os campos configurados aqui aparecem para todos os contatos existentes e novos.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={newCustomFieldName}
                onChange={(event) => setNewCustomFieldName(event.target.value)}
                placeholder="Ex.: CPF, Origem, Segmento"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              />
              <button
                type="button"
                onClick={handleAddCustomFieldDefinition}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-ink/80"
              >
                Adicionar campo
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {customFieldDefinitions.length === 0 ? (
                <p className="text-sm text-ink/60">Nenhum campo global configurado.</p>
              ) : (
                customFieldDefinitions.map((fieldName) => (
                  <span
                    key={fieldName}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-paper px-3 py-1 text-xs font-semibold text-ink/75"
                  >
                    {fieldName}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFieldDefinition(fieldName)}
                      className="text-coral"
                      aria-label={`Remover campo ${fieldName}`}
                    >
                      x
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        ) : null}
      </section>

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Nenhum contato encontrado</h2>
            <p className="mt-2 text-sm text-ink/65">Ajuste os filtros ou cadastre um novo contato.</p>
          </section>
        ) : (
          <ContactList
            contacts={contacts}
            users={users}
            selectedContactId={selectedContactId}
            onSelect={(contact) => {
              setSelectedContactId(contact.id)
              setShowEditMode(false)
            }}
          />
        )}
      </div>

      {mutationError ? (
        <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
          Ocorreu um erro ao processar alterações de contatos.
        </p>
      ) : null}

      {selectedContactId ? (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedContactId(null)
              setShowEditMode(false)
            }
          }}
        >
          <div className="w-full max-w-5xl max-h-[92vh] space-y-4 overflow-y-auto rounded-xl border border-black/10 bg-white p-4 shadow-panel sm:p-5">
            <section className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedContact?.name ?? 'Contato selecionado'}</h2>
                  <p className="text-sm text-ink/70">
                    {selectedContact?.phone || 'Sem telefone'} • {selectedContact?.email || 'Sem e-mail'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditMode((current) => !current)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80"
                  >
                    {showEditMode ? 'Fechar edição' : 'Editar contato'}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteSelectedContact()}
                    disabled={deleteContactMutation.isPending}
                    className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleteContactMutation.isPending ? 'Excluindo...' : 'Excluir contato'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContactId(null)
                      setShowEditMode(false)
                    }}
                    className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </section>

            {showEditMode && selectedContact ? (
              <ContactForm
                contact={selectedContact}
                users={users}
                currentUserId={currentUserId}
                fieldDefinitions={customFieldDefinitions}
                isSubmitting={isSubmittingContact}
                onSubmit={handleUpdateContact}
                onCancelEdit={() => setShowEditMode(false)}
              />
            ) : null}

            <ContactDetailsPanel
              details={detailsQuery.data ?? null}
              users={users}
              fieldDefinitions={customFieldDefinitions}
              isLoading={detailsQuery.isLoading}
              isError={detailsQuery.isError}
              isSavingFields={saveCustomFieldsMutation.isPending}
              isAddingNote={addNoteMutation.isPending}
              isAddingAttachment={addAttachmentMutation.isPending}
              onSaveCustomFields={async (fields) => {
                if (!selectedContactId) {
                  return
                }

                await saveCustomFieldsMutation.mutateAsync({
                  contactId: selectedContactId,
                  fields,
                })
              }}
              onAddNote={async (payload) => {
                if (!selectedContactId) {
                  return
                }

                await addNoteMutation.mutateAsync({
                  contactId: selectedContactId,
                  title: payload.title,
                  content: payload.content,
                  attachment_url: payload.attachment_url,
                  created_by_type: 'user',
                })
              }}
              onAddAttachment={async (payload) => {
                if (!selectedContactId) {
                  return
                }

                await addAttachmentMutation.mutateAsync({
                  contactId: selectedContactId,
                  file_name: payload.file_name,
                  file_url: payload.file_url,
                  created_by_type: 'user',
                })
              }}
            />
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false)
            }
          }}
        >
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl">
            <ContactForm
              contact={null}
              users={users}
              currentUserId={currentUserId}
              fieldDefinitions={customFieldDefinitions}
              isSubmitting={isSubmittingContact}
              onSubmit={handleCreateContact}
              onCancelEdit={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
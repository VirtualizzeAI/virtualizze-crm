import { useEffect, useState } from 'react'

import type { Contact, ContactType, UserSummary } from '../../lib/types'

interface ContactFormValues {
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
}

interface ContactFormProps {
  contact: Contact | null
  users: UserSummary[]
  currentUserId: string | null
  fieldDefinitions: string[]
  isSubmitting: boolean
  onSubmit: (values: ContactFormValues) => Promise<void>
  onCancelEdit: () => void
}

export function ContactForm({ contact, users, currentUserId, fieldDefinitions, isSubmitting, onSubmit, onCancelEdit }: ContactFormProps) {
  const [type, setType] = useState<ContactType | null>('PF')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [stateField, setStateField] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [complement, setComplement] = useState('')
  const [reference, setReference] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')
  const [customFields, setCustomFields] = useState<Array<{ field_key: string; field_value?: string | null }>>([])

  useEffect(() => {
    if (!contact) {
      setType('PF')
      setName('')
      setPhone('')
      setEmail('')
      setDescription('')
      setStreet('')
      setStreetNumber('')
      setNeighborhood('')
      setCity('')
      setStateField('')
      setCountry('Brasil')
      setComplement('')
      setReference('')
      setAssignedUserId(currentUserId ?? '')
      setCustomFields(fieldDefinitions.map((fieldKey) => ({ field_key: fieldKey, field_value: null })))
      return
    }

    setType(contact.type)
    setName(contact.name)
    setPhone(contact.phone ?? '')
    setEmail(contact.email ?? '')
    setDescription(contact.description ?? '')
    setStreet(contact.street ?? '')
    setStreetNumber(contact.street_number ?? '')
    setNeighborhood(contact.neighborhood ?? '')
    setCity(contact.city ?? '')
    setStateField(contact.state ?? '')
    setCountry(contact.country ?? 'Brasil')
    setComplement(contact.complement ?? '')
    setReference(contact.reference ?? '')
    setAssignedUserId(contact.assigned_user_id ?? '')
    setCustomFields([])
  }, [contact, currentUserId, fieldDefinitions])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (name.trim().length < 2) {
      return
    }

    await onSubmit({
      type,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      description: description.trim() || null,
      street: street.trim() || null,
      street_number: streetNumber.trim() || null,
      neighborhood: neighborhood.trim() || null,
      city: city.trim() || null,
      state: stateField.trim() || null,
      country: country.trim() || null,
      complement: complement.trim() || null,
      reference: reference.trim() || null,
      assigned_user_id: assignedUserId || null,
      custom_fields: customFields,
    })

    if (!contact) {
      setName('')
      setPhone('')
      setEmail('')
      setDescription('')
      setStreet('')
      setStreetNumber('')
      setNeighborhood('')
      setCity('')
      setStateField('')
      setCountry('Brasil')
      setComplement('')
      setReference('')
      setAssignedUserId(currentUserId ?? '')
      setType('PF')
      setCustomFields(fieldDefinitions.map((fieldKey) => ({ field_key: fieldKey, field_value: null })))
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-panel">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{contact ? 'Editar contato' : 'Novo contato'}</h2>
        <p className="text-sm text-ink/65">Cadastre nome, telefone, e-mail, responsável e origem do contato.</p>
      </header>

      <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          Tipo
          <select
            value={type ?? ''}
            onChange={(event) => setType((event.target.value as ContactType) || null)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
          >
            <option value="PF">PF</option>
            <option value="PJ">PJ</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          Nome
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do contato"
            required
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
            Telefone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contato@empresa.com"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
            />
          </label>
        </div>

        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          Responsável
          <select
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
          >
            <option value="">Sem responsável</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
          Descrição
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Informações importantes sobre este contato"
            className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
          />
        </label>

        {!contact && customFields.length > 0 ? (
          <div className="rounded-lg border border-black/10 bg-paper/40 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">Campos personalizados</p>

            <div className="space-y-2">
              {customFields.map((field, index) => (
                <label key={field.field_key} className="space-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
                  {field.field_key}
                  <input
                    value={field.field_value ?? ''}
                    onChange={(event) =>
                      setCustomFields((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, field_value: event.target.value || null } : item,
                        ),
                      )
                    }
                    placeholder={`Informe ${field.field_key}`}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-black/10 bg-paper/40 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">Endereço</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 sm:col-span-2">
              Rua
              <input
                value={street}
                onChange={(event) => setStreet(event.target.value)}
                placeholder="Rua"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Número
              <input
                value={streetNumber}
                onChange={(event) => setStreetNumber(event.target.value)}
                placeholder="123"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Bairro
              <input
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                placeholder="Bairro"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Cidade
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Cidade"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Estado
              <input
                value={stateField}
                onChange={(event) => setStateField(event.target.value)}
                placeholder="Estado"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              País
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="País"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Complemento
              <input
                value={complement}
                onChange={(event) => setComplement(event.target.value)}
                placeholder="Complemento"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>

            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">
              Referência
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Ponto de referência"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg border border-pine/30 bg-pine px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Salvando...' : contact ? 'Salvar alterações' : 'Criar contato'}
          </button>

          {contact ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ink/75"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}

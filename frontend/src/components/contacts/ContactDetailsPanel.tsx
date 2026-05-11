import { useEffect, useMemo, useState } from 'react'

import type {
  ContactAttachment,
  ContactCustomField,
  ContactDealSummary,
  ContactDetails,
  ContactNote,
  ContactTimelineEvent,
  UserSummary,
} from '../../lib/types'

type ContactTab = 'dados' | 'negocios' | 'rastreio' | 'notas' | 'anexos' | 'timeline'

const TRACKING_FIELDS: Array<{ key: string; label: string; placeholder: string }> = [
  { key: 'utm_source', label: 'UTM Source', placeholder: 'google, meta, tiktok...' },
  { key: 'utm_medium', label: 'UTM Medium', placeholder: 'cpc, social, email...' },
  { key: 'utm_campaign', label: 'UTM Campaign', placeholder: 'nome da campanha' },
  { key: 'utm_content', label: 'UTM Content', placeholder: 'criativo ou variação' },
  { key: 'utm_term', label: 'UTM Term', placeholder: 'palavra-chave' },
  { key: 'page_id', label: 'Page ID', placeholder: 'identificador da página' },
  { key: 'landing_page', label: 'Landing Page', placeholder: 'URL de entrada' },
  { key: 'referrer_url', label: 'Referrer URL', placeholder: 'URL de origem' },
  { key: 'event_name', label: 'Event Name', placeholder: 'lead, purchase, add_to_cart...' },
  { key: 'fbc', label: 'FBC (Meta)', placeholder: 'fb.1.xxxxx' },
  { key: 'fbp', label: 'FBP (Meta)', placeholder: 'fb.1.xxxxx' },
  { key: 'fbclid', label: 'FBCLID (Meta)', placeholder: 'clique da Meta' },
  { key: 'gclid', label: 'GCLID (Google Ads)', placeholder: 'clique do Google Ads' },
  { key: 'gbraid', label: 'GBRAID (Google Ads)', placeholder: 'id para iOS' },
  { key: 'wbraid', label: 'WBRAID (Google Ads)', placeholder: 'id para web-to-app' },
  { key: 'campaign_id', label: 'Campaign ID', placeholder: 'id da campanha' },
  { key: 'adset_id', label: 'Ad Set ID', placeholder: 'id do conjunto de anúncios' },
  { key: 'ad_id', label: 'Ad ID', placeholder: 'id do anúncio' },
]

const TRACKING_FIELD_KEYS = new Set(TRACKING_FIELDS.map((item) => item.key))

interface ContactDetailsPanelProps {
  details: ContactDetails | null
  users: UserSummary[]
  fieldDefinitions: string[]
  isLoading: boolean
  isError: boolean
  isSavingFields: boolean
  isAddingNote: boolean
  isAddingAttachment: boolean
  onSaveCustomFields: (fields: Array<{ field_key: string; field_value?: string | null }>) => Promise<void>
  onAddNote: (payload: { title: string; content: string; attachment_url?: string | null }) => Promise<void>
  onAddAttachment: (payload: { file_name: string; file_url: string }) => Promise<void>
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function TimelineList({ timeline, usersMap }: { timeline: ContactTimelineEvent[]; usersMap: Map<string, string> }) {
  if (timeline.length === 0) {
    return <p className="text-sm text-ink/60">Sem eventos na linha do tempo.</p>
  }

  return (
    <ul className="space-y-2">
      {timeline.map((event) => (
        <li key={event.id} className="rounded-lg border border-black/10 bg-white p-3">
          <p className="text-sm font-medium text-ink">{event.description}</p>
          <p className="mt-1 text-xs text-ink/55">
            por {event.actor_user_id ? (usersMap.get(event.actor_user_id) ?? 'Usuário removido') : 'Automação'} em{' '}
            {formatDateTime(event.created_at)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function NotesList({ notes }: { notes: ContactNote[] }) {
  if (notes.length === 0) {
    return <p className="text-sm text-ink/60">Nenhuma nota cadastrada.</p>
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note.id} className="rounded-lg border border-black/10 bg-white p-3">
          <p className="text-sm font-semibold text-ink">{note.title}</p>
          <p className="mt-1 text-sm text-ink/75">{note.content}</p>
          {note.attachment_url ? (
            <a href={note.attachment_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-pine hover:underline">
              Ver anexo da nota
            </a>
          ) : null}
          <p className="mt-1 text-xs text-ink/55">{formatDateTime(note.created_at)}</p>
        </li>
      ))}
    </ul>
  )
}

function AttachmentsList({ attachments }: { attachments: ContactAttachment[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-ink/60">Nenhum anexo cadastrado.</p>
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="rounded-lg border border-black/10 bg-white p-3">
          <p className="text-sm font-semibold text-ink">{attachment.file_name}</p>
          <a href={attachment.file_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-pine hover:underline">
            Abrir arquivo
          </a>
          <p className="mt-1 text-xs text-ink/55">
            Origem: {attachment.source === 'note' ? 'Nota' : 'Avulso'} • {formatDateTime(attachment.created_at)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function LinkedDealsList({ deals }: { deals: ContactDealSummary[] }) {
  if (deals.length === 0) {
    return <p className="text-sm text-ink/60">Nenhum negócio vinculado a este contato.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-paper/50 text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
            <th scope="col" className="px-4 py-2">Negócio</th>
            <th scope="col" className="px-4 py-2">Valor</th>
            <th scope="col" className="px-4 py-2">Status</th>
            <th scope="col" className="px-4 py-2">Criado em</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-b border-black/5 last:border-b-0">
              <td className="px-4 py-2 font-medium text-ink">{deal.name}</td>
              <td className="px-4 py-2 text-ink/80">{formatMoney(deal.value ?? 0)}</td>
              <td className="px-4 py-2 text-ink/80">{deal.status}</td>
              <td className="px-4 py-2 text-ink/70">{formatDateTime(deal.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ContactDetailsPanel({
  details,
  users,
  fieldDefinitions,
  isLoading,
  isError,
  isSavingFields,
  isAddingNote,
  isAddingAttachment,
  onSaveCustomFields,
  onAddNote,
  onAddAttachment,
}: ContactDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<ContactTab>('dados')
  const [fields, setFields] = useState<ContactCustomField[]>([])
  const [trackingFields, setTrackingFields] = useState<Array<{ field_key: string; field_value?: string | null }>>([])

  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteAttachmentUrl, setNoteAttachmentUrl] = useState('')

  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  useEffect(() => {
    setActiveTab('dados')
  }, [details?.contact.id])

  useEffect(() => {
    const currentFields = details?.custom_fields ?? []
    const customFields = currentFields.filter((item) => !TRACKING_FIELD_KEYS.has(item.field_key))
    const trackingMap = new Map(
      currentFields
        .filter((item) => TRACKING_FIELD_KEYS.has(item.field_key))
        .map((item) => [item.field_key, item.field_value ?? null]),
    )
    const currentMap = new Map(customFields.map((item) => [item.field_key, item]))
    const mergedKeys = [...new Set([...fieldDefinitions, ...customFields.map((item) => item.field_key)])]

    if (!details) {
      setFields([])
      setTrackingFields([])
      return
    }

    setFields(
      mergedKeys.map((key) => {
        const existing = currentMap.get(key)

        if (existing) {
          return existing
        }

        return {
          id: `new-${key}`,
          organization_id: details.contact.organization_id,
          contact_id: details.contact.id,
          field_key: key,
          field_value: null,
          created_at: new Date().toISOString(),
        }
      }),
    )

    setTrackingFields(
      TRACKING_FIELDS.map((trackingField) => ({
        field_key: trackingField.key,
        field_value: trackingMap.get(trackingField.key) ?? null,
      })),
    )
  }, [details, fieldDefinitions])

  const usersMap = useMemo(() => new Map(users.map((item) => [item.id, item.name])), [users])

  if (isLoading) {
    return (
      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-panel">
        <p className="text-sm text-ink/70">Carregando detalhes do contato...</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-coral/30 bg-coral/10 p-5 shadow-panel">
        <p className="text-sm text-coral">Não foi possível carregar os detalhes do contato.</p>
      </section>
    )
  }

  if (!details) {
    return (
      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-panel">
        <p className="text-sm text-ink/70">Selecione um contato para visualizar detalhes.</p>
      </section>
    )
  }

  const buildAllFieldsPayload = (
    customValues: Array<{ field_key: string; field_value?: string | null }>,
    trackingValues: Array<{ field_key: string; field_value?: string | null }>,
  ) => {
    return [...customValues, ...trackingValues]
      .map((field) => ({
        field_key: field.field_key.trim(),
        field_value: field.field_value?.trim() ? field.field_value.trim() : null,
      }))
      .filter((field) => field.field_key.length > 0)
  }

  const handleSaveFields = async () => {
    await onSaveCustomFields(
      buildAllFieldsPayload(
        fields.map((field) => ({ field_key: field.field_key, field_value: field.field_value })),
        trackingFields,
      ),
    )
  }

  const handleSaveTracking = async () => {
    await onSaveCustomFields(
      buildAllFieldsPayload(
        fields.map((field) => ({ field_key: field.field_key, field_value: field.field_value })),
        trackingFields,
      ),
    )
  }

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!noteTitle.trim() || !noteContent.trim()) {
      return
    }

    await onAddNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      attachment_url: noteAttachmentUrl.trim() || null,
    })

    setNoteTitle('')
    setNoteContent('')
    setNoteAttachmentUrl('')
  }

  const handleAddAttachment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!attachmentName.trim() || !attachmentUrl.trim()) {
      return
    }

    await onAddAttachment({
      file_name: attachmentName.trim(),
      file_url: attachmentUrl.trim(),
    })

    setAttachmentName('')
    setAttachmentUrl('')
  }

  return (
    <section className="space-y-4 rounded-xl border border-black/10 bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-3">
        {[
          { key: 'dados', label: 'Dados' },
          { key: 'negocios', label: 'Negócios' },
          { key: 'rastreio', label: 'Rastreio' },
          { key: 'notas', label: 'Notas' },
          { key: 'anexos', label: 'Anexos' },
          { key: 'timeline', label: 'Linha do tempo' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as ContactTab)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.key
                ? 'border-pine/40 bg-pine/10 text-pine'
                : 'border-black/10 bg-white text-ink/75 hover:bg-paper/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dados' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Nome</p>
              <p className="text-sm font-semibold text-ink">{details.contact.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Tipo</p>
              <p className="text-sm text-ink/80">{details.contact.type || 'Não definido'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Telefone</p>
              <p className="text-sm text-ink/80">{details.contact.phone || 'Sem telefone'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">E-mail</p>
              <p className="text-sm text-ink/80">{details.contact.email || 'Sem e-mail'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Responsável</p>
              <p className="text-sm text-ink/80">
                {details.contact.assigned_user_id
                  ? (usersMap.get(details.contact.assigned_user_id) ?? 'Usuário removido')
                  : 'Não definido'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Criado em</p>
              <p className="text-sm text-ink/80">{formatDateTime(details.contact.created_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Descrição</p>
            <p className="text-sm text-ink/80">{details.contact.description || 'Sem descrição'}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">Endereço</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Rua:</span> {details.contact.street || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Número:</span> {details.contact.street_number || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Bairro:</span> {details.contact.neighborhood || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Cidade:</span> {details.contact.city || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Estado:</span> {details.contact.state || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">País:</span> {details.contact.country || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Complemento:</span> {details.contact.complement || 'Não informado'}
              </p>
              <p className="text-sm text-ink/80">
                <span className="font-semibold">Referência:</span> {details.contact.reference || 'Não informada'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-paper/40 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/70">Campos personalizados</h3>
            <p className="mt-1 text-xs text-ink/60">Configure os campos na área de configurações da página de contatos.</p>

            {fields.length === 0 ? (
              <p className="mt-3 text-sm text-ink/65">Nenhum campo personalizado configurado.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {fields.map((field, index) => (
                  <li key={`${field.field_key}-${index}`} className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                    <input
                      value={field.field_key}
                      readOnly
                      className="rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm text-ink/70"
                    />
                    <input
                      value={field.field_value ?? ''}
                      onChange={(event) =>
                        setFields((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, field_value: event.target.value || null } : item,
                          ),
                        )
                      }
                      placeholder="Valor"
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                    />
                  </li>
                ))}
              </ul>
            )}

            {fields.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleSaveFields()}
                disabled={isSavingFields}
                className="mt-3 rounded-lg border border-pine/30 bg-pine px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingFields ? 'Salvando...' : 'Salvar campos'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'negocios' ? <LinkedDealsList deals={details.linked_deals} /> : null}

      {activeTab === 'rastreio' ? (
        <div className="space-y-4 rounded-lg border border-black/10 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/70">Rastreio de marketing</h3>
            <p className="mt-1 text-xs text-ink/60">UTMs, identificadores e parâmetros usados por Meta Ads e Google Ads.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TRACKING_FIELDS.map((trackingField, index) => (
              <label key={trackingField.key} className="space-y-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
                {trackingField.label}
                <input
                  value={trackingFields[index]?.field_value ?? ''}
                  onChange={(event) =>
                    setTrackingFields((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, field_value: event.target.value || null } : item,
                      ),
                    )
                  }
                  placeholder={trackingField.placeholder}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleSaveTracking()}
            disabled={isSavingFields}
            className="rounded-lg border border-pine/30 bg-pine px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingFields ? 'Salvando...' : 'Salvar rastreio'}
          </button>
        </div>
      ) : null}

      {activeTab === 'notas' ? (
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <form className="space-y-2" onSubmit={(event) => void handleAddNote(event)}>
            <input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Título"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              required
            />
            <textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="Conteúdo"
              rows={3}
              className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              required
            />
            <input
              value={noteAttachmentUrl}
              onChange={(event) => setNoteAttachmentUrl(event.target.value)}
              placeholder="URL do anexo (opcional)"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
            />
            <button
              type="submit"
              disabled={isAddingNote}
              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAddingNote ? 'Adicionando...' : 'Adicionar nota'}
            </button>
          </form>

          <div className="mt-3">
            <NotesList notes={details.notes} />
          </div>
        </div>
      ) : null}

      {activeTab === 'anexos' ? (
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <form className="space-y-2" onSubmit={(event) => void handleAddAttachment(event)}>
            <input
              value={attachmentName}
              onChange={(event) => setAttachmentName(event.target.value)}
              placeholder="Nome do arquivo"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              required
            />
            <input
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              placeholder="URL do arquivo"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              required
            />
            <button
              type="submit"
              disabled={isAddingAttachment}
              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-ink/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAddingAttachment ? 'Adicionando...' : 'Adicionar anexo'}
            </button>
          </form>

          <div className="mt-3">
            <AttachmentsList attachments={details.attachments} />
          </div>
        </div>
      ) : null}

      {activeTab === 'timeline' ? <TimelineList timeline={details.timeline} usersMap={usersMap} /> : null}
    </section>
  )
}

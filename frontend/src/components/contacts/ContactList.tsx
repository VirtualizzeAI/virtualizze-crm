import type { Contact, UserSummary } from '../../lib/types'

interface ContactListProps {
  contacts: Contact[]
  users: UserSummary[]
  selectedContactId: string | null
  onSelect: (contact: Contact) => void
}

export function ContactList({
  contacts,
  users,
  selectedContactId,
  onSelect,
}: ContactListProps) {
  const usersMap = new Map(users.map((item) => [item.id, item.name]))

  return (
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-panel">
      <header className="border-b border-black/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">Contatos cadastrados</h2>
        <p className="text-sm text-ink/65">Clique em um contato para abrir os detalhes.</p>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-paper/60 text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
              <th scope="col" className="px-5 py-3">
                Nome
              </th>
              <th scope="col" className="px-5 py-3">
                Telefone
              </th>
              <th scope="col" className="px-5 py-3">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const responsible = contact.assigned_user_id
                ? (usersMap.get(contact.assigned_user_id) ?? 'Usuário removido')
                : 'Não definido'

              return (
                <tr
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className={`cursor-pointer border-b border-black/5 transition hover:bg-pine/5 ${
                    selectedContactId === contact.id ? 'bg-pine/10' : 'bg-white'
                  }`}
                >
                  <td className="px-5 py-3 font-semibold text-ink">{contact.name}</td>
                  <td className="px-5 py-3 text-ink/80">{contact.phone || 'Sem telefone'}</td>
                  <td className="px-5 py-3 text-ink/80">{responsible}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

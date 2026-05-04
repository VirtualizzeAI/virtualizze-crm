# MVP — CRM + Atendimento WhatsApp
> Arquitetura: Backend separado (API REST) + Frontend desacoplado
> Stack: Node.js/Fastify + Supabase + React/TypeScript + Evolution API

---

## 🏗️ ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│            React + TypeScript + Vite + TailwindCSS          │
│    CRM │ Atendimento │ Contatos │ Equipes │ Tarefas │ Produtos│
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS (REST + WebSocket)
┌───────────────────────▼─────────────────────────────────────┐
│                     BACKEND (API)                           │
│              Fastify + TypeScript + Supabase SDK            │
│        Auth │ CRM │ Chat │ Contacts │ Teams │ Tasks │ Products│
└─────┬──────────────┬───────────────┬───────────────┬────────┘
      │              │               │               │
┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Supabase  │ │ Evolution  │ │  Meta Cloud│ │  Supabase  │
│ PostgreSQL │ │   API      │ │  API (WA)  │ │  Storage   │
│ + Auth     │ │ (não ofic.)│ │  (oficial) │ │  (mídias)  │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

---

## 📦 STACK DEFINITIVA

| Camada | Tecnologia | Motivo |
|---|---|---|
| Backend | **Fastify + TypeScript** | Mais rápido que Express, schemas nativos, perfeito com Supabase |
| Banco | **Supabase (PostgreSQL)** | Já conheces, RLS, Realtime, Storage integrado |
| Auth | **Supabase Auth** | JWT nativo, multi-tenant com RLS |
| Realtime | **Supabase Realtime** | WebSocket para chat ao vivo |
| Storage | **Supabase Storage** | Mídias do WhatsApp (imagens, docs, áudios) |
| Frontend | **React + TypeScript + Vite** | Teu stack atual |
| UI | **TailwindCSS + shadcn/ui** | Produção rápida de interface profissional |
| WhatsApp Não Oficial | **Evolution API** | Já tens no VPS |
| WhatsApp Oficial | **Meta Cloud API** | Webhooks via backend |
| Drag & Drop | **@dnd-kit/core** | Melhor opção pra Kanban em React |
| Áudio | **MediaRecorder API** | Nativo no browser, sem dependência |
| Deploy Backend | **Railway ou VPS Hostinger** | Docker container simples |
| Deploy Frontend | **Vercel** | Teu padrão atual |

---

## 🗃️ SCHEMA DO BANCO (Supabase / PostgreSQL)

### Tabela: `organizations` (Multi-tenant raiz)
```sql
id              uuid PK
name            text NOT NULL
slug            text UNIQUE
plan            text DEFAULT 'free'
created_at      timestamptz
```

### Tabela: `users` (via Supabase Auth + perfil)
```sql
id              uuid PK (= auth.users.id)
organization_id uuid FK organizations
name            text
avatar_url      text
role            text -- 'admin' | 'supervisor' | 'agent'
created_at      timestamptz
```

### Tabela: `teams`
```sql
id              uuid PK
organization_id uuid FK
name            text NOT NULL
description     text
access_type     text -- 'all_contacts' | 'assigned_only' | 'team_only'
created_at      timestamptz
```

### Tabela: `team_members`
```sql
id              uuid PK
team_id         uuid FK teams
user_id         uuid FK users
role            text -- 'leader' | 'member'
```

### Tabela: `pipelines`
```sql
id              uuid PK
organization_id uuid FK
name            text NOT NULL
description     text
is_active       boolean DEFAULT true
created_at      timestamptz
```

### Tabela: `pipeline_stages`
```sql
id              uuid PK
pipeline_id     uuid FK pipelines
name            text NOT NULL
position        integer NOT NULL  -- ordem no kanban
color           text              -- cor da coluna
created_at      timestamptz
```

### Tabela: `contacts`
```sql
id              uuid PK
organization_id uuid FK
type            text -- 'PF' | 'PJ'
name            text NOT NULL
document        text -- CPF ou CNPJ
phone           text
email           text
description     text
-- Endereço
street          text
neighborhood    text
city            text
state           text
zip_code        text
country         text DEFAULT 'Brasil'
complement      text
-- Controle
assigned_user_id uuid FK users
assigned_team_id uuid FK teams
tags            text[]
created_at      timestamptz
updated_at      timestamptz
```

### Tabela: `contact_custom_fields` (valores por contato)
```sql
id              uuid PK
contact_id      uuid FK contacts
field_key       text NOT NULL
field_value     text
```

### Tabela: `deals` (negócios do CRM)
```sql
id              uuid PK
organization_id uuid FK
pipeline_id     uuid FK pipelines
stage_id        uuid FK pipeline_stages
name            text NOT NULL           -- nome do negócio
contact_id      uuid FK contacts        -- contato atribuído
phone           text
email           text
description     text
notes           text
value           numeric DEFAULT 0
responsible_user_id  uuid FK users      -- agente responsável
responsible_team_id  uuid FK teams      -- equipe responsável
tags            text[]
position        integer                  -- ordem dentro da etapa (kanban)
status          text DEFAULT 'open'     -- 'open' | 'won' | 'lost'
lost_reason     text
won_at          timestamptz
lost_at         timestamptz
created_at      timestamptz
updated_at      timestamptz
```

### Tabela: `deal_products` (produtos/serviços vinculados ao negócio)
```sql
id          uuid PK
deal_id     uuid FK deals
product_id  uuid FK products
quantity    numeric
unit_price  numeric
discount    numeric DEFAULT 0
subtotal    numeric GENERATED
```

### Tabela: `deal_custom_fields`
```sql
id          uuid PK
deal_id     uuid FK deals
field_key   text NOT NULL
field_value text
```

### Tabela: `products`
```sql
id              uuid PK
organization_id uuid FK
name            text NOT NULL
description     text
value           numeric NOT NULL
unit            text -- 'un' | 'kg' | 'l' | 'h' | 'm' | etc.
category        text
stock           numeric DEFAULT 0
promo_type      text    -- 'percent' | 'fixed' | null
promo_value     numeric -- % ou valor absoluto
is_active       boolean DEFAULT true
created_at      timestamptz
```

### Tabela: `tasks`
```sql
id              uuid PK
organization_id uuid FK
name            text NOT NULL
description     text
status          text DEFAULT 'pending' -- 'pending' | 'in_progress' | 'done'
priority        text DEFAULT 'medium'  -- 'low' | 'medium' | 'high'
responsible_id  uuid FK users
team_id         uuid FK teams
contact_id      uuid FK contacts
deal_id         uuid FK deals  -- opcional, tarefa pode estar em um negócio
due_date        date
created_at      timestamptz
-- days_late: calculado no backend (due_date - hoje quando status != 'done')
```

### Tabela: `whatsapp_instances`
```sql
id              uuid PK
organization_id uuid FK
name            text
type            text -- 'official' | 'unofficial'
phone_number    text
status          text -- 'connected' | 'disconnected' | 'qr_pending'
evolution_instance_name text  -- para API não oficial
meta_phone_id   text          -- para API oficial
meta_token      text
team_id         uuid FK teams  -- instância atribuída a uma equipe (opcional)
created_at      timestamptz
```

### Tabela: `conversations`
```sql
id              uuid PK
organization_id uuid FK
instance_id     uuid FK whatsapp_instances
contact_id      uuid FK contacts
assigned_user_id uuid FK users
assigned_team_id uuid FK teams
status          text DEFAULT 'open'  -- 'open' | 'pending' | 'resolved'
tags            text[]
notes           text
unread_count    integer DEFAULT 0
last_message_at timestamptz
created_at      timestamptz
```

### Tabela: `messages`
```sql
id              uuid PK
conversation_id uuid FK conversations
from_me         boolean NOT NULL
message_type    text  -- 'text'|'image'|'audio'|'video'|'document'|'sticker'
content         text  -- texto ou legenda
media_url       text  -- URL no Supabase Storage
media_mime      text
file_name       text
duration        integer  -- segundos (áudio)
status          text  -- 'sent'|'delivered'|'read'|'failed'
whatsapp_id     text  -- ID original do WhatsApp
created_at      timestamptz
```

### Tabela: `notes` (notas em contatos, negócios, tarefas)
```sql
id          uuid PK
entity_type text  -- 'contact' | 'deal' | 'task'
entity_id   uuid
user_id     uuid FK users
content     text NOT NULL
created_at  timestamptz
```

### Tabela: `custom_field_definitions` (definição dos campos personalizados)
```sql
id              uuid PK
organization_id uuid FK
entity_type     text  -- 'contact' | 'deal'
field_key       text NOT NULL
field_label     text NOT NULL
field_type      text  -- 'text'|'number'|'date'|'select'|'boolean'
options         jsonb -- para tipo 'select'
is_required     boolean DEFAULT false
position        integer
```

---

## 🔌 API ENDPOINTS (Backend Fastify)

### Auth
```
POST   /auth/login
POST   /auth/logout
GET    /auth/me
POST   /auth/invite          -- convidar novo usuário
```

### CRM — Pipelines
```
GET    /pipelines
POST   /pipelines
PUT    /pipelines/:id
DELETE /pipelines/:id

GET    /pipelines/:id/stages
POST   /pipelines/:id/stages
PUT    /pipelines/:id/stages/:stageId
DELETE /pipelines/:id/stages/:stageId
PUT    /pipelines/:id/stages/reorder   -- reordenar etapas
```

### CRM — Deals
```
GET    /deals                        -- list (query: pipeline_id, stage_id, assignee...)
POST   /deals
GET    /deals/:id
PUT    /deals/:id
DELETE /deals/:id
PATCH  /deals/:id/move               -- mover de etapa (drag & drop)
PATCH  /deals/:id/win
PATCH  /deals/:id/lose
GET    /deals/:id/products
POST   /deals/:id/products
DELETE /deals/:id/products/:productId
GET    /deals/:id/notes
POST   /deals/:id/notes
GET    /deals/:id/tasks
```

### Contatos
```
GET    /contacts                     -- list + filtros + busca
POST   /contacts
GET    /contacts/:id
PUT    /contacts/:id
DELETE /contacts/:id
GET    /contacts/:id/deals
GET    /contacts/:id/tasks
GET    /contacts/:id/conversations
GET    /contacts/:id/notes
POST   /contacts/:id/notes
POST   /contacts/import              -- importação CSV
```

### Equipes
```
GET    /teams
POST   /teams
GET    /teams/:id
PUT    /teams/:id
DELETE /teams/:id
POST   /teams/:id/members
DELETE /teams/:id/members/:userId
```

### Usuários
```
GET    /users
GET    /users/:id
PUT    /users/:id
PATCH  /users/:id/role
```

### Tarefas
```
GET    /tasks                        -- filtros: status, responsible, team, contact, overdue
POST   /tasks
GET    /tasks/:id
PUT    /tasks/:id
PATCH  /tasks/:id/status
DELETE /tasks/:id
```

### Produtos
```
GET    /products
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id
PATCH  /products/:id/stock           -- ajuste de estoque
```

### WhatsApp — Instâncias
```
GET    /whatsapp/instances
POST   /whatsapp/instances
DELETE /whatsapp/instances/:id
GET    /whatsapp/instances/:id/qrcode       -- QR Code (não oficial)
POST   /whatsapp/instances/:id/disconnect
```

### WhatsApp — Conversas
```
GET    /conversations                -- filtros: status, team, assignee, tags, instance
GET    /conversations/:id
PATCH  /conversations/:id/assign     -- atribuir agente/equipe
PATCH  /conversations/:id/transfer   -- transferir agente/equipe
PATCH  /conversations/:id/status     -- abrir/fechar/pendente
POST   /conversations/:id/tags
DELETE /conversations/:id/tags/:tag
GET    /conversations/:id/messages
POST   /conversations/:id/messages   -- enviar mensagem
POST   /conversations/:id/messages/audio  -- enviar áudio gravado
```

### Webhooks (receber do Evolution API e Meta)
```
POST   /webhooks/evolution/:instanceId
POST   /webhooks/meta
```

### Custom Fields (admin)
```
GET    /custom-fields/:entityType
POST   /custom-fields
PUT    /custom-fields/:id
DELETE /custom-fields/:id
```

---

## 🖥️ ESTRUTURA DO FRONTEND

```
src/
├── api/                    # chamadas ao backend (axios/fetch)
│   ├── deals.ts
│   ├── contacts.ts
│   ├── conversations.ts
│   └── ...
├── components/
│   ├── crm/
│   │   ├── KanbanBoard.tsx       # drag & drop com @dnd-kit
│   │   ├── KanbanColumn.tsx      # etapa: nome + contagem + valor total
│   │   ├── DealCard.tsx
│   │   ├── DealListView.tsx
│   │   ├── DealForm.tsx
│   │   └── PipelineSelector.tsx
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── ConversationWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── AudioRecorder.tsx     # MediaRecorder API
│   │   ├── FileUpload.tsx
│   │   └── TransferModal.tsx
│   ├── contacts/
│   │   ├── ContactList.tsx
│   │   ├── ContactDetail.tsx
│   │   └── ContactForm.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   └── TaskForm.tsx
│   ├── products/
│   │   ├── ProductList.tsx
│   │   └── ProductForm.tsx
│   └── shared/
│       ├── CustomFields.tsx
│       ├── NotesPanel.tsx
│       ├── TagInput.tsx
│       └── ...
├── pages/
│   ├── CRM.tsx
│   ├── Chat.tsx
│   ├── Contacts.tsx
│   ├── Tasks.tsx
│   ├── Products.tsx
│   ├── Teams.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useRealtime.ts    # Supabase Realtime para chat
│   ├── useDeals.ts
│   └── ...
└── stores/               # Zustand
    ├── authStore.ts
    ├── chatStore.ts
    └── ...
```

---

## 📡 FLUXO DO WHATSAPP (Recebimento)

```
WhatsApp → Evolution API / Meta Webhook
         → POST /webhooks/evolution/:instanceId
         → Backend processa:
             1. Busca ou cria contato (pelo telefone)
             2. Busca ou cria conversa
             3. Salva mensagem na tabela messages
             4. Salva mídia no Supabase Storage (se houver)
             5. Emite evento Supabase Realtime
         → Frontend recebe via Realtime:
             6. Atualiza lista de conversas
             7. Adiciona mensagem na janela aberta
```

## 📤 FLUXO DO WHATSAPP (Envio)

```
Frontend → POST /conversations/:id/messages
         → Backend:
             1. Identifica instância (oficial ou não oficial)
             2. Se não oficial: chama Evolution API
             3. Se oficial: chama Meta Cloud API
             4. Salva mensagem com status 'sent'
             5. Retorna a mensagem salva
```

---

## 🎯 ORDEM DE DESENVOLVIMENTO (MVP Faseado)

### FASE 1 — Base (2 semanas)
- [ ] Setup Fastify + TypeScript + Supabase
- [ ] Auth (login, JWT, RLS)
- [ ] CRUD de Organizações, Usuários, Equipes
- [ ] CRUD de Contatos (completo com campos personalizados)
- [ ] CRUD de Produtos
- [ ] CRUD de Tarefas

### FASE 2 — CRM (2 semanas)
- [ ] CRUD de Pipelines e Etapas
- [ ] CRUD de Deals com produtos vinculados
- [ ] Kanban com drag & drop (@dnd-kit)
- [ ] Visualização em lista
- [ ] Contagem e valor total por etapa
- [ ] Campos personalizados em negócios
- [ ] Notas em contatos e negócios

### FASE 3 — WhatsApp (2 semanas)
- [ ] Integração Evolution API (QR Code, envio, recebimento)
- [ ] Integração Meta Cloud API (webhooks, envio)
- [ ] Tabelas conversations e messages
- [ ] Realtime via Supabase
- [ ] Interface de chat (lista + janela)
- [ ] Envio de texto, imagem, documento, áudio gravado

### FASE 4 — Polimento (1 semana)
- [ ] Filtros avançados em todas as telas
- [ ] Transferência de atendente/equipe
- [ ] Tags em conversas e contatos
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Deploy backend (Railway ou VPS Docker)

---

## 🔐 MULTI-TENANT COM RLS (Supabase)

Todas as tabelas têm `organization_id`. A política RLS padrão:

```sql
-- Exemplo para tabela deals
CREATE POLICY "org_isolation" ON deals
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

O JWT do usuário carrega o `organization_id` via custom claims no Supabase Auth, garantindo isolamento total entre organizações.

---

## 📂 ESTRUTURA DE PASTAS DO PROJETO

```
/
├── backend/                  # Fastify API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── plugins/
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # React App
│   ├── src/
│   ├── package.json
│   └── Dockerfile (opcional)
└── docker-compose.yml        # orquestração local
```

---
*MVP planejado para ~7 semanas de desenvolvimento solo*
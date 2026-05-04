> Full MVP specification (schema, phases, architecture diagram): see `.github/MVP_SPEC.md`

# Copilot Instructions — CRM + WhatsApp Platform

## Project Overview
Full-stack SaaS platform with CRM (multi-pipeline Kanban), WhatsApp attendance (official + unofficial), contact management, tasks, teams, and products. Multi-tenant architecture with organization-based isolation.

## Repository Structure
```
/
├── backend/          # Fastify REST API (TypeScript)
├── frontend/         # React + Vite + TypeScript
└── docker-compose.yml
```

---

## BACKEND

### Stack
- **Runtime:** Node.js 20+
- **Framework:** Fastify 4 with TypeScript
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Auth:** Supabase Auth (JWT) — always validate with `request.user.organization_id`
- **Realtime:** Supabase Realtime channels (chat messages)
- **Storage:** Supabase Storage (WhatsApp media files)
- **WhatsApp unofficial:** Evolution API (REST calls to `EVOLUTION_API_URL`)
- **WhatsApp official:** Meta Cloud API (webhook receiver + graph API sender)
- **Validation:** Zod schemas on all routes
- **Deploy:** Docker container on VPS (Hostinger KVM)

### Folder Structure (`backend/src/`)
```
routes/
  auth.ts
  pipelines.ts
  deals.ts
  contacts.ts
  teams.ts
  users.ts
  tasks.ts
  products.ts
  conversations.ts
  messages.ts
  whatsapp.ts
  webhooks.ts
  custom-fields.ts
services/
  supabase.ts       # Supabase client singleton
  evolution.ts      # Evolution API wrapper
  meta.ts           # Meta Cloud API wrapper
  storage.ts        # Supabase Storage helpers
plugins/
  auth.ts           # JWT verification Fastify plugin
  multipart.ts      # File upload (fastify-multipart)
types/
  index.ts          # All shared TypeScript types/interfaces
```

### Coding Conventions (Backend)
- Every route file exports a Fastify plugin: `export default async function (app: FastifyInstance)`
- All routes require auth unless explicitly marked public
- Always extract `organization_id` from `request.user` — never from request body
- Use Zod for input validation: `const body = BodySchema.parse(request.body)`
- Return errors as: `reply.code(400).send({ error: 'message' })`
- Supabase queries always filter by `organization_id` — RLS is the safety net, but always filter explicitly too
- Services never import from routes; routes import from services
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `META_WEBHOOK_TOKEN`, `META_ACCESS_TOKEN`

### Route Pattern Example
```typescript
// GET /deals with pagination and filters
app.get('/deals', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { pipeline_id, stage_id, page = 1, limit = 50 } = QuerySchema.parse(request.query)
  const { organization_id } = request.user

  const { data, error } = await supabase
    .from('deals')
    .select('*, contact:contacts(id,name,phone), stage:pipeline_stages(id,name)')
    .eq('organization_id', organization_id)
    .eq('pipeline_id', pipeline_id)
    .order('position')
    .range((page - 1) * limit, page * limit - 1)

  if (error) return reply.code(500).send({ error: error.message })
  return reply.send({ data })
})
```

---

## FRONTEND

### Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS + shadcn/ui components
- **State:** Zustand (global: auth, chat) + TanStack Query (server state)
- **Routing:** React Router v6
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable (Kanban)
- **Forms:** React Hook Form + Zod resolver
- **HTTP:** axios instance with base URL and auth header interceptor
- **Realtime:** Supabase Realtime client (chat only)
- **Audio recording:** Native `MediaRecorder` API — no library
- **Deploy:** Vercel

### Folder Structure (`frontend/src/`)
```
api/            # axios functions per entity (deals.ts, contacts.ts, etc.)
components/
  crm/          # KanbanBoard, KanbanColumn, DealCard, DealForm, DealListView
  chat/         # ConversationList, ConversationWindow, MessageBubble, AudioRecorder, FileUpload, TransferModal
  contacts/     # ContactList, ContactDetail, ContactForm
  tasks/        # TaskList, TaskForm
  products/     # ProductList, ProductForm
  teams/        # TeamList, TeamForm
  shared/       # CustomFieldsEditor, NotesPanel, TagInput, Avatar, Badge, ConfirmDialog
pages/          # CRM.tsx, Chat.tsx, Contacts.tsx, Tasks.tsx, Products.tsx, Teams.tsx, Settings.tsx
hooks/          # useRealtime.ts, useDeals.ts, useContacts.ts, useTasks.ts
stores/         # authStore.ts (Zustand), chatStore.ts (Zustand)
lib/            # axios.ts (instance), supabase.ts (client), utils.ts
```

### Coding Conventions (Frontend)
- All components are functional with TypeScript props interfaces
- shadcn/ui components are in `components/ui/` — never modify them
- API calls live in `api/` folder — components use TanStack Query hooks, never raw fetch
- Forms use React Hook Form + Zod schema validated with `zodResolver`
- Tailwind only — no inline styles, no CSS modules
- Icons: `lucide-react` only
- Currency: always format in BRL — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Dates: `date-fns` with `pt-BR` locale
- Empty states: every list must have an empty state component
- Loading states: use shadcn Skeleton components

### Kanban Implementation Notes
- Use `@dnd-kit/core` `DndContext` wrapping the entire board
- Each column is a `SortableContext` with `verticalListSortingStrategy`
- On `onDragEnd`: optimistic update locally + call `PATCH /deals/:id/move` with `{ stage_id, position }`
- Each `KanbanColumn` header shows: stage name + deal count badge + total value formatted in BRL
- Cards show: deal name, contact name, value, responsible avatar, tags

### AudioRecorder Component Notes
- Use `MediaRecorder` with `audio/webm` or `audio/ogg` MIME type
- On stop: create `Blob`, convert to `File`, upload via `POST /conversations/:id/messages/audio` as `multipart/form-data`
- Show waveform timer while recording
- Replicate WhatsApp UX: hold to record, release to send, swipe to cancel

### Chat Realtime Notes
- Subscribe to Supabase channel `messages:conversation_id=eq.{id}`
- On INSERT event: append message to local state without refetch
- `chatStore` holds: `activeConversationId`, `conversations[]`, `messages{}` keyed by conversation_id

---

## DATABASE SCHEMA (Key Tables)

```sql
-- All tables have: id uuid PK, organization_id uuid FK, created_at timestamptz

organizations     -- tenant root
users             -- linked to auth.users, has role: admin|supervisor|agent
teams             -- name, description, access_type, members via team_members
contacts          -- PF/PJ, CPF/CNPJ, full address, tags[], assigned_user_id, assigned_team_id
pipelines         -- multi-pipeline CRM
pipeline_stages   -- name, position, color per pipeline
deals             -- name, contact_id, stage_id, value, responsible_user_id, position, status(open/won/lost)
deal_products     -- junction: deal <> products with qty, unit_price, discount
products          -- name, value, unit, stock, category, promo_type(percent|fixed), promo_value
tasks             -- name, description, responsible_id, team_id, contact_id, deal_id, due_date, status
whatsapp_instances-- type: official|unofficial, status, evolution_instance_name, meta_phone_id
conversations     -- instance_id, contact_id, assigned_user_id, assigned_team_id, status, tags[]
messages          -- conversation_id, from_me, message_type, content, media_url, whatsapp_id
notes             -- polymorphic: entity_type(contact|deal|task), entity_id, content
custom_field_definitions -- organization-level field schema per entity_type
contact_custom_fields    -- key-value per contact
deal_custom_fields       -- key-value per deal
```

### RLS Pattern (apply to ALL tables)
```sql
CREATE POLICY "org_isolation" ON {table}
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
```

---

## WHATSAPP INTEGRATION

### Evolution API (Unofficial)
- Base URL: `process.env.EVOLUTION_API_URL`
- Key header: `apikey: process.env.EVOLUTION_API_KEY`
- Create instance: `POST /instance/create`
- QR Code: `GET /instance/connect/{instanceName}`
- Send text: `POST /message/sendText/{instanceName}`
- Send media: `POST /message/sendMedia/{instanceName}`
- Webhook config: `POST /webhook/set/{instanceName}` pointing to `POST /webhooks/evolution/:instanceId`

### Meta Cloud API (Official)
- Verify webhook: `GET /webhooks/meta` — validate `hub.challenge` with `META_WEBHOOK_TOKEN`
- Receive messages: `POST /webhooks/meta` — parse `entry[0].changes[0].value`
- Send message: `POST https://graph.facebook.com/v19.0/{phone_number_id}/messages`
- Auth header: `Authorization: Bearer {META_ACCESS_TOKEN}`

### Webhook Processing (both sources)
1. Extract: phone, message content, type, media
2. `upsert` contact by phone within organization
3. `upsert` conversation by (instance_id + contact_id)
4. Insert message record
5. If media: download + upload to Supabase Storage + save `media_url`
6. Emit Supabase Realtime event (automatic via DB insert)

---

## ENVIRONMENT VARIABLES

### Backend (`.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=        # service role — backend only, never expose
JWT_SECRET=                  # same secret as Supabase JWT secret
EVOLUTION_API_URL=           # http://seu-vps:8080
EVOLUTION_API_KEY=
META_WEBHOOK_TOKEN=
META_ACCESS_TOKEN=
PORT=3333
```

### Frontend (`.env`)
```
VITE_API_URL=                # backend URL
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=      # anon key only — never service key
```

---

## DEVELOPMENT COMMANDS

```bash
# Backend
cd backend && npm run dev      # nodemon + ts-node
cd backend && npm run build    # tsc
cd backend && npm run start    # node dist/index.js

# Frontend
cd frontend && npm run dev
cd frontend && npm run build

# Docker (full stack local)
docker-compose up --build
```

---

## API RESPONSE STANDARDS

```typescript
// Success list
{ data: T[], total: number, page: number, limit: number }

// Success single
{ data: T }

// Error
{ error: string, details?: Record<string, string> }

// Pagination query params (all list routes)
?page=1&limit=50&search=&sort_by=created_at&sort_order=desc
```

---

## KEY BUSINESS RULES

1. **Deals position in stage:** `position` is 0-indexed per `(stage_id)`. On drag: update all affected positions in a single DB transaction.
2. **Stage totals:** computed via SQL — `SUM(value)` and `COUNT(id)` grouped by `stage_id`. Never stored.
3. **Days overdue on tasks:** `CURRENT_DATE - due_date` when `status != 'done'`. Computed in query, not stored.
4. **Contact deduplication:** unique by `(organization_id, phone)`. On WhatsApp message: upsert by phone.
5. **Product discount:** if `promo_type = 'percent'`, final price = `value * (1 - promo_value/100)`. If `'fixed'`, final price = `value - promo_value`.
6. **Deal total value:** `SUM(deal_products.quantity * deal_products.unit_price * (1 - discount/100))`. Updated on deal_products change.
7. **Team access control:** `access_type = 'team_only'` means agents only see conversations/deals assigned to their team.
8. **WhatsApp instance assignment:** an instance can be assigned to a team — new conversations from that instance auto-assign to that team.
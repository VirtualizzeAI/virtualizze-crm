# Virtualizze CRM

Plataforma SaaS multi-tenant para CRM visual com múltiplos funis, atendimento WhatsApp oficial e não oficial, gestão de contatos, tarefas, equipes e catálogo de produtos.

As especificações-base do projeto estão em [.gtihub/copilot-instructions.md](.gtihub/copilot-instructions.md) e [.gtihub/MVP_SPEC.md](.gtihub/MVP_SPEC.md).

## Stack

- Backend: Fastify 4, TypeScript, Supabase SDK, Zod, JWT, multipart.
- Frontend: React 18, Vite, TypeScript, TailwindCSS, React Router, TanStack Query, Zustand.
- Banco e plataforma: Supabase PostgreSQL, Auth, Realtime e Storage.
- Integrações: Evolution API e Meta Cloud API.

## Estrutura

```text
.
├── backend/
│   ├── src/
│   │   ├── plugins/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── stores/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── supabase/
│   └── migrations/
└── docker-compose.yml
```

## Setup

1. Instale as dependências do backend.

```bash
cd backend
npm install
```

2. Instale as dependências do frontend.

```bash
cd frontend
npm install
```

3. Crie os arquivos de ambiente a partir dos exemplos.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Preencha as credenciais do Supabase e das integrações WhatsApp.

5. Aplique as migrations no projeto Supabase.

6. Suba os serviços em desenvolvimento.

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Docker Compose

Para desenvolvimento local com containers:

```bash
docker compose up --build
```

O backend fica exposto em http://localhost:3333 e o frontend em http://localhost:5173.

## Variáveis de Ambiente

### Backend

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=
JWT_SECRET=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
META_WEBHOOK_TOKEN=
META_ACCESS_TOKEN=
PORT=3333
```

### Frontend

```env
VITE_API_URL=http://localhost:3333
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Observações

- O backend já registra todos os plugins de rota do MVP como placeholders prontos para implementação incremental.
- O frontend já inclui rotas principais para login, CRM, chat, contatos, tarefas, produtos, equipes e configurações.
- As migrations iniciais cobrem schema completo e RLS por organização conforme o MVP.
> Full MVP specification: `.github/MVP_SPEC.md` — read this before implementing any feature.

# AGENTS.md — Coding Agent Guide

This file tells AI coding agents (GitHub Copilot, Claude Code, etc.) how to work in this repository.

---

## What This Project Is
A multi-tenant SaaS platform combining a visual CRM (multi-pipeline Kanban) with WhatsApp attendance (official + unofficial), contact management, tasks, teams, and product catalog. Full spec is in `.github/copilot-instructions.md`.

## How the Repo Is Split

| Folder | Purpose | Key tech |
|---|---|---|
| `backend/` | REST API, business logic, webhooks | Fastify, TypeScript, Supabase |
| `frontend/` | SPA user interface | React, Vite, TypeScript, Tailwind, shadcn/ui |

Never mix frontend and backend code. Never import backend modules in frontend and vice versa.

---

## Agent Task Workflow

When asked to implement a feature:

1. **Read** `.github/copilot-instructions.md` first — it has the full schema, conventions, and patterns.
2. **Backend first:** create/update route → service → Zod schema → types.
3. **Frontend second:** create/update API function in `api/` → hook → component → page.
4. **Always** add the new route to `backend/src/index.ts` plugin registration.
5. **Always** export new components from their folder's `index.ts`.

---

## Non-Negotiable Rules

- `organization_id` always comes from `request.user` on the backend — never from request body or params.
- Never use `any` in TypeScript — use proper types from `types/index.ts`.
- Never call Supabase directly from frontend components — use `api/` functions via TanStack Query.
- Never store computed values (stage totals, days overdue, deal total) — always compute in SQL or service layer.
- Always handle loading + error + empty states in UI components.
- Zod schema for every route input (body, params, query).
- RLS is the safety net — but always add `.eq('organization_id', org_id)` to every Supabase query too.

---

## File Creation Checklist

### New Backend Entity (e.g. `widgets`)
- [ ] `backend/src/routes/widgets.ts` — Fastify plugin with all CRUD routes
- [ ] `backend/src/services/widgets.ts` — DB queries isolated from routes
- [ ] Types added to `backend/src/types/index.ts`
- [ ] Route registered in `backend/src/index.ts`
- [ ] Migration SQL added to `supabase/migrations/`

### New Frontend Entity
- [ ] `frontend/src/api/widgets.ts` — axios calls matching backend routes
- [ ] `frontend/src/hooks/useWidgets.ts` — TanStack Query hooks
- [ ] `frontend/src/components/widgets/WidgetList.tsx`
- [ ] `frontend/src/components/widgets/WidgetForm.tsx`
- [ ] `frontend/src/pages/Widgets.tsx`
- [ ] Route added to `frontend/src/App.tsx`
- [ ] Nav link added to sidebar

---

## Supabase Migration Naming

```
supabase/migrations/
  001_initial_schema.sql
  002_rls_policies.sql
  003_seed_data.sql
  004_add_widgets.sql    ← always increment, always descriptive
```

---

## Git Commit Convention

```
feat(crm): add drag-and-drop deal reordering
fix(chat): audio recorder not stopping on Firefox
chore(backend): add index on deals.stage_id
docs: update API endpoints in copilot-instructions
```

Format: `type(scope): description`
Types: `feat` | `fix` | `chore` | `docs` | `refactor` | `test`
Scopes: `crm` | `chat` | `contacts` | `tasks` | `products` | `teams` | `auth` | `backend` | `frontend` | `infra`

---

## Testing Priorities

1. Webhook processing (Evolution + Meta) — unit test the parsing logic
2. Deal position update on drag — must be atomic (transaction)
3. RLS isolation — test that org A cannot read org B's data
4. Audio recording upload — test blob → multipart → storage flow

---

## Common Pitfalls to Avoid

| ❌ Don't | ✅ Do instead |
|---|---|
| Store `days_overdue` in DB | Compute: `CURRENT_DATE - due_date` in query |
| Store `stage_total_value` | Compute: `SUM(value)` with GROUP BY |
| Call Evolution API from frontend | Always proxy through backend routes |
| Expose `SUPABASE_SERVICE_KEY` to frontend | Use `SUPABASE_ANON_KEY` on frontend only |
| Use `useEffect` for data fetching | Use TanStack Query `useQuery` |
| Hardcode `organization_id` in tests | Use factory helpers with unique org per test |
| Send full conversation history to Realtime | Let Supabase DB trigger handle broadcast |
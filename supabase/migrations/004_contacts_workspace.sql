begin;

alter table public.contacts
  add column if not exists created_by_type text not null default 'user' check (created_by_type in ('user', 'automation')),
  add column if not exists created_by_user_id uuid references public.users(id) on delete set null;

create table if not exists public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  title text not null,
  content text not null,
  attachment_url text,
  created_by_type text not null default 'user' check (created_by_type in ('user', 'automation')),
  created_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  note_id uuid references public.contact_notes(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  source text not null default 'standalone' check (source in ('standalone', 'note')),
  uploaded_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  event_type text not null check (event_type in ('contact_created', 'contact_updated', 'note_created', 'attachment_added', 'custom_field_updated')),
  description text not null,
  actor_type text not null default 'user' check (actor_type in ('user', 'automation')),
  actor_user_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists contacts_created_by_idx on public.contacts (organization_id, created_by_user_id);
create index if not exists contact_notes_org_contact_idx on public.contact_notes (organization_id, contact_id, created_at desc);
create index if not exists contact_attachments_org_contact_idx on public.contact_attachments (organization_id, contact_id, created_at desc);
create index if not exists contact_timeline_org_contact_idx on public.contact_timeline_events (organization_id, contact_id, created_at desc);

alter table public.contact_notes enable row level security;
alter table public.contact_attachments enable row level security;
alter table public.contact_timeline_events enable row level security;

create policy if not exists contact_notes_org_isolation on public.contact_notes
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy if not exists contact_attachments_org_isolation on public.contact_attachments
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy if not exists contact_timeline_events_org_isolation on public.contact_timeline_events
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

commit;

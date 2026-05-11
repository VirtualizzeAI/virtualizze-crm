begin;

create extension if not exists pg_trgm;

create index if not exists contacts_name_trgm_idx
  on public.contacts
  using gin (name gin_trgm_ops);

create index if not exists contacts_phone_trgm_idx
  on public.contacts
  using gin (phone gin_trgm_ops)
  where phone is not null;

create index if not exists contacts_email_trgm_idx
  on public.contacts
  using gin (email gin_trgm_ops)
  where email is not null;

create index if not exists contacts_org_updated_idx
  on public.contacts (organization_id, updated_at desc);

commit;
begin;

-- Permite telefones duplicados por organização.
-- Alguns ambientes podem ter criado como unique index, outros como unique constraint.
drop index if exists public.contacts_org_phone_key;

alter table public.contacts
  drop constraint if exists contacts_org_phone_key;

commit;

begin;

alter table public.contacts
  add column if not exists street_number text,
  add column if not exists reference text;

commit;

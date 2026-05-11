create table public.contacts (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  type text null,
  name text not null,
  document text null,
  phone text null,
  email text null,
  description text null,
  street text null,
  neighborhood text null,
  city text null,
  state text null,
  zip_code text null,
  country text not null default 'Brasil'::text,
  complement text null,
  assigned_user_id uuid null,
  assigned_team_id uuid null,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint contacts_pkey primary key (id),
  constraint contacts_assigned_team_id_fkey foreign KEY (assigned_team_id) references teams (id) on delete set null,
  constraint contacts_assigned_user_id_fkey foreign KEY (assigned_user_id) references users (id) on delete set null,
  constraint contacts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint contacts_type_check check ((type = any (array['PF'::text, 'PJ'::text])))
) TABLESPACE pg_default;

create index IF not exists contacts_organization_id_idx on public.contacts using btree (organization_id) TABLESPACE pg_default;

create unique INDEX IF not exists contacts_org_phone_key on public.contacts using btree (organization_id, phone) TABLESPACE pg_default
where
  (phone is not null);

create index IF not exists contacts_assigned_user_id_idx on public.contacts using btree (organization_id, assigned_user_id) TABLESPACE pg_default;

create index IF not exists contacts_assigned_team_id_idx on public.contacts using btree (organization_id, assigned_team_id) TABLESPACE pg_default;

create index IF not exists contacts_tags_idx on public.contacts using gin (tags) TABLESPACE pg_default;

create trigger set_contacts_updated_at BEFORE
update on contacts for EACH row
execute FUNCTION set_updated_at ();
begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  avatar_url text,
  role text not null check (role in ('admin', 'supervisor', 'agent')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  access_type text not null check (access_type in ('all_contacts', 'assigned_only', 'team_only')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (team_id, user_id)
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  position integer not null,
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (pipeline_id, position)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text check (type in ('PF', 'PJ')),
  name text not null,
  document text,
  phone text,
  email text,
  description text,
  street text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  country text not null default 'Brasil',
  complement text,
  assigned_user_id uuid references public.users(id) on delete set null,
  assigned_team_id uuid references public.teams(id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.contact_custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  field_key text not null,
  field_value text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (contact_id, field_key)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  value numeric(14, 2) not null,
  unit text,
  category text,
  stock numeric(14, 2) not null default 0,
  promo_type text check (promo_type in ('percent', 'fixed')),
  promo_value numeric(14, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  name text not null,
  contact_id uuid references public.contacts(id) on delete set null,
  phone text,
  email text,
  description text,
  notes text,
  value numeric(14, 2) not null default 0,
  responsible_user_id uuid references public.users(id) on delete set null,
  responsible_team_id uuid references public.teams(id) on delete set null,
  tags text[] not null default '{}',
  position integer not null default 0,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.deal_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(14, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  subtotal numeric(14, 2) generated always as ((quantity * unit_price) - discount) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (deal_id, product_id)
);

create table public.deal_custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  field_key text not null,
  field_value text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (deal_id, field_key)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  responsible_id uuid references public.users(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  due_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('official', 'unofficial')),
  phone_number text,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'qr_pending')),
  evolution_instance_name text,
  meta_phone_id text,
  meta_token text,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  instance_id uuid not null references public.whatsapp_instances(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  assigned_user_id uuid references public.users(id) on delete set null,
  assigned_team_id uuid references public.teams(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  tags text[] not null default '{}',
  notes text,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, instance_id, contact_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  from_me boolean not null,
  message_type text not null check (message_type in ('text', 'image', 'audio', 'video', 'document', 'sticker')),
  content text,
  media_url text,
  media_mime text,
  file_name text,
  duration integer check (duration is null or duration >= 0),
  status text check (status in ('sent', 'delivered', 'read', 'failed')),
  whatsapp_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'deal', 'task')),
  entity_id uuid not null,
  user_id uuid references public.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'deal')),
  field_key text not null,
  field_label text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'select', 'boolean')),
  options jsonb,
  is_required boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, entity_type, field_key)
);

create index organizations_slug_idx on public.organizations (slug);
create index users_organization_id_idx on public.users (organization_id);
create index teams_organization_id_idx on public.teams (organization_id);
create index team_members_organization_id_idx on public.team_members (organization_id);
create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_user_id_idx on public.team_members (user_id);
create index pipelines_organization_id_idx on public.pipelines (organization_id, is_active);
create index pipeline_stages_pipeline_id_idx on public.pipeline_stages (pipeline_id, position);
create index pipeline_stages_organization_id_idx on public.pipeline_stages (organization_id);
create index contacts_organization_id_idx on public.contacts (organization_id);
create index contacts_assigned_user_id_idx on public.contacts (organization_id, assigned_user_id);
create index contacts_assigned_team_id_idx on public.contacts (organization_id, assigned_team_id);
create index contacts_tags_idx on public.contacts using gin (tags);
create index contact_custom_fields_org_contact_idx on public.contact_custom_fields (organization_id, contact_id);
create index products_organization_id_idx on public.products (organization_id, is_active);
create index deals_pipeline_stage_position_idx on public.deals (organization_id, pipeline_id, stage_id, position);
create index deals_contact_id_idx on public.deals (organization_id, contact_id);
create index deals_responsible_user_idx on public.deals (organization_id, responsible_user_id);
create index deals_responsible_team_idx on public.deals (organization_id, responsible_team_id);
create index deals_status_idx on public.deals (organization_id, status);
create index deals_tags_idx on public.deals using gin (tags);
create index deal_products_org_deal_idx on public.deal_products (organization_id, deal_id);
create index deal_custom_fields_org_deal_idx on public.deal_custom_fields (organization_id, deal_id);
create index tasks_status_due_date_idx on public.tasks (organization_id, status, due_date);
create index tasks_responsible_idx on public.tasks (organization_id, responsible_id);
create index tasks_team_idx on public.tasks (organization_id, team_id);
create index tasks_contact_idx on public.tasks (organization_id, contact_id);
create index tasks_deal_idx on public.tasks (organization_id, deal_id);
create index whatsapp_instances_org_idx on public.whatsapp_instances (organization_id, type, status);
create index conversations_status_last_message_idx on public.conversations (organization_id, status, last_message_at desc);
create index conversations_assigned_user_idx on public.conversations (organization_id, assigned_user_id);
create index conversations_assigned_team_idx on public.conversations (organization_id, assigned_team_id);
create index conversations_tags_idx on public.conversations using gin (tags);
create index messages_conversation_created_at_idx on public.messages (organization_id, conversation_id, created_at);
create unique index messages_org_whatsapp_id_key on public.messages (organization_id, whatsapp_id) where whatsapp_id is not null;
create index notes_entity_idx on public.notes (organization_id, entity_type, entity_id);
create index custom_field_definitions_entity_idx on public.custom_field_definitions (organization_id, entity_type, position);

create trigger set_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create trigger set_deals_updated_at
before update on public.deals
for each row
execute function public.set_updated_at();

commit;
begin;

create or replace function public.auth_org_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'organization_id', '')::uuid
$$;

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_custom_fields enable row level security;
alter table public.products enable row level security;
alter table public.deals enable row level security;
alter table public.deal_products enable row level security;
alter table public.deal_custom_fields enable row level security;
alter table public.tasks enable row level security;
alter table public.whatsapp_instances enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notes enable row level security;
alter table public.custom_field_definitions enable row level security;

create policy organizations_org_isolation on public.organizations
for all
using (id = public.auth_org_id())
with check (id = public.auth_org_id());

create policy users_org_isolation on public.users
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy teams_org_isolation on public.teams
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy team_members_org_isolation on public.team_members
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy pipelines_org_isolation on public.pipelines
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy pipeline_stages_org_isolation on public.pipeline_stages
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy contacts_org_isolation on public.contacts
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy contact_custom_fields_org_isolation on public.contact_custom_fields
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy products_org_isolation on public.products
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy deals_org_isolation on public.deals
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy deal_products_org_isolation on public.deal_products
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy deal_custom_fields_org_isolation on public.deal_custom_fields
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy tasks_org_isolation on public.tasks
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy whatsapp_instances_org_isolation on public.whatsapp_instances
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy conversations_org_isolation on public.conversations
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy messages_org_isolation on public.messages
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy notes_org_isolation on public.notes
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

create policy custom_field_definitions_org_isolation on public.custom_field_definitions
for all
using (organization_id = public.auth_org_id())
with check (organization_id = public.auth_org_id());

commit;